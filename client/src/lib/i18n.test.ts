import { describe, expect, it } from "vitest";
import { COPY, GLOBAL_TRANSLATION_OPTIONS, LANGUAGE_OPTIONS, getGlobalTranslationUrl, getLocale, isAppLanguage } from "./i18n";

describe("i18n", () => {
  it("ofrece español, inglés y ruso como idiomas completos", () => {
    expect(LANGUAGE_OPTIONS.map(option => option.code)).toEqual(["es", "en", "ru"]);
    expect(COPY.en.newConversation).toBe("New conversation");
    expect(COPY.ru.newConversation).toBe("Новый разговор");
  });

  it("conserva una configuración regional válida para cada idioma", () => {
    expect(getLocale("es")).toBe("es-419");
    expect(getLocale("en")).toBe("en");
    expect(getLocale("ru")).toBe("ru");
  });

  it("ofrece acceso a traducción mundial sin convertir idiomas traducidos en idiomas nativos de la aplicación", () => {
    expect(GLOBAL_TRANSLATION_OPTIONS.length).toBeGreaterThan(90);
    expect(GLOBAL_TRANSLATION_OPTIONS).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "ar" }),
      expect.objectContaining({ code: "fr" }),
      expect.objectContaining({ code: "zh-CN" }),
    ]));
    expect(isAppLanguage("fr")).toBe(false);

    const url = new URL(getGlobalTranslationUrl("fr", "https://textoavoz.xyz/#private-note") ?? "");
    expect(url.origin).toBe("https://translate.google.com");
    expect(url.searchParams.get("sl")).toBe("auto");
    expect(url.searchParams.get("tl")).toBe("fr");
    expect(url.searchParams.get("u")).toBe("https://textoavoz.xyz/");
    expect(getGlobalTranslationUrl("not-a-language", "https://textoavoz.xyz/")).toBeNull();
  });
});
