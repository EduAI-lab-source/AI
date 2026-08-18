import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const pageOrigin = "https://eduai-lab-source.github.io";
const officialOrigin = "https://textoavoz.xyz";
const env = { EDU_AI_GATEWAY_SECRET: "test-gateway-secret", AI: { run: vi.fn() } };

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

  it("sintetiza una voz descargable solo después de reservar capacidad", async () => {
    const reserve = vi.fn().mockResolvedValue(new Response(JSON.stringify({ result: { data: { json: { allowed: true, remainingCharacters: 680 } } } }), { status: 200 }));
    vi.stubGlobal("fetch", reserve);
    const run = vi.fn().mockResolvedValue(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([73, 68, 51])); controller.close(); } }));

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/tts", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.12" },
        body: JSON.stringify({ text: "Una idea clara puede abrir una puerta nueva.", speaker: "celeste", visitorId: "a5b5c6d7-e8f9-4a1b-8c2d-1234567890ab" }),
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
