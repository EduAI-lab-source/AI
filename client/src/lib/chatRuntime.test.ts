import { describe, expect, it } from "vitest";
import { EDU_AI_PUBLIC_BACKEND, getEduAiApiBase, humanizeChatError, isChatTransportAvailable, resolveEduAiApiBase } from "./chatRuntime";

describe("chatRuntime", () => {
  it("usa un endpoint externo sin conservar barras finales", () => {
    expect(resolveEduAiApiBase("https://api.eduai.example/")).toBe("https://api.eduai.example");
    expect(isChatTransportAvailable({ apiBaseUrl: "https://api.eduai.example/", hostname: "eduai-lab-source.github.io" })).toBe(true);
  });

  it("conecta GitHub Pages al backend público protegido", () => {
    expect(getEduAiApiBase(undefined, "eduai-lab-source.github.io")).toBe(EDU_AI_PUBLIC_BACKEND);
    expect(EDU_AI_PUBLIC_BACKEND).toBe("https://eduai-api.edufirevip.workers.dev");
    expect(isChatTransportAvailable({ hostname: "eduai-lab-source.github.io" })).toBe(true);
  });

  it("convierte una respuesta HTML inválida en un mensaje humano", () => {
    expect(humanizeChatError(new Error("Unexpected token '<', \"<!doctype\" is not valid JSON")))
      .not.toMatch(/unexpected token|json|doctype/i);
  });
});
