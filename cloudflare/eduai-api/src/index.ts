import { createChatReply, getChatInput } from "./chat";

const ALLOWED_ORIGINS = new Set([
  "https://eduai-lab-source.github.io",
  "https://textoavoz.xyz",
  "https://www.textoavoz.xyz",
]);
const TTS_PATH = "/api/tts";
const FEEDBACK_PATH = "/api/trpc/feedback.submit";
const TTS_MODEL = "@cf/deepgram/aura-2-es";
const TTS_MAX_CHARACTERS = 650;
const TTS_DAILY_CHARACTERS_PER_VISITOR = 650;
const TTS_DAILY_CHARACTERS_SHARED = 3_000;
const TTS_DAILY_REQUESTS_PER_VISITOR = 1;
const TTS_GLOBAL_USAGE_KEY = "global-free-tts-capacity";
const SUGGESTION_LIMIT = 3;
const SUGGESTION_WINDOW_MS = 30 * 60 * 1000;
const TTS_SPEAKERS = new Set(["sirio", "nestor", "carina", "celeste", "alvaro", "diana", "aquila", "selena", "estrella", "javier"]);
const EDU_AI_POLITICAL_BOUNDARY_REPLY = "Edu AI no emite opiniones ni calificaciones sobre política, ideologías, gobiernos, presidentes o elecciones. Puedo ayudarte con contexto histórico, conceptos y fuentes desde una explicación descriptiva y plural.";
const POLITICAL_TOPIC_PATTERN = /(politic(?:a|o|as|os|al|ally|ian|ians)?|politics?|political|government|gobierno(?:s)?|president(?:e|es)?|presidency|presidencia|election(?:es)?|elecci(?:ón|ones)|vot(?:o|ar|ación|aciones)|vote|voting|part(?:ido|idos|y|ies)|communis(?:m|t|mo|ta|tas)|comunismo|capitalis(?:m|ta|mo)|socialis(?:m|ta|mo)|fascis(?:m|ta|mo)|dictadura|dictator(?:ship)?|democrac(?:ia|y)|izquierda|derecha|ch[aá]vez|maduro|trump|biden|putin|zelensk(?:y|i)|xi\s*jinping|политик\p{L}*|правительств\p{L}*|президент\p{L}*|выбор\p{L}*|голосова\p{L}*|коммуниз\p{L}*|капитализм\p{L}*|социализм\p{L}*|фашизм\p{L}*|диктатур\p{L}*|демократ\p{L}*|чавес\p{L}*|мадуро)/iu;

type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

type D1Result = { meta?: { changes?: number } };
type D1PreparedStatement = {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<D1Result>;
};
type D1Binding = { prepare(query: string): D1PreparedStatement };

interface Env {
  EDU_AI_GATEWAY_SECRET: string;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  FEEDBACK_RECIPIENT_EMAIL?: string;
  SUGGESTIONS_FROM_EMAIL?: string;
  EDU_AI_DB?: D1Binding;
  AI: AiBinding;
}

function corsHeaders(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Headers();

  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, accept, trpc-accept, x-trpc-batch, x-trpc-source",
    "access-control-allow-credentials": "true",
    "access-control-max-age": "86400",
    vary: "Origin",
  });
}

function withCors(response: Response, origin: string | null) {
  const headers = new Headers(response.headers);
  corsHeaders(origin).forEach((value, key) => headers.set(key, value));
  headers.delete("set-cookie");
  return new Response(response.body, { status: response.status, headers });
}

function forbidden(message: string, origin: string | null) {
  return withCors(
    new Response(JSON.stringify({ error: message }), {
      status: 403,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
    origin
  );
}

function errorResponse(message: string, origin: string | null, status = 400) {
  return withCors(
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
    origin
  );
}

function trpcErrorResponse(message: string, origin: string | null, status = 400) {
  return withCors(
    new Response(JSON.stringify({ error: { json: { message } } }), {
      status,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    }),
    origin
  );
}

function trpcSuccessResponse(value: Record<string, unknown>, origin: string | null, isBatch = false) {
  const result = { result: { data: { json: value } } };
  return withCors(
    new Response(JSON.stringify(isBatch ? [result] : result), {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    }),
    origin
  );
}

function getTrpcInput(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const entries = [payload, ...Object.values(payload as Record<string, unknown>)];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const json = (entry as { json?: unknown }).json;
    if (json && typeof json === "object") return json as Record<string, unknown>;
  }
  return null;
}

async function syncEncryptedWorkspace(request: Request, env: Env, origin: string | null, isBatch: boolean) {
  if (!env.EDU_AI_DB) return trpcErrorResponse("La copia privada no está disponible en este momento.", origin, 503);
  let input: Record<string, unknown> | null;
  try { input = getTrpcInput(await request.json()); } catch { input = null; }
  const action = input?.action;
  const syncId = typeof input?.syncId === "string" ? input.syncId : "";
  const ciphertext = typeof input?.ciphertext === "string" ? input.ciphertext : "";
  if ((action !== "get" && action !== "put") || !/^[A-Za-z0-9_-]{32,96}$/.test(syncId)) return trpcErrorResponse("El identificador de sincronización no es válido.", origin);
  try {
    if (action === "get") {
      const workspace = await env.EDU_AI_DB.prepare("SELECT ciphertext, updated_at FROM encrypted_workspaces WHERE sync_id = ?").bind(syncId).first<{ ciphertext: string; updated_at: number }>();
      return trpcSuccessResponse({ found: Boolean(workspace), ciphertext: workspace?.ciphertext ?? null, updatedAt: workspace ? new Date(workspace.updated_at).toISOString() : null }, origin, isBatch);
    }
    if (ciphertext.length < 32 || ciphertext.length > 1_500_000) return trpcErrorResponse("Falta la instantánea cifrada para sincronizar.", origin);
    const now = Date.now();
    await env.EDU_AI_DB.prepare("INSERT INTO encrypted_workspaces (sync_id, ciphertext, updated_at) VALUES (?, ?, ?) ON CONFLICT(sync_id) DO UPDATE SET ciphertext = excluded.ciphertext, updated_at = excluded.updated_at").bind(syncId, ciphertext, now).run();
    return trpcSuccessResponse({ saved: true, updatedAt: new Date(now).toISOString() }, origin, isBatch);
  } catch {
    return trpcErrorResponse("La copia privada no está disponible en este momento.", origin, 503);
  }
}

async function getSharedLearningLink(url: URL, env: Env, origin: string | null, isBatch: boolean) {
  if (!env.EDU_AI_DB) return trpcErrorResponse("El enlace compartido no está disponible en este momento.", origin, 503);
  let input: Record<string, unknown> | null = null;
  try { input = getTrpcInput(JSON.parse(url.searchParams.get("input") ?? "")); } catch { input = null; }
  const token = typeof input?.token === "string" ? input.token : "";
  if (!/^[A-Za-z0-9_-]{32,96}$/.test(token)) return trpcErrorResponse("Este enlace no está disponible o ya venció.", origin, 404);
  try {
    const link = await env.EDU_AI_DB.prepare("SELECT kind, title, snapshot, expires_at FROM shared_learning_links WHERE token = ? AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > ?)").bind(token, Date.now()).first<{ kind: string; title: string; snapshot: string; expires_at: number | null }>();
    if (!link) return trpcErrorResponse("Este enlace no está disponible o ya venció.", origin, 404);
    return trpcSuccessResponse({ kind: link.kind, title: link.title, snapshot: link.snapshot, expiresAt: link.expires_at ? new Date(link.expires_at).toISOString() : null }, origin, isBatch);
  } catch {
    return trpcErrorResponse("El enlace compartido no está disponible en este momento.", origin, 503);
  }
}

function getClientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

async function hashVisitor(ip: string, secret: string) {
  const bytes = new TextEncoder().encode(`${secret}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function hashTtsNetworkIdentity(ip: string, secret: string) {
  const bytes = new TextEncoder().encode(`edu-ai-tts-network:${secret}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

type TtsReservation = { allowed: true; remainingCharacters: number } | { allowed: false; reason: "visitor" | "shared" };

async function reserveTtsCapacity(database: D1Binding, visitorHash: string, characters: number, now: number): Promise<TtsReservation> {
  const usageDate = new Date(now).toISOString().slice(0, 10);
  const visitorReservation = await database
    .prepare("INSERT INTO tts_daily_usage (visitor_hash, usage_date, used_characters, requests, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(visitor_hash, usage_date) DO UPDATE SET used_characters = tts_daily_usage.used_characters + excluded.used_characters, requests = tts_daily_usage.requests + 1, updated_at = excluded.updated_at WHERE tts_daily_usage.requests < ? AND tts_daily_usage.used_characters + excluded.used_characters <= ?")
    .bind(visitorHash, usageDate, characters, now, TTS_DAILY_REQUESTS_PER_VISITOR, TTS_DAILY_CHARACTERS_PER_VISITOR)
    .run();
  if ((visitorReservation.meta?.changes ?? 0) !== 1) return { allowed: false, reason: "visitor" };

  const globalReservation = await database
    .prepare("INSERT INTO tts_daily_usage (visitor_hash, usage_date, used_characters, requests, updated_at) VALUES (?, ?, ?, 1, ?) ON CONFLICT(visitor_hash, usage_date) DO UPDATE SET used_characters = tts_daily_usage.used_characters + excluded.used_characters, requests = tts_daily_usage.requests + 1, updated_at = excluded.updated_at WHERE tts_daily_usage.used_characters + excluded.used_characters <= ?")
    .bind(TTS_GLOBAL_USAGE_KEY, usageDate, characters, now, TTS_DAILY_CHARACTERS_SHARED)
    .run();
  if ((globalReservation.meta?.changes ?? 0) !== 1) {
    await database
      .prepare("UPDATE tts_daily_usage SET used_characters = used_characters - ?, requests = requests - 1, updated_at = ? WHERE visitor_hash = ? AND usage_date = ? AND used_characters >= ? AND requests >= 1")
      .bind(characters, now, visitorHash, usageDate, characters)
      .run();
    return { allowed: false, reason: "shared" };
  }
  return { allowed: true, remainingCharacters: TTS_DAILY_CHARACTERS_PER_VISITOR - characters };
}

async function reserveSuggestionSlot(database: D1Binding, visitorHash: string, now: number) {
  const current = await database
    .prepare("SELECT window_started_at, request_count FROM suggestion_rate_limits WHERE visitor_hash = ?")
    .bind(visitorHash)
    .first<{ window_started_at: number; request_count: number }>();

  if (!current || now - current.window_started_at >= SUGGESTION_WINDOW_MS) {
    await database
      .prepare("INSERT INTO suggestion_rate_limits (visitor_hash, window_started_at, request_count) VALUES (?, ?, 1) ON CONFLICT(visitor_hash) DO UPDATE SET window_started_at = excluded.window_started_at, request_count = 1")
      .bind(visitorHash, now)
      .run();
    return true;
  }

  if (current.request_count >= SUGGESTION_LIMIT) return false;
  const result = await database
    .prepare("UPDATE suggestion_rate_limits SET request_count = request_count + 1 WHERE visitor_hash = ? AND request_count < ?")
    .bind(visitorHash, SUGGESTION_LIMIT)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

async function submitCreatorSuggestion(request: Request, env: Env, origin: string | null) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return trpcErrorResponse("Envía tu nombre y tu sugerencia.", origin);
  }

  const input = body && typeof body === "object" ? (body as { json?: unknown }).json : null;
  if (!input || typeof input !== "object") return trpcErrorResponse("Envía tu nombre y tu sugerencia.", origin);
  const { name, message, website } = input as { name?: unknown; message?: unknown; website?: unknown };
  const normalizedName = typeof name === "string" ? name.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const normalizedWebsite = typeof website === "string" ? website.trim() : "";

  if (typeof website !== "undefined" && (typeof website !== "string" || normalizedWebsite.length > 200)) return trpcErrorResponse("No pudimos validar tu sugerencia.", origin);
  if (normalizedName.length < 2 || normalizedName.length > 80) return trpcErrorResponse("Escribe tu nombre.", origin);
  if (normalizedMessage.length < 8 || normalizedMessage.length > 1200) return trpcErrorResponse("Escribe una sugerencia un poco más detallada.", origin);
  // La trampa se valida después del contrato para que los bots no reciban señales útiles.
  if (normalizedWebsite) return trpcSuccessResponse({ accepted: true }, origin);
  if (!env.EDU_AI_DB || !env.EDU_AI_GATEWAY_SECRET) return trpcErrorResponse("El buzón de sugerencias no está disponible en este momento.", origin, 503);

  try {
    const now = Date.now();
    const visitorHash = await hashVisitor(getClientIp(request), env.EDU_AI_GATEWAY_SECRET);
    if (!await reserveSuggestionSlot(env.EDU_AI_DB, visitorHash, now)) return trpcErrorResponse("Gracias por compartir. Espera un poco antes de enviar otra sugerencia.", origin, 429);

    const id = crypto.randomUUID();
    await env.EDU_AI_DB
      .prepare("INSERT INTO creator_suggestions (id, sender_name, message, visitor_hash, created_at) VALUES (?, ?, ?, ?, ?)")
      .bind(id, normalizedName, normalizedMessage, visitorHash, now)
      .run();

    let emailDelivered = false;
    if (env.RESEND_API_KEY?.trim() && env.FEEDBACK_RECIPIENT_EMAIL?.trim() && env.SUGGESTIONS_FROM_EMAIL?.trim()) {
      try {
        const email = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${env.RESEND_API_KEY.trim()}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: env.SUGGESTIONS_FROM_EMAIL.trim(),
            to: [env.FEEDBACK_RECIPIENT_EMAIL.trim()],
            subject: "Nueva sugerencia para Edu AI",
            text: `Nombre: ${normalizedName}\n\nMensaje:\n${normalizedMessage}`,
          }),
        });
        emailDelivered = email.ok;
      } catch {
        emailDelivered = false;
      }
    }

    await env.EDU_AI_DB
      .prepare("UPDATE creator_suggestions SET owner_notified = ?, email_delivered = ? WHERE id = ?")
      .bind(emailDelivered ? 1 : 0, emailDelivered ? 1 : 0, id)
      .run();
    return trpcSuccessResponse({ accepted: true }, origin);
  } catch {
    return trpcErrorResponse("El buzón de sugerencias no está disponible en este momento.", origin, 503);
  }
}

function getLatestChatUserMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const entries = [payload, ...Object.values(payload as Record<string, unknown>)];

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const json = (entry as { json?: unknown }).json;
    if (!json || typeof json !== "object") continue;
    const messages = (json as { messages?: unknown }).messages;
    if (!Array.isArray(messages)) continue;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (!message || typeof message !== "object") continue;
      const { role, content } = message as { role?: unknown; content?: unknown };
      if (role === "user" && typeof content === "string") return content.trim();
    }
  }

  return null;
}

async function getPoliticalBoundaryResponse(request: Request, origin: string | null, isBatch: boolean) {
  try {
    const payload = await request.clone().json();
    const latestMessage = getLatestChatUserMessage(payload);
    if (!latestMessage || !POLITICAL_TOPIC_PATTERN.test(latestMessage)) return null;

    const result = { result: { data: { json: { content: EDU_AI_POLITICAL_BOUNDARY_REPLY } } } };
    return withCors(
      new Response(JSON.stringify(isBatch ? [result] : result), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      }),
      origin
    );
  } catch {
    // Malformed bodies remain the responsibility of the typed upstream procedure.
    return null;
  }
}

function extractTtsReservation(payload: unknown) {
  const result = payload as { result?: { data?: { json?: { allowed?: boolean; remainingCharacters?: number } } } };
  return result.result?.data?.json;
}

async function verifyTurnstileToken(token: string, request: Request, env: Env) {
  if (!env.TURNSTILE_SECRET_KEY) return { available: false, valid: false } as const;

  try {
    const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    const clientIp = request.headers.get("cf-connecting-ip");
    if (clientIp) form.set("remoteip", clientIp);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const result = await response.json().catch(() => null) as { success?: unknown } | null;
    return { available: true, valid: response.ok && result?.success === true } as const;
  } catch {
    return { available: true, valid: false } as const;
  }
}

async function synthesizeTts(request: Request, env: Env, origin: string | null) {
  if (!env.AI) return errorResponse("La voz de Edu AI no está disponible en este momento.", origin, 503);

  let payload: { text?: unknown; speaker?: unknown; visitorId?: unknown; turnstileToken?: unknown };
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Envía el texto que quieres convertir a voz.", origin);
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const speaker = typeof payload.speaker === "string" ? payload.speaker : "aquila";
  const visitorId = typeof payload.visitorId === "string" ? payload.visitorId : "";
  const turnstileToken = typeof payload.turnstileToken === "string" ? payload.turnstileToken.trim() : "";
  if (!text || text.length > TTS_MAX_CHARACTERS) return errorResponse(`El texto debe tener entre 1 y ${TTS_MAX_CHARACTERS} caracteres.`, origin);
  if (!TTS_SPEAKERS.has(speaker)) return errorResponse("La voz elegida no está disponible.", origin);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) return errorResponse("No se pudo validar la sesión de voz. Recarga la página e inténtalo de nuevo.", origin);
  if (!turnstileToken) return errorResponse("Completa la comprobación de seguridad antes de crear el audio.", origin, 403);

  const verification = await verifyTurnstileToken(turnstileToken, request, env);
  if (!verification.available) return errorResponse("La protección de voz no está configurada en este momento.", origin, 503);
  if (!verification.valid) return errorResponse("No pudimos comprobar el acceso seguro. Recarga la página e inténtalo de nuevo.", origin, 403);

  if (!env.EDU_AI_DB || !env.EDU_AI_GATEWAY_SECRET) return errorResponse("No fue posible comprobar el límite de voz. Inténtalo de nuevo en unos segundos.", origin, 503);
  let reservation: TtsReservation;
  try {
    const visitorHash = await hashTtsNetworkIdentity(getClientIp(request), env.EDU_AI_GATEWAY_SECRET);
    reservation = await reserveTtsCapacity(env.EDU_AI_DB, visitorHash, text.length, Date.now());
  } catch {
    return errorResponse("No fue posible comprobar el límite de voz. Inténtalo de nuevo en unos segundos.", origin, 503);
  }
  if (!reservation.allowed) return errorResponse(reservation.reason === "shared" ? "La capacidad diaria de voz se agotó. Vuelve a intentarlo mañana." : "Ya utilizaste tu audio gratuito de hoy. Vuelve mañana para crear otro.", origin, 429);

  try {
    const audio = await env.AI.run(TTS_MODEL, { text, speaker, encoding: "mp3" }) as ReadableStream;
    return withCors(
      new Response(audio, {
        status: 200,
        headers: {
          "content-type": "audio/mpeg",
          "cache-control": "no-store",
          "content-disposition": `attachment; filename="edu-ai-${speaker}.mp3"`,
          "x-edu-ai-characters-left": String(reservation.remainingCharacters),
        },
      }),
      origin
    );
  } catch {
    return errorResponse("La voz elegida no pudo generarse. Prueba con otra voz o vuelve en un momento.", origin, 503);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) return forbidden("Origen no autorizado", origin);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!origin || !ALLOWED_ORIGINS.has(origin)) return forbidden("Origen no autorizado", origin);
    if (url.pathname === TTS_PATH) {
      if (request.method !== "POST") return errorResponse("Método no permitido.", origin, 405);
      if (!env.EDU_AI_GATEWAY_SECRET) return errorResponse("La puerta segura no está configurada.", origin, 503);
      return synthesizeTts(request, env, origin);
    }
    if (url.pathname === FEEDBACK_PATH) {
      if (request.method !== "POST") return trpcErrorResponse("Método no permitido.", origin, 405);
      return submitCreatorSuggestion(request, env, origin);
    }
    if (url.pathname === "/api/trpc/eduAi.chat") {
      if (request.method !== "POST") return trpcErrorResponse("Método no permitido.", origin, 405);
      const isBatch = url.searchParams.get("batch") === "1";
      const boundaryResponse = await getPoliticalBoundaryResponse(request, origin, isBatch);
      if (boundaryResponse) return boundaryResponse;
      if (!env.EDU_AI_DB || !env.EDU_AI_GATEWAY_SECRET || !env.AI) return trpcErrorResponse("Edu AI no está disponible en este momento. Inténtalo de nuevo en unos segundos.", origin, 503);
      try {
        const input = getChatInput(await request.clone().json());
        if (!input) return trpcErrorResponse("Escribe un mensaje para continuar.", origin);
        const reply = await createChatReply(input, getClientIp(request), env.EDU_AI_GATEWAY_SECRET, env.EDU_AI_DB, env.AI);
        if ("error" in reply) return trpcErrorResponse("Edu AI está recibiendo muchas preguntas. Espera unos minutos antes de continuar.", origin, 429);
        return trpcSuccessResponse({ content: reply.content }, origin, isBatch);
      } catch (error) {
        console.error("[Edu AI chat] Workers AI request failed", error);
        return trpcErrorResponse("Edu AI no pudo responder en este momento. Inténtalo de nuevo en unos segundos.", origin, 503);
      }
    }
    if (url.pathname === "/api/trpc/workspace.sync" && request.method === "POST") return syncEncryptedWorkspace(request, env, origin, url.searchParams.get("batch") === "1");
    if (url.pathname === "/api/trpc/sharing.get" && request.method === "GET") return getSharedLearningLink(url, env, origin, url.searchParams.get("batch") === "1");
    return withCors(new Response(JSON.stringify({ error: "Ruta no disponible" }), { status: 404, headers: { "content-type": "application/json; charset=utf-8" } }), origin);
  },
};
