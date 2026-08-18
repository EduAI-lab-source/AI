import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { buildEduAiMessages, getTextResponse } from "./eduAi";
import { hasValidEduAiGateway } from "./eduAiGateway";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createSharedLearningLink, getAccountEncryptedWorkspace, getCreditBalance, getEncryptedWorkspace, getPublicSharedLearningLink, listSharedLearningLinks, reserveTtsQuota, revokeSharedLearningLink, saveAccountEncryptedWorkspace, saveEncryptedWorkspace } from "./db";
import { randomBytes, randomUUID } from "node:crypto";
import { getCreditReadiness } from "./credits";
import { createTtsNetworkIdentity, TTS_MAX_CHARACTERS_PER_SYNTHESIS } from "./ttsQuota";

const REQUEST_LIMIT = 18;
const REQUEST_WINDOW_MS = 5 * 60 * 1000;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

function assertRateLimit(request: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  const key = forwardedIp?.trim() || request.ip || "anonymous";
  const now = Date.now();
  const current = requestWindows.get(key);

  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return;
  }

  if (current.count >= REQUEST_LIMIT) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Edu AI está recibiendo muchas preguntas. Espera unos minutos antes de continuar.",
    });
  }

  current.count += 1;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  eduAi: router({
    chat: publicProcedure
      .input(
        z.object({
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().trim().min(1).max(6000),
              })
            )
            .min(1)
            .max(20),
          responseStyle: z.enum(["brief", "deep", "creative", "study"]).optional(),
          imageAttachment: z.object({
            name: z.string().trim().min(1).max(120),
            dataUrl: z.string().max(3_400_000).regex(/^data:image\/(png|jpeg|webp|gif);base64,/, "La imagen adjunta debe ser un formato compatible."),
          }).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "La puerta segura de Edu AI no autorizó esta solicitud.",
          });
        }
        assertRateLimit(ctx.req);

        try {
          const response = await invokeLLM({
            model: "gpt-5-mini",
            messages: buildEduAiMessages(input.messages, input.responseStyle, input.imageAttachment),
          });
          const content = getTextResponse(response.choices[0]?.message.content ?? "");

          if (!content) {
            throw new Error("El modelo no devolvió una respuesta de texto");
          }

          return { content };
        } catch (error) {
          console.error("[Edu AI] Chat request failed", error);
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Edu AI no pudo responder en este momento. Inténtalo de nuevo en unos segundos.",
          });
        }
      }),
  }),
  tts: router({
    reserve: publicProcedure
      .input(z.object({
        visitorId: z.string().uuid(),
        characters: z.number().int().min(1).max(TTS_MAX_CHARACTERS_PER_SYNTHESIS),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la síntesis de voz." });
        }
        const forwarded = ctx.req.headers["x-forwarded-for"];
        const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
        const clientIp = forwardedIp?.trim() ?? ctx.req.ip ?? "anonymous";
        const visitorHash = createTtsNetworkIdentity(clientIp, process.env.EDU_AI_GATEWAY_SECRET ?? "tts-fallback-secret");

        try {
          const decision = await reserveTtsQuota({ visitorHash, characters: input.characters });
          if (!decision.allowed) {
            const messages = {
              visitor_requests: "Ya usaste el audio gratuito disponible hoy. Vuelve mañana para continuar.",
              visitor_characters: "El texto supera tu cuota diaria de voz. Prueba con un fragmento más corto o vuelve mañana.",
              shared_capacity: "La capacidad gratuita de voz de hoy ya se agotó. Vuelve a intentarlo mañana.",
            } as const;
            throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: messages[decision.reason] });
          }
          return { allowed: true, remainingCharacters: decision.remainingVisitorCharacters, remainingSharedCharacters: decision.remainingGlobalCharacters };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[TTS] Failed to reserve capacity", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La voz de Edu AI no está disponible en este momento." });
        }
      }),
  }),
  credits: router({
    readiness: publicProcedure.query(() => getCreditReadiness()),
    account: protectedProcedure.query(async ({ ctx }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la consulta de créditos." });
      }
      const balance = await getCreditBalance(ctx.user.id);
      return { ...getCreditReadiness(), balance };
    }),
  }),
  workspace: router({
    sync: publicProcedure
      .input(z.object({
        action: z.enum(["get", "put"]),
        syncId: z.string().regex(/^[A-Za-z0-9_-]{32,96}$/, "El identificador de sincronización no es válido."),
        ciphertext: z.string().min(32).max(1_500_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la sincronización." });
        }
        assertRateLimit(ctx.req);

        if (input.action === "get") {
          const workspace = await getEncryptedWorkspace(input.syncId);
          return {
            found: Boolean(workspace),
            ciphertext: workspace?.ciphertext ?? null,
            updatedAt: workspace?.updatedAt?.toISOString() ?? null,
          };
        }

        if (!input.ciphertext) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Falta la instantánea cifrada para sincronizar." });
        }
        await saveEncryptedWorkspace(input.syncId, input.ciphertext);
        return { saved: true, updatedAt: new Date().toISOString() };
      }),
    accountSync: protectedProcedure
      .input(z.object({
        action: z.enum(["get", "put"]),
        ciphertext: z.string().min(32).max(1_500_000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la sincronización de cuenta." });
        }

        if (input.action === "get") {
          const workspace = await getAccountEncryptedWorkspace(ctx.user.id);
          return { found: Boolean(workspace), ciphertext: workspace?.ciphertext ?? null, updatedAt: workspace?.updatedAt?.toISOString() ?? null };
        }
        if (!input.ciphertext) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Falta la instantánea cifrada para sincronizar." });
        }
        await saveAccountEncryptedWorkspace(ctx.user.id, input.ciphertext);
        return { saved: true, updatedAt: new Date().toISOString() };
      }),
  }),
  sharing: router({
    create: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(160), snapshot: z.string().min(2).max(250_000), expiresInDays: z.number().int().min(1).max(30) })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la compartición." });
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000);
      await createSharedLearningLink({ id: randomUUID(), token, userId: ctx.user.id, kind: "notebook", title: input.title, snapshot: input.snapshot, expiresAt });
      return { token, expiresAt: expiresAt.toISOString() };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la compartición." });
      return listSharedLearningLinks(ctx.user.id);
    }),
    revoke: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la compartición." });
      await revokeSharedLearningLink(ctx.user.id, input.id);
      return { revoked: true };
    }),
    get: publicProcedure.input(z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{32,96}$/) })).query(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autorizó la consulta compartida." });
      const link = await getPublicSharedLearningLink(input.token);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Este enlace no está disponible o ya venció." });
      return { kind: link.kind, title: link.title, snapshot: link.snapshot, expiresAt: link.expiresAt?.toISOString() ?? null };
    }),
  }),
});

export type AppRouter = typeof appRouter;
