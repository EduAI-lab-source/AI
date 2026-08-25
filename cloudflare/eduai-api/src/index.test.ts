import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const pageOrigin = "https://eduai-lab-source.github.io";
const officialOrigin = "https://textoavoz.xyz";
const env = { EDU_AI_GATEWAY_SECRET: "test-gateway-secret", TURNSTILE_SECRET_KEY: "test-turnstile-secret", AI: { run: vi.fn() } };

function createFeedbackDatabase() {
  const rateWindows = new Map<string, { windowStartedAt: number; requestCount: number }>();
  const chatWindows = new Map<string, { windowStartedAt: number; requestCount: number }>();
  const suggestions: Array<{ id: string; name: string; message: string }> = [];
  const ttsUsage = new Map<string, { usedCharacters: number; requests: number }>();
  const workspaces = new Map<string, { ciphertext: string; updatedAt: number }>();

  const database = {
    prepare(query: string) {
      let values: unknown[] = [];
      return {
        bind(...nextValues: unknown[]) {
          values = nextValues;
          return this;
        },
        async first() {
          if (query.includes("SELECT window_started_at")) {
            const current = rateWindows.get(String(values[0]));
            return current ? { window_started_at: current.windowStartedAt, request_count: current.requestCount } : null;
          }
          if (query.includes("SELECT ciphertext, updated_at FROM encrypted_workspaces")) {
            const workspace = workspaces.get(String(values[0]));
            return workspace ? { ciphertext: workspace.ciphertext, updated_at: workspace.updatedAt } : null;
          }
          return null;
        },
        async run() {
          if (query.includes("INSERT INTO suggestion_rate_limits")) {
            rateWindows.set(String(values[0]), { windowStartedAt: Number(values[1]), requestCount: 1 });
          } else if (query.includes("UPDATE suggestion_rate_limits")) {
            const current = rateWindows.get(String(values[0]));
            if (!current || current.requestCount >= Number(values[1])) return { meta: { changes: 0 } };
            current.requestCount += 1;
          } else if (query.includes("INSERT INTO chat_rate_limits")) {
            const visitorHash = String(values[0]);
            const now = Number(values[1]);
            const current = chatWindows.get(visitorHash);
            if (!current || now - current.windowStartedAt >= 5 * 60 * 1000) {
              chatWindows.set(visitorHash, { windowStartedAt: now, requestCount: 1 });
            } else if (current.requestCount >= 18) {
              return { meta: { changes: 0 } };
            } else {
              current.requestCount += 1;
            }
          } else if (query.includes("INSERT INTO creator_suggestions")) {
            suggestions.push({ id: String(values[0]), name: String(values[1]), message: String(values[2]) });
          } else if (query.includes("INSERT INTO tts_daily_usage")) {
            const visitorHash = String(values[0]);
            const usageKey = `${visitorHash}:${String(values[1])}`;
            const characters = Number(values[2]);
            const current = ttsUsage.get(usageKey);
            const isGlobal = visitorHash === "global-free-tts-capacity";
            const canReserve = !current || (current.usedCharacters + characters <= (isGlobal ? 3000 : 650) && (isGlobal || current.requests < 1));
            if (!canReserve) return { meta: { changes: 0 } };
            ttsUsage.set(usageKey, { usedCharacters: (current?.usedCharacters ?? 0) + characters, requests: (current?.requests ?? 0) + 1 });
          } else if (query.includes("UPDATE tts_daily_usage SET used_characters = used_characters -")) {
            const usageKey = `${String(values[2])}:${String(values[3])}`;
            const current = ttsUsage.get(usageKey);
            if (!current) return { meta: { changes: 0 } };
            current.usedCharacters -= Number(values[0]);
            current.requests -= 1;
          } else if (query.includes("INSERT INTO encrypted_workspaces")) {
            workspaces.set(String(values[0]), { ciphertext: String(values[1]), updatedAt: Number(values[2]) });
          }
          return { meta: { changes: 1 } };
        },
      };
    },
  };
  return { database, suggestions, ttsUsage, chatWindows, workspaces };
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

  it("responde la conversación desde Workers AI con CORS del sitio público", async () => {
    const outbound = vi.fn();
    vi.stubGlobal("fetch", outbound);
    const run = vi.fn().mockResolvedValue({ choices: [{ message: { content: "Una lista de tareas ordena lo que quieres resolver, paso a paso." } }] });
    const { database } = createFeedbackDatabase();

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat?batch=1", {
        method: "POST",
        headers: { origin: pageOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.12" },
        body: JSON.stringify({ 0: { json: { messages: [{ role: "user", content: "Explícame qué es una lista de tareas." }] } } }),
      }),
      { ...env, EDU_AI_DB: database, AI: { run } }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(pageOrigin);
    expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    expect(await response.json()).toMatchObject([{ result: { data: { json: { content: "Una lista de tareas ordena lo que quieres resolver, paso a paso." } } } }]);
    expect(run).toHaveBeenCalledWith("@cf/meta/llama-3.1-8b-instruct-fast", expect.objectContaining({ messages: expect.any(Array) }));
    expect(outbound).not.toHaveBeenCalled();
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

  it("conserva una respuesta de estudio desde el modelo propio", async () => {
    const run = vi.fn().mockResolvedValue({ response: "Repasa en bloques breves y termina cada uno con una pregunta." });
    const { database } = createFeedbackDatabase();

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat?batch=1", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: JSON.stringify({ 0: { json: { messages: [{ role: "user", content: "Ayúdame a planificar una sesión de estudio." }] } } }),
      }),
      { ...env, EDU_AI_DB: database, AI: { run } }
    );

    expect(response.status).toBe(200);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("sintetiza una voz descargable solo después de reservar capacidad", async () => {
    const verify = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    const fetchMock = vi.fn().mockImplementation((url: URL | string, init: RequestInit) => String(url).includes("siteverify") ? verify(url, init) : Promise.reject(new Error("No debe consultar una reserva externa")));
    vi.stubGlobal("fetch", fetchMock);
    const run = vi.fn().mockResolvedValue(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([73, 68, 51])); controller.close(); } }));
    const { database, ttsUsage } = createFeedbackDatabase();
    const text = "Una idea clara puede abrir una puerta nueva.";

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/tts", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.12" },
        body: JSON.stringify({ text, speaker: "celeste", visitorId: "a5b5c6d7-e8f9-4a1b-8c2d-1234567890ab", turnstileToken: "verified-token" }),
      }),
      { ...env, EDU_AI_DB: database, AI: { run } }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("audio/mpeg");
    expect(response.headers.get("content-disposition")).toContain("edu-ai-celeste.mp3");
    expect(response.headers.get("x-edu-ai-characters-left")).toBe(String(650 - text.length));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(ttsUsage).toHaveLength(2);
    expect(run).toHaveBeenCalledWith("@cf/deepgram/aura-2-es", expect.objectContaining({ speaker: "celeste", encoding: "mp3" }));
  });

  it("rechaza un segundo audio del mismo visitante desde la cuota propia", async () => {
    const verify = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 })));
    vi.stubGlobal("fetch", verify);
    const run = vi.fn().mockResolvedValue(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([73, 68, 51])); controller.close(); } }));
    const { database } = createFeedbackDatabase();
    const request = () => new Request("https://api.textoavoz.xyz/api/tts", {
      method: "POST",
      headers: { origin: officialOrigin, "content-type": "application/json", "cf-connecting-ip": "203.0.113.77" },
      body: JSON.stringify({ text: "Audio breve de prueba.", speaker: "celeste", visitorId: "a5b5c6d7-e8f9-4a1b-8c2d-1234567890ab", turnstileToken: "verified-token" }),
    });

    expect((await worker.fetch(request(), { ...env, EDU_AI_DB: database, AI: { run } })).status).toBe(200);
    const second = await worker.fetch(request(), { ...env, EDU_AI_DB: database, AI: { run } });
    expect(second.status).toBe(429);
    expect(run).toHaveBeenCalledTimes(1);
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

  it("guarda y recupera la sincronización cifrada desde D1 sin reenviar a un backend administrado", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    const { database, workspaces } = createFeedbackDatabase();
    const syncId = "a".repeat(32);
    const ciphertext = "c".repeat(48);

    const saved = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.sync", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: JSON.stringify({ json: { action: "put", syncId, ciphertext } }),
      }),
      { ...env, EDU_AI_DB: database }
    );

    expect(saved.status).toBe(200);
    expect(workspaces.get(syncId)?.ciphertext).toBe(ciphertext);
    const restored = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.sync", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json" },
        body: JSON.stringify({ json: { action: "get", syncId } }),
      }),
      { ...env, EDU_AI_DB: database }
    );
    expect(restored.status).toBe(200);
    expect(await restored.json()).toMatchObject({ result: { data: { json: { found: true, ciphertext } } } });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("retira la sincronización de cuenta administrada sin abrir rutas adicionales", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/workspace.accountSync", {
        method: "POST",
        headers: { origin: officialOrigin, "content-type": "application/json", cookie: "manus_session=test" },
        body: "{}",
      }),
      env
    );

    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
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
    const run = vi.fn().mockResolvedValue({ response: "Edu AI responde desde la infraestructura propia." });
    const { database } = createFeedbackDatabase();

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/eduAi.chat", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ json: { messages: [{ role: "user", content: "¿Puedes ayudarme a estudiar?" }] } }),
      }),
      { ...env, EDU_AI_DB: database, AI: { run } }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("access-control-allow-origin")).toBe(origin);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("retira la consulta de sesión administrada sin abrir rutas adicionales", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/trpc/auth.me?batch=1", {
        method: "GET",
        headers: { origin: officialOrigin, cookie: "manus_session=test" },
      }),
      env
    );

    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("retira el callback OAuth administrado sin realizar llamadas salientes", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await worker.fetch(
      new Request("https://api.textoavoz.xyz/api/oauth/callback?code=sample&state=state", { method: "GET", headers: { origin: officialOrigin } }),
      env
    );

    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
});
