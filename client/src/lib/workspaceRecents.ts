export type WorkspaceNote = { id: string; content: string; createdAt: number };

export const WORKSPACE_NOTES_STORAGE_KEY = "edu-ai:notes:v1";

export function parseWorkspaceNotes(raw: string | null): WorkspaceNote[] {
  try {
    const stored = JSON.parse(raw ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored
      .filter((note): note is WorkspaceNote => Boolean(note && typeof note.id === "string" && typeof note.content === "string" && typeof note.createdAt === "number"))
      .sort((left, right) => right.createdAt - left.createdAt);
  } catch {
    return [];
  }
}

export function loadWorkspaceNotes(): WorkspaceNote[] {
  if (typeof window === "undefined") return [];
  return parseWorkspaceNotes(window.localStorage.getItem(WORKSPACE_NOTES_STORAGE_KEY));
}

export function getLatestWorkspaceNote(): WorkspaceNote | undefined {
  return loadWorkspaceNotes()[0];
}
