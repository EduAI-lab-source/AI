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

  it("reenvía solo el procedimiento conversacional con CORS del sitio público", async () => {
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
    expect(upstream).toHaveBeenCalledTimes(1);
    const [url, init] = upstream.mock.calls[0] as [URL, RequestInit];
    expect(url.toString()).toBe("https://edusearch-9qua9exp.manus.space/api/trpc/eduAi.chat?batch=1");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("x-gateway-secret")).toBe("test-gateway-secret");
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
});
