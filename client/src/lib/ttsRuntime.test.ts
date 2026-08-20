import { describe, expect, it } from "vitest";
import { TTS_DAILY_CHARACTER_LIMIT, TTS_MAX_CHARACTERS, countTtsWords, formatTtsDuration, getTtsApiUrl, normalizeTtsText, prepareTtsText } from "./ttsRuntime";

describe("utilidades de texto a voz", () => {
  it("mantiene el texto listo para síntesis dentro del límite de seguridad", () => {
    expect(normalizeTtsText("\n Una idea clara. \r\n")).toBe("Una idea clara.");
    expect(TTS_MAX_CHARACTERS).toBe(650);
    expect(TTS_DAILY_CHARACTER_LIMIT).toBe(650);
  });

  it("ordena espacios sin reescribir las ideas y calcula una duración aproximada", () => {
    expect(prepareTtsText("  Una   idea\tclara.  \n\n\nOtra línea.  ")).toBe("Una idea clara.\n\nOtra línea.");
    expect(countTtsWords("Una idea clara para narrar")).toBe(5);
    expect(formatTtsDuration("Una idea clara para narrar", "es")).toBe("≈ 1 min");
  });

  it("usa el gateway público desde el dominio oficial", () => {
    expect(getTtsApiUrl("textoavoz.xyz")).toBe("https://api.textoavoz.xyz/api/tts");
  });
});
