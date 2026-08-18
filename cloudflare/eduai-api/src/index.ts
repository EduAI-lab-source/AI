const UPSTREAM_ORIGIN = "https://edusearch-9qua9exp.manus.space";
const ALLOWED_ORIGINS = new Set([
  "https://eduai-lab-source.github.io",
  "https://textoavoz.xyz",
  "https://www.textoavoz.xyz",
]);
const ALLOWED_MUTATION_PATHS = new Set(["/api/trpc/eduAi.chat", "/api/trpc/workspace.sync", "/api/trpc/workspace.accountSync", "/api/trpc/sharing.create", "/api/trpc/sharing.revoke"]);
const ALLOWED_QUERY_PATHS = new Set(["/api/trpc/auth.me", "/api/trpc/sharing.list", "/api/trpc/sharing.get"]);
const OAUTH_CALLBACK_PATH = "/api/oauth/callback";
const TTS_PATH = "/api/tts";
const TTS_MODEL = "@cf/deepgram/aura-2-es";
const TTS_MAX_CHARACTERS = 650;
const TTS_SPEAKERS = new Set(["sirio", "nestor", "carina", "celeste", "alvaro", "diana", "aquila", "selena", "estrella", "javier"]);

type AiBinding = {
  run(model: string, input: Record<string, unknown>): Promise<ReadableStream>;
};

interface Env {
  EDU_AI_GATEWAY_SECRET: string;
  AI: AiBinding;
}

function corsHeaders(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Headers();

  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, accept, x-trpc-batch, x-trpc-source",
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

function upstreamHeadersFor(request: Request, upstreamUrl: URL, env: Env) {
  const headers = new Headers(request.headers);
  const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");

  headers.set("host", upstreamUrl.host);
  headers.set("x-forwarded-proto", "https");
  headers.set("x-eduai-gateway", "cloudflare");
  headers.set("x-gateway-secret", env.EDU_AI_GATEWAY_SECRET);
  if (clientIp) headers.set("x-forwarded-for", clientIp);
  headers.delete("origin");
  return headers;
}

function cookieForPublicDomain(value: string | null) {
  if (!value) return null;
  const withoutExistingDomain = value.replace(/;\s*Domain=[^;]*/gi, "");
  return withoutExistingDomain.replace(/;\s*Path=\//i, "; Path=/; Domain=.textoavoz.xyz");
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

function extractTtsReservation(payload: unknown) {
  const result = payload as { result?: { data?: { json?: { allowed?: boolean; remainingCharacters?: number } } } };
  return result.result?.data?.json;
}

async function synthesizeTts(request: Request, env: Env, origin: string | null) {
  if (!env.AI) return errorResponse("La voz de Edu AI no está disponible en este momento.", origin, 503);

  let payload: { text?: unknown; speaker?: unknown; visitorId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return errorResponse("Envía el texto que quieres convertir a voz.", origin);
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const speaker = typeof payload.speaker === "string" ? payload.speaker : "aquila";
  const visitorId = typeof payload.visitorId === "string" ? payload.visitorId : "";
  if (!text || text.length > TTS_MAX_CHARACTERS) return errorResponse(`El texto debe tener entre 1 y ${TTS_MAX_CHARACTERS} caracteres.`, origin);
  if (!TTS_SPEAKERS.has(speaker)) return errorResponse("La voz elegida no está disponible.", origin);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)) return errorResponse("No se pudo validar la sesión de voz. Recarga la página e inténtalo de nuevo.", origin);

  const upstreamUrl = new URL("/api/trpc/tts.reserve", UPSTREAM_ORIGIN);
  let reservationResponse: Response;
  try {
    reservationResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
        "x-eduai-gateway": "cloudflare",
        "x-gateway-secret": env.EDU_AI_GATEWAY_SECRET,
        "x-forwarded-for": request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "anonymous",
      },
      body: JSON.stringify({ json: { visitorId, characters: text.length } }),
    });
  } catch {
    return errorResponse("No fue posible comprobar el límite de voz. Inténtalo de nuevo en unos segundos.", origin, 503);
  }

  if (!reservationResponse.ok) {
    const details = await reservationResponse.json().catch(() => null) as { error?: { json?: { message?: string } } } | null;
    return errorResponse(details?.error?.json?.message ?? "La voz no está disponible en este momento.", origin, reservationResponse.status === 429 ? 429 : 503);
  }
  const reservation = extractTtsReservation(await reservationResponse.json().catch(() => null));
  if (!reservation?.allowed) return errorResponse("No fue posible reservar capacidad de voz en este momento.", origin, 503);

  try {
    const audio = await env.AI.run(TTS_MODEL, { text, speaker, encoding: "mp3" });
    return withCors(
      new Response(audio, {
        status: 200,
        headers: {
          "content-type": "audio/mpeg",
          "cache-control": "no-store",
          "content-disposition": `attachment; filename="edu-ai-${speaker}.mp3"`,
          "x-edu-ai-characters-left": String(reservation.remainingCharacters ?? ""),
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

    // The OAuth portal returns to the public site, while the secure callback
    // lives upstream. This narrow pass-through keeps the browser session scoped
    // to textoavoz.xyz and api.textoavoz.xyz without opening the whole origin.
    if (url.hostname === "textoavoz.xyz" && url.pathname === OAUTH_CALLBACK_PATH && request.method === "GET") {
      if (!env.EDU_AI_GATEWAY_SECRET) return new Response("La autenticación no está disponible", { status: 503 });
      const upstreamUrl = new URL(`${url.pathname}${url.search}`, UPSTREAM_ORIGIN);
      const upstreamResponse = await fetch(upstreamUrl, {
        method: "GET",
        headers: upstreamHeadersFor(request, upstreamUrl, env),
        redirect: "manual",
      });
      const headers = new Headers(upstreamResponse.headers);
      const sessionCookie = cookieForPublicDomain(headers.get("set-cookie"));
      if (sessionCookie) headers.set("set-cookie", sessionCookie);
      return new Response(upstreamResponse.body, { status: upstreamResponse.status, headers });
    }

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
    const isAllowedMutation = request.method === "POST" && ALLOWED_MUTATION_PATHS.has(url.pathname);
    const isAllowedQuery = request.method === "GET" && ALLOWED_QUERY_PATHS.has(url.pathname);
    if (!isAllowedMutation && !isAllowedQuery) {
      return withCors(
        new Response(JSON.stringify({ error: "Ruta no disponible" }), {
          status: 404,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
        origin
      );
    }
    if (!env.EDU_AI_GATEWAY_SECRET) {
      return withCors(
        new Response(JSON.stringify({ error: "La puerta segura no está configurada" }), {
          status: 503,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
        origin
      );
    }

    const upstreamUrl = new URL(`${url.pathname}${url.search}`, UPSTREAM_ORIGIN);
    const upstreamHeaders = upstreamHeadersFor(request, upstreamUrl, env);

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: request.method,
        headers: upstreamHeaders,
        body: request.method === "GET" ? undefined : request.body,
        redirect: "manual",
      });
      return withCors(upstreamResponse, origin);
    } catch {
      return withCors(
        new Response(JSON.stringify({ error: "Edu AI no está disponible en este momento" }), {
          status: 503,
          headers: { "content-type": "application/json; charset=utf-8" },
        }),
        origin
      );
    }
  },
};
