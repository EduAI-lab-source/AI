import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { buildEduAiMessages, getTextResponse } from "./eduAi";
import { hasValidEduAiGateway } from "./eduAiGateway";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

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
});

export type AppRouter = typeof appRouter;
