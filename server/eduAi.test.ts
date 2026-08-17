import { describe, expect, it } from "vitest";
import {
  buildEduAiMessages,
  EDU_AI_SYSTEM_PROMPT,
  getTextResponse,
} from "./eduAi";

describe("Edu AI conversation contract", () => {
  it("starts every request with Edu AI's own identity", () => {
    const messages = buildEduAiMessages([
      { role: "user", content: "Hola, ¿puedes ayudarme a estudiar?" },
    ]);

    expect(messages[0]).toMatchObject({ role: "system" });
    expect(EDU_AI_SYSTEM_PROMPT).toContain("Eres Edu AI");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("Nunca afirmes ser ChatGPT");
  });

  it("keeps recent context while removing empty messages", () => {
    const messages = buildEduAiMessages([
      { role: "user", content: "Primero quiero aprender JavaScript." },
      { role: "assistant", content: "Perfecto, empecemos por lo esencial." },
      { role: "user", content: "   " },
      { role: "user", content: "¿Qué debo practicar primero?" },
    ]);

    expect(messages).toHaveLength(4);
    expect(messages.at(-1)).toMatchObject({
      role: "user",
      content: "¿Qué debo practicar primero?",
    });
  });

  it("normalizes textual model responses", () => {
    expect(getTextResponse("  Hola, soy Edu AI.  ")).toBe("Hola, soy Edu AI.");
    expect(
      getTextResponse([
        { type: "text", text: "Primera parte" },
        { type: "text", text: "Segunda parte" },
      ])
    ).toBe("Primera parte\nSegunda parte");
  });
});
