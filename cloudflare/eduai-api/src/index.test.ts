import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const pageOrigin = "https://eduai-lab-source.github.io";
const officialOrigin = "https://textoavoz.xyz";
const env = { EDU_AI_GATEWAY_SECRET: "test-gateway-secret" };

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
