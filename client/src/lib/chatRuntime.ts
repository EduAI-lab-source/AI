export type ChatRuntimeConfig = {
  apiBaseUrl?: string;
  hostname?: string;
};

export const CHAT_RETRY_MESSAGE = "No pude completar la última respuesta. Usa «Reintentar mensaje» para volver a enviar tu pregunta.";

// El Worker conserva las credenciales del modelo fuera de GitHub Pages.
export const EDU_AI_PUBLIC_BACKEND = "https://api.textoavoz.xyz";
export const EDU_AI_SUGGESTION_BACKEND = EDU_AI_PUBLIC_BACKEND;
const EDU_AI_STATIC_APP_HOSTNAMES = new Set([
  "eduai-lab-source.github.io",
  "textoavoz.xyz",
  "www.textoavoz.xyz",
]);

export function resolveEduAiApiBase(value?: string) {
  return (value ?? "").replace(/\/$/, "");
}

export function getEduAiApiBase(value?: string, hostname = "") {
  const configuredBase = resolveEduAiApiBase(value);
  if (configuredBase) return configuredBase;
  return EDU_AI_STATIC_APP_HOSTNAMES.has(hostname) ? EDU_AI_PUBLIC_BACKEND : "";
}

export function getSuggestionApiBase(hostname = "") {
  return EDU_AI_STATIC_APP_HOSTNAMES.has(hostname) ? EDU_AI_SUGGESTION_BACKEND : "";
}

export function isChatTransportAvailable({ apiBaseUrl, hostname = "" }: ChatRuntimeConfig) {
  return Boolean(getEduAiApiBase(apiBaseUrl, hostname));
}

export function humanizeChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const isTransportMismatch = /unexpected token|unexpected end of json|valid json|<!doctype|syntaxerror|json parse/i.test(message);

  if (isTransportMismatch) {
    return CHAT_RETRY_MESSAGE;
  }

  if (/muchas preguntas|too many requests/i.test(message)) {
    return "Edu AI está recibiendo muchas preguntas. Espera unos minutos antes de continuar.";
  }

  return CHAT_RETRY_MESSAGE;
}

export function isChatRecoveryMessage(content: string) {
  return content === CHAT_RETRY_MESSAGE;
}
