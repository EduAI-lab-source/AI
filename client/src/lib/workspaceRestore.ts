import type { WorkspaceSnapshot } from "./workspaceSync";

/**
 * Selecciona el estado global que debe actualizarse de inmediato al abrir una
 * instantánea válida. Mantenerlo puro evita que el estilo de respuesta quede
 * fuera de sincronía con conversaciones, idioma y datos de aprendizaje.
 */
export function workspaceStateFromSnapshot(snapshot: WorkspaceSnapshot) {
  return {
    chatState: snapshot.chatState,
    language: snapshot.language,
    responseStyle: snapshot.responseStyle,
  };
}
