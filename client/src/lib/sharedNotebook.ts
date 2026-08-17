export type SharedNotebookNote = { content: string; createdAt?: number };

export function parseSharedNotebookSnapshot(snapshot: string): SharedNotebookNote[] {
  try {
    const parsed = JSON.parse(snapshot) as { version?: unknown; notes?: unknown };
    if (parsed.version !== 1 || !Array.isArray(parsed.notes)) return [];
    return parsed.notes.flatMap(note => {
      if (!note || typeof note !== "object") return [];
      const record = note as { content?: unknown; createdAt?: unknown };
      if (typeof record.content !== "string" || !record.content.trim()) return [];
      return [{ content: record.content, createdAt: typeof record.createdAt === "number" ? record.createdAt : undefined }];
    });
  } catch { return []; }
}
