import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const pageOrigin = "https://eduai-lab-source.github.io";
const officialOrigin = "https://textoavoz.xyz";
const env = { EDU_AI_GATEWAY_SECRET: "test-gateway-secret", TURNSTILE_SECRET_KEY: "test-turnstile-secret", AI: { run: vi.fn() } };

function createFeedbackDatabase() {
  const rateWindows = new Map<string, { windowStartedAt: number; requestCount: number }>();
  const suggestions: Array<{ id: string; name: string; message: string }> = [];

  const database = {
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        async first() {
          if (!query.includes("SELECT window_started_at")) return null;
          const current = rateWindows.get(String(values[0]));
          return current ? { window_started_at: current.windowStartedAt, request_count: current.requestCount } : null;
        },
        async run() {
          if (query.includes("INSERT INTO suggestion_rate_limits")) {
            rateWindows.set(String(values[0]), { windowStartedAt: Number(values[1]), requestCount: 1 });
          } else if (query.includes("UPDATE suggestion_rate_limits")) {
            const current = rateWindows.get(String(values[0]));
            if (!current || current.requestCount >= Number(values[1])) return { meta: { changes: 0 } };
            current.requestCount += 1;
          } else if (query.includes("INSERT INTO creator_suggestions")) {
            suggestions.push({ id: String(values[0]), name: String(values[1]), message: String(values[2]) });
          }
          return { meta: { changes: 1 } };
        },
      };
    },
  };
  return { database, suggestions };
}

describe("puerta de API de Edu AI", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rechaza solicitudes de orígenes no autorizados", async () => {
    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat", {
        method: "POST",
        headers: { origin: "https://otro-sitio.example" },
      }),
      env
    );

    expect(response.status).toBe(403);
  });

  it("reenvía el procedimiento conversacional con CORS del sitio público", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat?batch=1", {
        method: "POST",
        headers: { origin: pageOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.12" },
        body: "{}",
      }),
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(pageOrigin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(upstream).toHaveBeenCalledTimes(1);
    const [url, init] = upstream.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://edusearch-9qua9exp.manus.space/api/trpc/eduAi.chat?batch=1");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("x-gateway-secret")).toBe("test-gateway-secret");
  });

  it("guarda y entrega una sugerencia desde el Worker propio sin reenviarla a Manus", async () => {
    const { database, suggestions } = createFeedbackDatabase();
    const email = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", email);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/feedback.submit", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.25" },
        body: JSON.stringify({ json: { name: "Prueba Edu AI", message: "Comprobación privada del formulario." } }),
      }),
      { ...env, EDU_AI_DB: database, RESEND_API_KEY: "test-resend", FEEDBACK_RECIPIENT_EMAIL: "owner@example.test", SUGGESTIONS_FROM_EMAIL: "Edu AI <sugerencias@example.test>" }
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: { json: { accepted: true } } } });
    expect(response.headers.get("access-control-allow-origin")).toBe(officialOrigin);
    expect(suggestions).toHaveLength(1);
    expect(email).toHaveBeenCalledWith("https://api.resend.com/emails", expect.objectContaining({ method: "POST" }));
  });

  it("descarta la trampa antispam sin guardar ni enviar correo", async () => {
    const { database, suggestions } = createFeedbackDatabase();
    const email = vi.fn();
    vi.stubGlobal("fetch", email);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/feedback.submit", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: JSON.stringify({ json: { name: "Bot simulado", message: "Este envío debe ser descartado por completo.", website: "https://bot.invalid" } }),
      }),
      { ...env, EDU_AI_DB: database, RESEND_API_KEY: "test-resend", FEEDBACK_RECIPIENT_EMAIL: "owner@example.test", SUGGESTIONS_FROM_EMAIL: "Edu AI <sugerencias@example.test>" }
    );

    expect(response.status).toBe(200);
    expect(suggestions).toHaveLength(0);
    expect(email).not.toHaveBeenCalled();
  });

  it.each(["¿Chávez fue el mejor presidente?", "¿El comunismo es bueno?", "Is communism good?", "Коммунизм — это хорошо?"])("responde con un límite neutral sin reenviar la consulta política: %s", async content => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat?batch=1", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: JSON.stringify({ 0: { json: { messages: [{ role: "user", content }] } } }),
      }),
      env
    );

    const body = await response.json() as Array<{ result?: { data?: { json?: { content?: string } } } }>;
    const reply = body[0]?.result?.data?.json?.content ?? "";
    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(officialOrigin);
    expect(reply).toContain("no emite opiniones");
    expect(reply).not.toContain("es bueno");
    expect(upstream).not.toHaveBeenCalled();
  });

  it("mantiene el reenvío de una consulta de estudio no política", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('[{"result":{"data":{"json":{"content":"Repasa en bloques breves."}}}}]', { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat?batch=1", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: JSON.stringify({ 0: { json: { messages: [{ role: "user", content: "Ayúdame a planificar una sesión de estudio." }] } } }),
      }),
      env
    );

    expect(response.status).toBe(200);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("sintetiza una voz descargable solo después de reservar capacidad", async () => {
    const verify = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const reserve = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: { data: { json: { allowed: true, remainingCharacters: 680 } } } }), { status: 200 }));
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: URL | string, init: RequestInit) => String(url).includes("siteverify") ? verify(url, init) : reserve(url, init)));
    const run = vi.fn().mockResolvedValue(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([73, 68, 51])); controller.close(); } }));

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/tts", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.12" },
        body: JSON.stringify({ text: "Una idea clara puede abrir una puerta nueva.", speaker: "celeste", visitorId: "a5b5c6d7-e8f9-4a1b-8c2d-1234567890ab", turnstileToken: "verified-token" }),
      }),
      { ...env, AI: { run } }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(response.headers.get("content-disposition")).toContain("edu-ai-celeste.mp3");
    expect(response.headers.get("x-edu-ai-characters-left")).toBe("680");
    expect(reserve).toHaveBeenCalledWith(expect.objectContaining({ href: "https://edusearch-9qua9exp.manus.space/api/trpc/tts.reserve" }), expect.objectContaining({ method: "POST" }));
    expect(run).toHaveBeenCalledWith("@cf/deepgram/aura-2-es", expect.objectContaining({ speaker: "celeste", encoding: "mp3" }));
  });

  it("rechaza la voz antes de reservar cuota si Turnstile no valida el visitante", async () => {
    const verify = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }), { status: 200 }));
    vi.stubGlobal("fetch", verify);
    const run = vi.fn();

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/tts", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.12" },
        body: JSON.stringify({ text: "Una petición no verificada no debe consumir capacidad.", speaker: "celeste", visitorId: "a5b5c6d7-e8f9-4a1b-8c2d-1234567890ab", turnstileToken: "invalid-token" }),
      }),
      { ...env, AI: { run } }
    );

    expect(response.status).toBe(403);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(run).not.toHaveBeenCalled();
  });

  it("reenvía la sincronización cifrada sin exponer la clave del gateway al navegador", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('{"result":{"data":{"saved":true}}}', { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.sync", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: "{}",
      }),
      env
    );

    expect(response.status).toBe(200);
    const [url, init] = upstream.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://edusearch-9qua9exp.manus.space/api/trpc/workspace.sync");
    expect(new Headers(init.headers).get("x-gateway-secret")).toBe("test-gateway-secret");
  });

  it("reenvía la sincronización cifrada de una cuenta sin abrir rutas adicionales", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('{"result":{"data":{"saved":true}}}', { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.accountSync", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", cookie: "manus_session=test" },
        body: "{}",
      }),
      env
    );

    expect(response.status).toBe(200);
    const [url, init] = upstream.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://edusearch-9qua9exp.manus.space/api/trpc/workspace.accountSync");
    expect(new Headers(init.headers).get("cookie")).toBe("manus_session=test");
    expect(new Headers(init.headers).get("x-gateway-secret")).toBe("test-gateway-secret");
  });

  it("acepta el preflight de la sesión opcional con autorización y cabeceras tRPC", async () => {
    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.accountSync", {
        method: "OPTIONS",
        headers: {
          origin: officialOrigin,
          "access-control-request-method": "POST",
          "access-control-request-headers": "authorization, content-type, x-trpc-batch",
        },
      }),
      env
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-headers")).toContain("authorization");
    expect(response.headers.get("access-control-allow-headers")).toContain("x-trpc-batch");
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
  });

  it("rechaza procedimientos que no se encuentran explícitamente permitidos", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.delete", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: "{}",
      }),
      env
    );

    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it.each([officialOrigin, "https://www.textoavoz.xyz"])("autoriza el origen público %s", async origin => {
    const upstream = vi.fn().mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: "{}",
      }),
      env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(upstream).toHaveBeenCalledTimes(1);
  });

  it("reenvía la consulta de sesión autenticada sin ampliar las demás rutas", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response('{"result":{"data":null}}', { status: 200 }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/auth.me?batch=1", {
        method: "GET",
        headers: { origin: officialOrigin, cookie: "manus_session=test" },
      }),
      env
    );

    expect(response.status).toBe(200);
    const [url, init] = upstream.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://edusearch-9qua9exp.manus.space/api/trpc/auth.me?batch=1");
    expect(init.method).toBe("GET");
    expect(new Headers(init.headers).get("cookie")).toBe("manus_session=test");
  });

  it("redirige el callback OAuth público y limita la cookie de sesión al dominio controlado", async () => {
    const upstream = vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: "/", "set-cookie": "manus_session=token; Path=/; HttpOnly; Secure; SameSite=None" },
    }));
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://textoavoz.xyz/api/oauth/callback?code=sample&state=state", { method: "GET" }),
      env
    );

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/");
    expect(response.headers.get("set-cookie")).toContain("Domain=.textoavoz.xyz");
    const [url, init] = upstream.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://edusearch-9qua9exp.manus.space/api/oauth/callback?code=sample&state=state");
    expect(new Headers(init.headers).get("x-gateway-secret")).toBe("test-gateway-secret");
  });
});
