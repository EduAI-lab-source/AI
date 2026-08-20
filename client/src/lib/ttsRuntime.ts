import { getEduAiApiBase } from "@/lib/chatRuntime";

export const TTS_MAX_CHARACTERS = 650;
export const TTS_DAILY_CHARACTER_LIMIT = 650;
const TTS_VISITOR_STORAGE_KEY = "edu-ai:tts-visitor:v1";

export function getTtsApiUrl(hostname = typeof window === "undefined" ? "" : window.location.hostname) {
  const base = getEduAiApiBase(import.meta.env.VITE_EDU_AI_API_URL, hostname);
  return base ? `${base}/api/tts` : "/api/tts";
}

export function normalizeTtsText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

export function prepareTtsText(value: string) {
  return normalizeTtsText(value)
    .split("\n")
    .map(line => line.replace(/[\t ]+/g, " ").trim())
    .filter((line, index, lines) => line || (index > 0 && index < lines.length - 1 && lines[index - 1] !== ""))
    .join("\n")
    .trim();
}

export function countTtsWords(value: string) {
  const normalized = normalizeTtsText(value);
  return normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
}

export function estimateTtsSeconds(value: string) {
  return Math.ceil(countTtsWords(value) / 2.5);
}

export function formatTtsDuration(value: string, language: "es" | "en" | "ru") {
  const seconds = estimateTtsSeconds(value);
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (language === "ru") return `≈ ${minutes} мин`;
  if (language === "en") return `≈ ${minutes} min`;
  return `≈ ${minutes} min`;
}

export function getTtsVisitorId() {
  if (typeof window === "undefined") return "";
  const saved = window.localStorage.getItem(TTS_VISITOR_STORAGE_KEY);
  if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved)) return saved;
  const visitorId = window.crypto?.randomUUID?.();
  if (!visitorId) return "";
  window.localStorage.setItem(TTS_VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

export async function getTtsError(response: Response) {
  const payload = await response.json().catch(() => null) as { error?: unknown } | null;
  return typeof payload?.error === "string" ? payload.error : "No pudimos crear el audio esta vez. Inténtalo de nuevo en un momento.";
}
