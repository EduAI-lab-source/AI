const UPSTREAM_ORIGIN = "https://edusearch-9qua9exp.manus.space";
const ALLOWED_ORIGINS = new Set([
  "https://eduai-lab-source.github.io",
  "https://textoavoz.xyz",
  "https://www.textoavoz.xyz",
]);
const ALLOWED_PATHS = new Set(["/api/trpc/eduAi.chat", "/api/trpc/workspace.sync"]);

interface Env {
  EDU_AI_GATEWAY_SECRET: string;
}

function corsHeaders(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Headers();

  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-trpc-source",
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");

    if (request.method === "OPTIONS") {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) return forbidden("Origen no autorizado", origin);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (!origin || !ALLOWED_ORIGINS.has(origin)) return forbidden("Origen no autorizado", origin);
    if (request.method !== "POST" || !ALLOWED_PATHS.has(url.pathname)) {
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
    const upstreamHeaders = new Headers(request.headers);
    const clientIp = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");

    upstreamHeaders.set("host", upstreamUrl.host);
    upstreamHeaders.set("x-forwarded-proto", "https");
    upstreamHeaders.set("x-eduai-gateway", "cloudflare");
    upstreamHeaders.set("x-gateway-secret", env.EDU_AI_GATEWAY_SECRET);
    if (clientIp) upstreamHeaders.set("x-forwarded-for", clientIp);
    upstreamHeaders.delete("origin");

    try {
      const upstreamResponse = await fetch(upstreamUrl, {
        method: "POST",
        headers: upstreamHeaders,
        body: request.body,
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
