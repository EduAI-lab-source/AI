import { describe, expect, it } from "vitest";
import { LIBRARY_BOOKS } from "./books";

describe("Edu AI library curation", () => {
  it("includes familiar works and editorial discoveries with traceable sources", () => {
    expect(LIBRARY_BOOKS.some(book => book.shelf === "known")).toBe(true);
    expect(LIBRARY_BOOKS.some(book => book.shelf === "discovery")).toBe(true);
    expect(LIBRARY_BOOKS.every(book => book.sourceUrl.startsWith("https://"))).toBe(true);
  });

  it("does not fabricate numeric ratings for curated books", () => {
    const serialized = JSON.stringify(LIBRARY_BOOKS);
    expect(serialized).not.toMatch(/rating|stars|estrellas/i);
  });

  it("adds the verified classics without presenting them as fabricated user ratings", () => {
    expect(LIBRARY_BOOKS.find(book => book.id === "one-hundred-years-of-solitude")).toMatchObject({ author: "Gabriel García Márquez", sourceUrl: "https://www.nobelprize.org/prizes/literature/1982/press-release/" });
    expect(LIBRARY_BOOKS.find(book => book.id === "beloved")).toMatchObject({ author: "Toni Morrison", sourceUrl: "https://www.nobelprize.org/prizes/literature/1993/summary/" });
    expect(LIBRARY_BOOKS.find(book => book.id === "the-remains-of-the-day")).toMatchObject({ author: "Kazuo Ishiguro", sourceUrl: "https://thebookerprizes.com/the-booker-library/books/the-remains-of-the-day" });
  });

  it("credits Teoterapia del amor to Néstor Chamorro and keeps its editorial source", () => {
    const book = LIBRARY_BOOKS.find(item => item.id === "teoterapia-del-amor");

    expect(book).toMatchObject({
      title: { es: "La Teoterapia del amor", en: "Theotherapy of Love", ru: "Теотерапия любви" },
      author: "Néstor Chamorro Pesantes",
      shelf: "known",
      sourceUrl: "https://publimundo.com.co/producto/la-teoterapia-del-amor/",
    });
    expect(book?.note.es).toContain("no sustituye apoyo profesional de salud mental");
  });

  it("localizes every visible title for Spanish, English, and Russian readers", () => {
    expect(LIBRARY_BOOKS.every(book => ["es", "en", "ru"].every(language => book.title[language as keyof typeof book.title].trim().length > 0))).toBe(true);
    expect(LIBRARY_BOOKS.find(book => book.id === "crime-and-punishment")?.title).toMatchObject({
      es: "Crimen y castigo",
      en: "Crime and Punishment",
      ru: "Преступление и наказание",
    });
    expect(LIBRARY_BOOKS.find(book => book.id === "one-hundred-years-of-solitude")?.title.es).toBe("Cien años de soledad");
    expect(LIBRARY_BOOKS.find(book => book.id === "the-remains-of-the-day")?.title.es).toBe("Los restos del día");
  });
});
