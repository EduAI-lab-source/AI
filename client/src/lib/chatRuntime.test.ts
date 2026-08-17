import { describe, expect, it } from "vitest";
import { EDU_AI_PUBLIC_BACKEND, getEduAiApiBase, humanizeChatError, isChatTransportAvailable, resolveEduAiApiBase } from "./chatRuntime";

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

  it("usa api.textoavoz.xyz como el gateway público", () => {
    expect(EDU_AI_PUBLIC_BACKEND).toBe("https://api.textoavoz.xyz");
  });

  it("convierte una respuesta HTML inválida en un mensaje humano", () => {
    expect(humanizeChatError(new Error("Unexpected token '<', \"<!doctype\" is not valid JSON")))
      .not.toMatch(/unexpected token|json|doctype/i);
  });
});
