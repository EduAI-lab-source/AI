import { describe, expect, it } from "vitest";
import {
  createConversation,
  describeThreadRecency,
  deriveThreadTitle,
  replaceThreadMessages,
  sanitizeAssistantMessage,
  startFreshConversation,
  type ChatState,
} from "./chatSession";

describe("chatSession", () => {
  it("crea una conversación con el saludo propio de Edu AI", () => {
    const thread = createConversation();
    expect(thread.messages[0]?.role).toBe("assistant");
    expect(thread.messages[0]?.content).toContain("Edu AI");
  });

  it("da un título claro a cada hilo a partir del primer mensaje", () => {
    expect(deriveThreadTitle([{ role: "user", content: "Quiero aprender a crear páginas web" }]))
      .toBe("Quiero aprender a crear páginas web");
  });

  it("presenta una referencia temporal breve para el historial", () => {
    const now = new Date("2026-08-17T18:00:00.000Z").getTime();
    expect(describeThreadRecency(now - 90_000, now)).toBe("Ahora mismo");
    expect(describeThreadRecency(now - 20 * 60_000, now)).toBe("Hace 20 min");
    expect(describeThreadRecency(now - 28 * 60 * 60_000, now)).toBe("Ayer");
  });

  it("preserva los hilos anteriores al iniciar una conversación nueva", () => {
    const original = createConversation();
    const state: ChatState = { activeThreadId: original.id, threads: [original] };
    const result = startFreshConversation(state);
    expect(result.threads).toHaveLength(2);
    expect(result.activeThreadId).not.toBe(original.id);
  });

  it("permite crear un hilo con un saludo localizado", () => {
    const thread = createConversation({
      title: "New conversation",
      welcomeMessage: { role: "assistant", content: "Hello from Edu AI" },
    });
    expect(thread.title).toBe("New conversation");
    expect(thread.messages[0]?.content).toBe("Hello from Edu AI");
  });

  it("actualiza solo el hilo al que pertenece una respuesta", () => {
    const original = createConversation();
    const state: ChatState = { activeThreadId: original.id, threads: [original] };
    const result = replaceThreadMessages(state, original.id, [
      ...original.messages,
      { role: "user", content: "Necesito ordenar una idea" },
    ]);
    expect(result.threads[0]?.title).toBe("Necesito ordenar una idea");
    expect(result.threads[0]?.messages).toHaveLength(2);
  });

  it("no conserva errores técnicos como mensajes de Edu AI", () => {
    const message = sanitizeAssistantMessage({
      role: "assistant",
      content: "Unexpected token '<', \"<!doctype\" is not valid JSON",
    });
    expect(message.content).not.toMatch(/unexpected token|json|doctype/i);
  });
});
