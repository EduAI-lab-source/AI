import { describe, expect, it } from "vitest";
import { parseSharedNotebookSnapshot } from "./sharedNotebook";

describe("parseSharedNotebookSnapshot", () => {
  it("acepta únicamente notas del formato compartido previsto", () => {
    expect(parseSharedNotebookSnapshot(JSON.stringify({ version: 1, notes: [{ content: "Una idea", createdAt: 10 }, { content: "  " }, { other: "no" }] }))).toEqual([{ content: "Una idea", createdAt: 10 }]);
  });

  it("rechaza cargas inválidas sin propagar contenido", () => {
    expect(parseSharedNotebookSnapshot("no es json")).toEqual([]);
    expect(parseSharedNotebookSnapshot(JSON.stringify({ version: 2, notes: [{ content: "no publicar" }] }))).toEqual([]);
  });
});
