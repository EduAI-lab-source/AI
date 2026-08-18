import { describe, expect, it } from "vitest";
import { createTtsNetworkIdentity, evaluateTtsQuota, TTS_DAILY_CHARACTERS_PER_VISITOR, TTS_DAILY_CHARACTERS_SHARED, TTS_DAILY_REQUESTS_PER_VISITOR } from "./ttsQuota";

describe("cuota gratuita de texto a voz", () => {
  const empty = { usedCharacters: 0, requests: 0 };

  it("permite un único audio completo de 650 caracteres al día", () => {
    expect(TTS_DAILY_CHARACTERS_PER_VISITOR).toBe(650);
    expect(TTS_DAILY_REQUESTS_PER_VISITOR).toBe(1);
    expect(evaluateTtsQuota({ requestedCharacters: 650, visitor: empty, global: empty })).toMatchObject({
      allowed: true,
      remainingVisitorCharacters: 0,
    });
  });

  it("reserva una síntesis y comunica la capacidad restante", () => {
    const decision = evaluateTtsQuota({ requestedCharacters: 420, visitor: empty, global: empty });
    expect(decision).toMatchObject({
      allowed: true,
      visitor: { usedCharacters: 420, requests: 1 },
      global: { usedCharacters: 420, requests: 1 },
      remainingVisitorCharacters: TTS_DAILY_CHARACTERS_PER_VISITOR - 420,
      remainingGlobalCharacters: TTS_DAILY_CHARACTERS_SHARED - 420,
    });
  });

  it("rechaza el segundo audio diario del mismo visitante", () => {
    const decision = evaluateTtsQuota({ requestedCharacters: 10, visitor: { usedCharacters: 30, requests: TTS_DAILY_REQUESTS_PER_VISITOR }, global: empty });
    expect(decision).toEqual({ allowed: false, reason: "visitor_requests" });
  });

  it("protege el cupo diario compartido", () => {
    const decision = evaluateTtsQuota({ requestedCharacters: 20, visitor: empty, global: { usedCharacters: TTS_DAILY_CHARACTERS_SHARED - 10, requests: 8 } });
    expect(decision).toEqual({ allowed: false, reason: "shared_capacity" });
  });

  it("conserva la identidad diaria si el visitante reinicia sus datos locales", () => {
    const identity = createTtsNetworkIdentity("203.0.113.42", "secret-de-prueba");
    expect(createTtsNetworkIdentity("203.0.113.42", "secret-de-prueba")).toBe(identity);
    expect(createTtsNetworkIdentity("203.0.113.43", "secret-de-prueba")).not.toBe(identity);
    expect(identity).not.toContain("203.0.113.42");
  });
});
