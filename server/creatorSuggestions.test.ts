import { describe, expect, it } from "vitest";
import { formatCreatorSuggestion, getSuggestionEmailSettings } from "./creatorSuggestions";
import { createSuggestionRateLimiter, creatorSuggestionInputSchema } from "./routers";

describe("creator suggestions", () => {
  it("requiere una configuración completa antes de habilitar el envío de correo", () => {
    expect(getSuggestionEmailSettings({ RESEND_API_KEY: "key", FEEDBACK_RECIPIENT_EMAIL: "owner@example.com" }).isConfigured).toBe(false);
    expect(getSuggestionEmailSettings({ RESEND_API_KEY: "key", FEEDBACK_RECIPIENT_EMAIL: "owner@example.com", SUGGESTIONS_FROM_EMAIL: "Edu AI <suggestions@example.com>" }).isConfigured).toBe(true);
  });

  it("prepara una notificación privada con el nombre y mensaje enviados", () => {
    expect(formatCreatorSuggestion({ name: "Lucía", message: "Me gustó la experiencia de voz." })).toContain("Nombre: Lucía");
    expect(formatCreatorSuggestion({ name: "Lucía", message: "Me gustó la experiencia de voz." })).toContain("Mensaje:");
  });

  it("reconoce la configuración privada de Resend sin acceder a la red", () => {
    const settings = getSuggestionEmailSettings();
    expect(settings.isConfigured).toBe(true);
    expect(settings.apiKey.length).toBeGreaterThan(10);
    expect(settings.recipient).toContain("@");
    expect(settings.from).toContain("@");
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

  it("acepta la trampa de bots para que el servidor pueda descartar el envío sin procesarlo", () => {
    expect(creatorSuggestionInputSchema.parse({
      name: "Bot",
      message: "Este texto cumple la longitud mínima.",
      website: "https://spam.example",
    }).website).toBe("https://spam.example");
  });
});
