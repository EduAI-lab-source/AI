import { getSuggestionApiBase } from "./chatRuntime";

export type CreatorSuggestionInput = { name: string; message: string; website?: string };

type TrpcSuggestionResponse = { result?: { data?: { json?: { accepted?: boolean } } }; error?: { json?: { message?: string } } };

export async function submitCreatorSuggestion(input: CreatorSuggestionInput, hostname = window.location.hostname) {
  const base = getSuggestionApiBase(hostname);
  const response = await fetch(`${base}/api/trpc/feedback.submit`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "trpc-accept": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const payload = await response.json().catch(() => null) as TrpcSuggestionResponse | null;
  if (!response.ok || !payload?.result?.data?.json?.accepted) {
    throw new Error(payload?.error?.json?.message ?? "No pudimos enviar tu sugerencia. Inténtalo de nuevo.");
  }
  return payload.result.data.json;
}
