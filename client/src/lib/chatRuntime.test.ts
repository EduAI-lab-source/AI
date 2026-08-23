import { describe, expect, it } from "vitest";
import { CHAT_RETRY_MESSAGE, EDU_AI_PUBLIC_BACKEND, getEduAiApiBase, humanizeChatError, isChatRecoveryMessage, isChatTransportAvailable, resolveEduAiApiBase } from "./chatRuntime";

describe("chatRuntime", () => {
  it("usa un endpoint externo sin conservar barras finales", () => {
    expect(resolveEduAiApiBase("https://api.eduai.example/")).toBe("https://api.eduai.example");
    expect(isChatTransportAvailable({ apiBaseUrl: "https://api.eduai.example/", hostname: "eduai-lab-source.github.io" })).toBe(true);
  });

  it.each(["eduai-lab-source.github.io", "textoavoz.xyz", "www.textoavoz.xyz"])(
    "conecta %s al backend público protegido",
    hostname => {
      expect(getEduAiApiBase(undefined, hostname)).toBe(EDU_AI_PUBLIC_BACKEND);
      expect(isChatTransportAvailable({ hostname })).toBe(true);
    }
  );

  it("no simula una conexión de chat en vistas de desarrollo sin gateway configurado", () => {
    expect(getEduAiApiBase(undefined, "3000-preview.manus.computer")).toBe("");
    expect(isChatTransportAvailable({ hostname: "3000-preview.manus.computer" })).toBe(false);
    expect(getEduAiApiBase(undefined, "localhost")).toBe("");
  });

  it("usa api.textoavoz.xyz como el gateway público", () => {
    expect(EDU_AI_PUBLIC_BACKEND).toBe("https://api.textoavoz.xyz");
  });

  it("convierte una respuesta HTML inválida en un mensaje humano", () => {
    expect(humanizeChatError(new Error("Unexpected token '<', \"<!doctype\" is not valid JSON")))
      .toBe(CHAT_RETRY_MESSAGE);
    expect(humanizeChatError(new Error("Unexpected end of JSON input"))).toBe(CHAT_RETRY_MESSAGE);
    expect(isChatRecoveryMessage(CHAT_RETRY_MESSAGE)).toBe(true);
    expect(isChatRecoveryMessage("Una respuesta normal de Edu AI")).toBe(false);
  });

  it("conserva un mensaje específico cuando existe un límite temporal", () => {
    expect(humanizeChatError(new Error("Edu AI está recibiendo muchas preguntas.")))
      .toMatch(/muchas preguntas/i);
  });
});
