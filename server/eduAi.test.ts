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
    expect(EDU_AI_SYSTEM_PROMPT).toContain("Edu AI fue creado por Eduardo, un joven venezolano de 26 años y experto en programación e ingeniería web");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("Eduardo es un pro en Warframe, especialmente usando Khora y Wukong");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("no como un ranking oficial");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("No afirmes tener una edad");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("sin fingir una biografía humana");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("no fuerces modismos");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("CONVERSA COMO ALGUIEN QUE ESTÁ PRESTANDO ATENCIÓN");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("Ofrece una idea útil antes de hacer una pregunta");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("No inventes emociones");
  });

  it("adapts the system guidance to the selected response style", () => {
    const messages = buildEduAiMessages(
      [{ role: "user", content: "Explícame la fotosíntesis" }],
      "study"
    );

    expect(String(messages[0]?.content)).toContain("como un buen tutor");
  });

  it("uses a distinct instruction for each response preference", () => {
    const prompt = [{ role: "user" as const, content: "Help me learn this in English / Помоги изучить это" }];
    expect(String(buildEduAiMessages(prompt, "brief")[0]?.content)).toContain("dos a cinco frases");
    expect(String(buildEduAiMessages(prompt, "deep")[0]?.content)).toContain("profundidad amable");
    expect(String(buildEduAiMessages(prompt, "creative")[0]?.content)).toContain("imaginación práctica");
    expect(String(buildEduAiMessages(prompt, "study")[0]?.content)).toContain("práctica breve");
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
