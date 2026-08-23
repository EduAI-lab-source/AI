import { describe, expect, it } from "vitest";
import {
  buildEduAiMessages,
  buildEduAiRecoveryMessages,
  EDU_AI_BRIEF_SYSTEM_PROMPT,
  EDU_AI_CREATOR_RESPONSES,
  EDU_AI_SYSTEM_PROMPT,
  getEduAiCreatorReply,
  getEduAiResponseProfile,
  getInstantEduAiReply,
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
    expect(EDU_AI_SYSTEM_PROMPT).toContain("convertir una idea en una experiencia web cuidada");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("ingeniería web, atención por los detalles y creatividad");
    expect(EDU_AI_SYSTEM_PROMPT).toContain("No conviertas estos guiños en una biografía extensa");
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

  it("uses a compact prompt for everyday conversation without turning greetings into questionnaires", () => {
    const messages = buildEduAiMessages([{ role: "user", content: "Holaaaa" }], "brief");

    expect(messages[0]).toMatchObject({ role: "system" });
    expect(String(messages[0]?.content)).toContain("No conviertas un saludo en un cuestionario");
    expect(String(messages[0]?.content)).toContain("una o dos frases");
    expect(EDU_AI_BRIEF_SYSTEM_PROMPT.length).toBeLessThan(EDU_AI_SYSTEM_PROMPT.length);
  });

  it("answers an isolated greeting immediately without invoking the model", () => {
    expect(getInstantEduAiReply("holaaaaaaa")).toContain("Soy Edu AI");
    expect(getInstantEduAiReply("Hello!")).toContain("I’m Edu AI");
    expect(getInstantEduAiReply("Hola, ayúdame con matemáticas")).toBeNull();
  });

  it("presents Eduardo with a specific and varied creator response", () => {
    const response = getEduAiCreatorReply("¿Me puedes decir quién te creó?");

    expect(EDU_AI_CREATOR_RESPONSES).toContain(response);
    expect(response).toContain("Eduardo");
    expect(response).toContain("programación e ingeniería web");
    expect(getEduAiCreatorReply("Ayúdame con matemáticas")).toBeNull();
  });

  it("builds a minimal recovery context when a provider response has no text", () => {
    expect(buildEduAiRecoveryMessages("Hola, necesito ayuda")).toEqual([
      expect.objectContaining({ role: "system" }),
      { role: "user", content: "Hola, necesito ayuda" },
    ]);
  });

  it("uses a distinct instruction for each response preference", () => {
    const prompt = [{ role: "user" as const, content: "Help me learn this in English / Помоги изучить это" }];
    expect(String(buildEduAiMessages(prompt, "brief")[0]?.content)).toContain("una o dos frases");
    expect(String(buildEduAiMessages(prompt, "deep")[0]?.content)).toContain("profundidad amable");
    expect(String(buildEduAiMessages(prompt, "creative")[0]?.content)).toContain("imaginación práctica");
    expect(String(buildEduAiMessages(prompt, "study")[0]?.content)).toContain("práctica breve");
  });

  it("uses a compact low-latency history for everyday answers while retaining more context for detailed modes", () => {
    expect(getEduAiResponseProfile("brief")).toEqual({ historyLimit: 8, reasoning: { effort: "minimal" } });
    expect(getEduAiResponseProfile("deep")).toEqual({ historyLimit: 12, reasoning: { effort: "low" } });
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
