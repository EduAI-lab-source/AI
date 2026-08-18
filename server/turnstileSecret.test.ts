import { describe, expect, it } from "vitest";

describe("configuración privada de Turnstile", () => {
  it("mantiene una clave privada con el formato esperado cuando está configurada", () => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return;
    expect(secret).toMatch(/^0x[0-9A-Za-z_-]{20,}$/);
  });

  it.skipIf(process.env.RUN_TURNSTILE_LIVE_CHECK !== "true" || !process.env.TURNSTILE_SECRET_KEY)("es aceptada por el endpoint oficial de validación", async () => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    expect(secret).toMatch(/^0x[0-9A-Za-z_-]{20,}$/);

    const form = new URLSearchParams({ secret: secret!, response: "invalid-validation-token" });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const payload = await response.json() as { success?: unknown; "error-codes"?: unknown };

    expect(response.ok).toBe(true);
    expect(payload.success).toBe(false);
    expect(payload["error-codes"]).not.toContain("invalid-input-secret");
  });
});
