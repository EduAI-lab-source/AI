export type ChatRuntimeConfig = {
  apiBaseUrl?: string;
  hostname?: string;
};

// El Worker conserva las credenciales del modelo fuera de GitHub Pages. Cuando
// `api.textoavoz.xyz` termine de propagarse, esta URL se sustituirá por el dominio propio.
export const EDU_AI_PUBLIC_BACKEND = "https://eduai-api.edufirevip.workers.dev";
const GITHUB_PAGES_HOSTNAME = "eduai-lab-source.github.io";

export function resolveEduAiApiBase(value?: string) {
  return (value ?? "").replace(/\/$/, "");
}

export function getEduAiApiBase(value?: string, hostname = "") {
  const configuredBase = resolveEduAiApiBase(value);
  if (configuredBase) return configuredBase;
  return hostname === GITHUB_PAGES_HOSTNAME ? EDU_AI_PUBLIC_BACKEND : "";
}

export function isChatTransportAvailable({ apiBaseUrl, hostname = "" }: ChatRuntimeConfig) {
  if (getEduAiApiBase(apiBaseUrl, hostname)) return true;
  return !hostname.endsWith("github.io");
}

export function humanizeChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const isTransportMismatch = /unexpected token|valid json|<!doctype|syntaxerror/i.test(message);

  if (isTransportMismatch) {
    return "La conversación está preparando una conexión segura. Inténtalo de nuevo cuando esté disponible.";
  }

  return "No pude responder esta vez. Inténtalo de nuevo en unos momentos.";
}
