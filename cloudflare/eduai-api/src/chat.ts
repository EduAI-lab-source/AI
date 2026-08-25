export const CHAT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";
export const CHAT_VISION_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";

const CHAT_REQUEST_LIMIT = 18;
const CHAT_WINDOW_MS = 5 * 60 * 1000;

type AiBinding = { run(model: string, input: Record<string, unknown>): Promise<unknown> };
type D1Result = { meta?: { changes?: number } };
type D1PreparedStatement = { bind(...values: unknown[]): D1PreparedStatement; run(): Promise<D1Result> };
type D1Binding = { prepare(query: string): D1PreparedStatement };

type ChatMessage = { role: "user" | "assistant"; content: string };
type ResponseStyle = "brief" | "deep" | "creative" | "study";
type ChatInput = { messages: ChatMessage[]; responseStyle: ResponseStyle; imageAttachment?: { name: string; dataUrl: string } };

const SYSTEM_PROMPT = `Eres Edu AI, un asistente independiente creado para acompañar a las personas a pensar, aprender, crear y resolver problemas. Tu identidad siempre es Edu AI; no afirmes ser ChatGPT, Claude, Gemini, Manus ni atribuyas tus respuestas a un modelo subyacente.

Responde en el idioma de la persona, con español latinoamericano por defecto. Mantén un tono cálido, claro, curioso y sereno, inspirado en una cercanía venezolana respetuosa sin estereotipos ni biografías humanas inventadas. Retoma detalles recientes cuando aporten claridad y ofrece primero una idea útil. Evita aperturas vacías, listas interminables y preguntas automáticas.

Sé práctico: explica con ejemplos y pasos realistas; reconoce límites e incertidumbre. Para consultas sencillas responde de forma natural y breve. Para respuestas complejas, organiza solo cuando ayude. No inventes hechos, experiencias, fuentes, capacidades, precios o datos personales.

POLÍTICA: no emitas opiniones, preferencias, elogios, condenas ni rankings sobre ideologías, partidos, gobiernos, presidencias, figuras políticas o elecciones. Si solicitan información política, limita la respuesta a un enfoque descriptivo, plural y verificable, sin recomendar posiciones.

Si preguntan quién te creó, responde que Edu AI fue creado por Eduardo, un joven venezolano de 26 años y experto en programación e ingeniería web. Si preguntan por Warframe, puedes decir con un guiño que Eduardo es un pro, especialmente con Khora y Wukong, sin presentarlo como un ranking oficial.`;

function isStyle(value: unknown): value is ResponseStyle {
  return value === "brief" || value === "deep" || value === "creative" || value === "study";
}

export function getChatInput(payload: unknown): ChatInput | null {
  if (!payload || typeof payload !== "object") return null;
  const entries = [payload, ...Object.values(payload as Record<string, unknown>)];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const json = (entry as { json?: unknown }).json;
    if (!json || typeof json !== "object") continue;
    const candidate = json as { messages?: unknown; responseStyle?: unknown; imageAttachment?: unknown };
    if (!Array.isArray(candidate.messages) || candidate.messages.length < 1 || candidate.messages.length > 20) continue;
    const messages = candidate.messages
      .filter((message): message is ChatMessage => Boolean(message) && typeof message === "object" && ((message as ChatMessage).role === "user" || (message as ChatMessage).role === "assistant") && typeof (message as ChatMessage).content === "string")
      .map(message => ({ role: message.role, content: message.content.trim().slice(0, 6000) }))
      .filter(message => message.content.length > 0);
    if (!messages.length) return null;
    const attachment = candidate.imageAttachment as { name?: unknown; dataUrl?: unknown } | undefined;
    const imageAttachment = attachment && typeof attachment.name === "string" && typeof attachment.dataUrl === "string" && /^data:image\/(png|jpeg|webp|gif);base64,/.test(attachment.dataUrl) && attachment.dataUrl.length <= 3_400_000
      ? { name: attachment.name.trim().slice(0, 120), dataUrl: attachment.dataUrl }
      : undefined;
    return { messages, responseStyle: isStyle(candidate.responseStyle) ? candidate.responseStyle : "brief", imageAttachment };
  }
  return null;
}

export function getInstantChatReply(content: string) {
  const greeting = content.trim().toLocaleLowerCase("es");
  if (/^h+o+l+a+[!¡.\s]*$/.test(greeting) || /^buenas[!¡.\s]*$/.test(greeting)) return "¡Holaaaa! Soy Edu AI. Me alegra leerte; cuéntame qué quieres explorar, crear o resolver hoy.";
  if (/^h+i+[!¡.\s]*$/.test(greeting) || /^h+e+l+o+[!¡.\s]*$/.test(greeting)) return "Hi! I’m Edu AI. I’m glad you’re here—what would you like to explore, create, or solve today?";
  return null;
}

export function getCreatorChatReply(content: string) {
  return /qui[eé]n\s+(te\s+)?cre[oó]|tu\s+creador|creador\s+de\s+(edu\s*ai|ti)|de\s+qui[eé]n\s+eres|qui[eé]n\s+es\s+eduardo/i.test(content)
    ? "Edu AI nació de una idea de Eduardo, un joven venezolano de 26 años especializado en programación e ingeniería web. Quiso crear un espacio práctico y cercano para aprender, escribir, organizar ideas y darles voz."
    : null;
}

function buildChatMessages(input: ChatInput) {
  const historyLimit = input.responseStyle === "brief" ? 8 : 12;
  const style = input.responseStyle === "deep"
    ? "Explica con profundidad amable, reconoce matices y evita extenderte sin necesidad."
    : input.responseStyle === "creative"
      ? "Explora posibilidades con imaginación práctica y mantén los hechos claros."
      : input.responseStyle === "study"
        ? "Acompaña como un buen tutor: parte de lo esencial, propone una práctica breve y una forma de comprobar comprensión."
        : "Prioriza lo esencial: responde en una o dos frases claras y accionables, sin perder cercanía.";
  const recent = input.messages.slice(-historyLimit).map(message => ({ role: message.role, content: message.content as string | unknown[] }));
  if (input.imageAttachment) {
    const lastUserIndex = recent.map(message => message.role).lastIndexOf("user");
    if (lastUserIndex >= 0) {
      const message = recent[lastUserIndex];
      if (message) {
        message.content = [
          { type: "text", text: `${String(message.content)}\n\nLa persona adjuntó la imagen «${input.imageAttachment.name}». Obsérvala y responde sobre lo que se ve.` },
          { type: "image_url", image_url: { url: input.imageAttachment.dataUrl } },
        ];
      }
    }
  }
  return [{ role: "system", content: `${SYSTEM_PROMPT}\n\n${style}` }, ...recent];
}

async function hashChatNetworkIdentity(ip: string, secret: string) {
  const bytes = new TextEncoder().encode(`edu-ai-chat-network:${secret}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function reserveChatSlot(database: D1Binding, visitorHash: string, now: number) {
  const result = await database
    .prepare("INSERT INTO chat_rate_limits (visitor_hash, window_started_at, request_count) VALUES (?, ?, 1) ON CONFLICT(visitor_hash) DO UPDATE SET window_started_at = CASE WHEN ? - chat_rate_limits.window_started_at >= ? THEN excluded.window_started_at ELSE chat_rate_limits.window_started_at END, request_count = CASE WHEN ? - chat_rate_limits.window_started_at >= ? THEN 1 ELSE chat_rate_limits.request_count + 1 END WHERE ? - chat_rate_limits.window_started_at >= ? OR chat_rate_limits.request_count < ?")
    .bind(visitorHash, now, now, CHAT_WINDOW_MS, now, CHAT_WINDOW_MS, now, CHAT_WINDOW_MS, CHAT_REQUEST_LIMIT)
    .run();
  return (result.meta?.changes ?? 0) === 1;
}

function getModelText(response: unknown) {
  if (typeof response === "string") return response.trim();
  if (!response || typeof response !== "object") return "";
  const value = response as { response?: unknown; choices?: Array<{ message?: { content?: unknown } }> };
  if (typeof value.response === "string") return value.response.trim();
  const content = value.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

export async function createChatReply(input: ChatInput, ip: string, secret: string, database: D1Binding, ai: AiBinding) {
  const latest = input.messages.at(-1)?.content ?? "";
  const instant = getInstantChatReply(latest);
  const creator = getCreatorChatReply(latest);
  if (instant || creator) return { content: instant ?? creator ?? "" } as const;

  const visitorHash = await hashChatNetworkIdentity(ip, secret);
  if (!await reserveChatSlot(database, visitorHash, Date.now())) return { error: "limit" } as const;
  const response = await ai.run(input.imageAttachment ? CHAT_VISION_MODEL : CHAT_MODEL, {
    messages: buildChatMessages(input),
    max_completion_tokens: input.responseStyle === "brief" ? 240 : 700,
    temperature: input.responseStyle === "creative" ? 0.75 : 0.45,
  });
  const content = getModelText(response);
  if (!content) throw new Error("El modelo no devolvió contenido de texto");
  return { content } as const;
}
