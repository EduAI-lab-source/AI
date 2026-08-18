import { describe, expect, it } from "vitest";
import { TTS_MAX_CHARACTERS, getTtsApiUrl, normalizeTtsText } from "./ttsRuntime";

describe("utilidades de texto a voz", () => {
  it("mantiene el texto listo para síntesis dentro del límite de seguridad", () => {
    expect(normalizeTtsText("\n Una idea clara. \r\n")).toBe("Una idea clara.");
    expect(TTS_MAX_CHARACTERS).toBe(650);
  });

  it("usa el gateway público desde el dominio oficial", () => {
    expect(getTtsApiUrl("textoavoz.xyz")).toBe("https://api.textoavoz.xyz/api/tts");
  });
});
