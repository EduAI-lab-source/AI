import { describe, expect, it } from "vitest";
import { COPY, LANGUAGE_OPTIONS, getLocale } from "./i18n";

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
});
