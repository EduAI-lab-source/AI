import { describe, expect, it } from "vitest";
import { parseWorkspaceNotes } from "./workspaceRecents";

describe("workspaceRecents", () => {
  it("conserva solo notas válidas y muestra primero la más reciente", () => {
    const notes = parseWorkspaceNotes(JSON.stringify([
      { id: "older", content: "Primera idea", createdAt: 10 },
      { id: "latest", content: "Última idea", createdAt: 30 },
      { id: "invalid", content: 42, createdAt: 20 },
    ]));

    expect(notes).toEqual([
      { id: "latest", content: "Última idea", createdAt: 30 },
      { id: "older", content: "Primera idea", createdAt: 10 },
    ]);
  });

  it("evita que una copia dañada de almacenamiento bloquee el inicio", () => {
    expect(parseWorkspaceNotes("{")).toEqual([]);
  });
});
