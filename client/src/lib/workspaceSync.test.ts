import { describe, expect, it } from "vitest";
import { isWorkspaceSnapshot, parseSyncCode } from "./workspaceSync";

const code = `${"a".repeat(43)}.${"b".repeat(43)}`;

describe("código y formato de sincronización privada", () => {
  it("acepta un código privado URL-seguro y rechaza formatos débiles", () => {
    expect(parseSyncCode(code)).toEqual({ syncId: "a".repeat(43), key: "b".repeat(43) });
    expect(parseSyncCode("corto.secreto")).toBeNull();
    expect(parseSyncCode(`${"a".repeat(43)}.clave con espacio`)).toBeNull();
  });

  it("solo considera restaurables las instantáneas con la estructura esperada", () => {
    expect(isWorkspaceSnapshot({
      version: 1,
      syncedAt: new Date().toISOString(),
      language: "es",
      responseStyle: "deep",
      chatState: { activeThreadId: "thread-1", threads: [] },
      learning: { notes: [], readingList: [], progress: { weeklyGoal: 3, completedDays: [] } },
    })).toBe(true);
    expect(isWorkspaceSnapshot({ version: 1, language: "es" })).toBe(false);
  });
});
