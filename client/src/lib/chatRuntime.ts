export type ChatRuntimeConfig = {
  apiBaseUrl?: string;
  hostname?: string;
};

export function resolveEduAiApiBase(value?: string) {
  return (value ?? "").replace(/\/$/, "");
}

export function isChatTransportAvailable({ apiBaseUrl, hostname = "" }: ChatRuntimeConfig) {
  if (resolveEduAiApiBase(apiBaseUrl)) return true;
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
