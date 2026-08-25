import { notifyOwner } from "./_core/notification";

export const CREATOR_SUGGESTION_TITLE = "Nueva sugerencia para Edu AI";

export type CreatorSuggestionPayload = {
  name: string;
  message: string;
};

type EmailEnvironment = {
  RESEND_API_KEY?: string;
  FEEDBACK_RECIPIENT_EMAIL?: string;
  SUGGESTIONS_FROM_EMAIL?: string;
  [key: string]: string | undefined;
};

export function getSuggestionEmailSettings(env: EmailEnvironment = process.env) {
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const recipient = env.FEEDBACK_RECIPIENT_EMAIL?.trim() ?? "";
  const from = env.SUGGESTIONS_FROM_EMAIL?.trim() ?? "";
  return { apiKey, recipient, from, isConfigured: Boolean(apiKey && recipient && from) };
}

export function formatCreatorSuggestion({ name, message }: CreatorSuggestionPayload) {
  return `Nombre: ${name}\n\nMensaje:\n${message}`;
}

export async function notifyCreatorAboutSuggestion(payload: CreatorSuggestionPayload) {
  const content = formatCreatorSuggestion(payload);
  const ownerNotified = await notifyOwner({ title: CREATOR_SUGGESTION_TITLE, content });
  const settings = getSuggestionEmailSettings();

  if (!settings.isConfigured) return { ownerNotified, emailDelivered: false };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${settings.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: settings.from,
        to: [settings.recipient],
        subject: CREATOR_SUGGESTION_TITLE,
        text: content,
      }),
    });
    return { ownerNotified, emailDelivered: response.ok };
  } catch (error) {
    console.warn("[CreatorSuggestion] Email delivery failed", error);
    return { ownerNotified, emailDelivered: false };
  }
}
