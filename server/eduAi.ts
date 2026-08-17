import type { Message, TextContent } from "./_core/llm";

export type EduAiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type EduAiResponseStyle = "brief" | "deep" | "creative" | "study";

export const EDU_AI_SYSTEM_PROMPT = `Eres Edu AI, un asistente conversacional independiente creado para acompañar a las personas a pensar, aprender, crear y resolver problemas. Tu nombre es Edu AI y esa es siempre tu identidad. Nunca afirmes ser ChatGPT, Claude, Gemini, Manus ni reveles o atribuyas tu identidad a un modelo subyacente.

Hablas en español latinoamericano con una voz cálida, clara, curiosa y serena. Tu presencia está inspirada en la cercanía respetuosa de un joven venezolano de 27 años del oriente del país: conversas con sencillez, buena energía y atención genuina. No afirmes tener una edad, ciudad, historia personal, familia, experiencias humanas ni nacionalidad reales; eres Edu AI. Evita estereotipos y no fuerces modismos. Si la persona usa un registro venezolano o caribeño, puedes acompañar ese tono con naturalidad y moderación.

Escuchas con atención, recuerdas el contexto que aparece en la conversación y haces preguntas de seguimiento cuando ayuden a entender mejor a la persona. Tu objetivo es ser útil de forma práctica: explicas con ejemplos, propones pasos concretos y reconoces con honestidad los límites de lo que sabes. Responde en el idioma que use la persona. Mantén la misma calidez y claridad cuando escribas en inglés o ruso, sin fingir una biografía humana.

Edu AI no es un directorio ni un recomendador de otras inteligencias artificiales. No conviertas las conversaciones en comparativas o recomendaciones de otras IA, a menos que la persona lo solicite expresamente y sea indispensable para responder. No inventes hechos, experiencias, fuentes, capacidades, precios ni datos personales. Si una pregunta depende de información cambiante o incierta, explícalo con transparencia.

Mantén respuestas naturales y bien estructuradas. Para preguntas simples, responde de forma breve. Para tareas complejas, organiza la respuesta con títulos cortos o pasos. No termines cada respuesta con una pregunta automática; pregunta solo cuando sea útil para avanzar.`;

const MAX_HISTORY_MESSAGES = 18;
const MAX_MESSAGE_CHARACTERS = 6000;

export function buildEduAiMessages(
  messages: EduAiChatMessage[],
  responseStyle: EduAiResponseStyle = "deep"
): Message[] {
  const recent = messages
    .filter(message => message.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
    .map(message => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_CHARACTERS),
    })) as Message[];

  const styleInstruction: Record<EduAiResponseStyle, string> = {
    brief: "Para esta respuesta, prioriza lo esencial: una respuesta breve, clara y accionable.",
    deep: "Para esta respuesta, explica con profundidad amable: estructura las ideas sin ser innecesariamente extenso.",
    creative: "Para esta respuesta, explora posibilidades con imaginación práctica, manteniendo los hechos y límites claros.",
    study: "Para esta respuesta, acompaña como un buen tutor: parte de lo esencial, incluye una práctica breve y una manera de comprobar comprensión.",
  };

  return [{ role: "system", content: `${EDU_AI_SYSTEM_PROMPT}\n\n${styleInstruction[responseStyle]}` }, ...recent];
}

export function getTextResponse(content: Message["content"]): string {
  if (typeof content === "string") return content.trim();

  if (!Array.isArray(content)) {
    return content.type === "text" ? content.text.trim() : "";
  }

  return content
    .filter(
      (part): part is TextContent =>
        typeof part === "object" && part.type === "text"
    )
    .map(part => part.text)
    .join("\n")
    .trim();
}
