import { describe, expect, it } from "vitest";
import { formatCreatorSuggestion, getSuggestionEmailSettings } from "./creatorSuggestions";
import { createSuggestionRateLimiter } from "./routers";

describe("creator suggestions", () => {
  it("requiere una configuración completa antes de habilitar el envío de correo", () => {
    expect(getSuggestionEmailSettings({ RESEND_API_KEY: "key", FEEDBACK_RECIPIENT_EMAIL: "owner@example.com" }).isConfigured).toBe(false);
    expect(getSuggestionEmailSettings({ RESEND_API_KEY: "key", FEEDBACK_RECIPIENT_EMAIL: "owner@example.com", SUGGESTIONS_FROM_EMAIL: "Edu AI <suggestions@example.com>" }).isConfigured).toBe(true);
  });

  it("prepara una notificación privada con el nombre y mensaje enviados", () => {
    expect(formatCreatorSuggestion({ name: "Lucía", message: "Me gustó la experiencia de voz." })).toContain("Nombre: Lucía");
    expect(formatCreatorSuggestion({ name: "Lucía", message: "Me gustó la experiencia de voz." })).toContain("Mensaje:");
  });

  it("acepta la credencial privada de Resend sin enviar un correo", async () => {
    const settings = getSuggestionEmailSettings();
    expect(settings.isConfigured).toBe(true);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${settings.apiKey}`,
        "content-type": "application/json",
      },
      // Un cuerpo vacío siempre falla la validación antes de que Resend intente enviar.
      body: "{}",
    });

    // Una clave limitada a envío debe autenticar correctamente aunque el cuerpo no sea enviable.
    expect(response.status).not.toBe(401);
  });

  it("limita los envíos repetidos y vuelve a permitirlos al terminar la ventana", () => {
    const track = createSuggestionRateLimiter(3, 1_000);
    const startedAt = 10_000;

    track("visitor-test", startedAt);
    track("visitor-test", startedAt + 100);
    track("visitor-test", startedAt + 200);
    expect(() => track("visitor-test", startedAt + 300)).toThrow(/Gracias por compartir/);
    expect(() => track("visitor-test", startedAt + 1_000)).not.toThrow();
  });
});
