import { describe, expect, it } from "vitest";
import {
  addConversationFolder,
  createConversation,
  describeThreadRecency,
  deriveThreadTitle,
  removeConversation,
  replaceThreadMessages,
  sanitizeAssistantMessage,
  startFreshConversation,
  type ChatState,
  updateConversationOrganization,
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

  it("elimina un hilo inactivo sin alterar el hilo seleccionado", () => {
    const active = { ...createConversation(), updatedAt: 200 };
    const archived = { ...createConversation(), updatedAt: 100 };
    const result = removeConversation({ activeThreadId: active.id, threads: [active, archived] }, archived.id);
    expect(result.threads).toEqual([active]);
    expect(result.activeThreadId).toBe(active.id);
  });

  it("selecciona el hilo más reciente disponible al eliminar el hilo activo", () => {
    const active = { ...createConversation(), updatedAt: 100 };
    const recent = { ...createConversation(), updatedAt: 300 };
    const result = removeConversation({ activeThreadId: active.id, threads: [active, recent] }, active.id);
    expect(result.threads).toEqual([recent]);
    expect(result.activeThreadId).toBe(recent.id);
  });

  it("crea una conversación nueva localizada si se borra el último hilo", () => {
    const onlyThread = createConversation();
    const result = removeConversation(
      { activeThreadId: onlyThread.id, threads: [onlyThread] },
      onlyThread.id,
      { title: "New conversation", welcomeMessage: { role: "assistant", content: "Hello from Edu AI" } }
    );
    expect(result.threads).toHaveLength(1);
    expect(result.threads[0]?.id).not.toBe(onlyThread.id);
    expect(result.threads[0]?.title).toBe("New conversation");
    expect(result.threads[0]?.messages[0]?.content).toBe("Hello from Edu AI");
  });

  it("no conserva errores técnicos como mensajes de Edu AI", () => {
    const message = sanitizeAssistantMessage({
      role: "assistant",
      content: "Unexpected token '<', \"<!doctype\" is not valid JSON",
    });
    expect(message.content).not.toMatch(/unexpected token|json|doctype/i);
  });

  it("crea carpetas personales sin duplicar nombres", () => {
    const thread = createConversation();
    const state: ChatState = { activeThreadId: thread.id, threads: [thread], folders: [] };
    const withFolder = addConversationFolder(state, "Ideas para aprender", "mint");
    const duplicate = addConversationFolder(withFolder, "ideas para aprender", "violet");
    expect(withFolder.folders).toHaveLength(1);
    expect(withFolder.folders?.[0]).toMatchObject({ name: "Ideas para aprender", color: "mint" });
    expect(duplicate.folders).toHaveLength(1);
  });

  it("organiza una conversación mediante favorito, etiquetas y carpeta", () => {
    const thread = createConversation();
    const state: ChatState = { activeThreadId: thread.id, threads: [thread], folders: [{ id: "folder-1", name: "Estudio", color: "violet" }] };
    const result = updateConversationOrganization(state, thread.id, { isFavorite: true, folderId: "folder-1", tags: ["plan", "prioridad"], title: "Plan semanal" });
    expect(result.threads[0]).toMatchObject({ isFavorite: true, folderId: "folder-1", tags: ["plan", "prioridad"], title: "Plan semanal" });
  });
});
