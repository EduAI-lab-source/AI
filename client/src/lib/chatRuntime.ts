export type ChatRuntimeConfig = {
  apiBaseUrl?: string;
  hostname?: string;
};

// El Worker conserva las credenciales del modelo fuera de GitHub Pages.
export const EDU_AI_PUBLIC_BACKEND = "https://api.textoavoz.xyz";
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

export function isChatTransportAvailable({ apiBaseUrl, hostname = "" }: ChatRuntimeConfig) {
  if (getEduAiApiBase(apiBaseUrl, hostname)) return true;
  return !hostname.endsWith("github.io") && !EDU_AI_STATIC_APP_HOSTNAMES.has(hostname);
}

export function humanizeChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const isTransportMismatch = /unexpected token|valid json|<!doctype|syntaxerror/i.test(message);

  if (isTransportMismatch) {
    return "La conversación está preparando una conexión segura. Inténtalo de nuevo cuando esté disponible.";
  }

  return "No pude responder esta vez. Inténtalo de nuevo en unos momentos.";
}
