const UPSTREAM_ORIGIN = "https://edusearch-9qua9exp.manus.space";
const ALLOWED_ORIGINS = new Set([
  "https://eduai-lab-source.github.io",
  "https://textoavoz.xyz",
  "https://www.textoavoz.xyz",
]);
const ALLOWED_MUTATION_PATHS = new Set(["/api/trpc/eduAi.chat", "/api/trpc/workspace.sync", "/api/trpc/workspace.accountSync"]);
const ALLOWED_QUERY_PATHS = new Set(["/api/trpc/auth.me"]);
const OAUTH_CALLBACK_PATH = "/api/oauth/callback";

interface Env {
  EDU_AI_GATEWAY_SECRET: string;
}

function corsHeaders(origin: string | null) {
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return new Headers();

  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-trpc-source",
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
