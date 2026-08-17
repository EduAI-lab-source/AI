import { describe, expect, it } from "vitest";
import { workspaceStateFromSnapshot } from "./workspaceRestore";
import type { WorkspaceSnapshot } from "./workspaceSync";

describe("restauración del estado del espacio", () => {
  it("conserva y aplica la preferencia de respuesta incluida en la instantánea", () => {
    const snapshot: WorkspaceSnapshot = {
      version: 1,
      syncedAt: "2026-08-17T00:00:00.000Z",
      language: "es",
      responseStyle: "study",
      chatState: { activeThreadId: "thread-1", threads: [] },
      learning: { notes: [], readingList: [], progress: { weeklyGoal: 3, completedDays: [] } },
    };

    expect(workspaceStateFromSnapshot(snapshot)).toEqual({
      chatState: snapshot.chatState,
      language: "es",
      responseStyle: "study",
    });
  });
});
