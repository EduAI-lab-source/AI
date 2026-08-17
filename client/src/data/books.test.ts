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

  it("credits Teoterapia del amor to Néstor Chamorro and keeps its editorial source", () => {
    const book = LIBRARY_BOOKS.find(item => item.id === "teoterapia-del-amor");

    expect(book).toMatchObject({
      title: "La Teoterapia del amor",
      author: "Néstor Chamorro Pesantes",
      shelf: "known",
      sourceUrl: "https://publimundo.com.co/producto/la-teoterapia-del-amor/",
    });
    expect(book?.note.es).toContain("no sustituye apoyo profesional de salud mental");
  });
});
