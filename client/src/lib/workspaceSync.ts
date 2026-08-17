import type { ChatState } from "./chatSession";
import type { AppLanguage } from "./i18n";

export type WorkspaceResponseStyle = "brief" | "deep" | "creative" | "study";
export type WorkspaceNote = { id: string; content: string; createdAt: number };
export type WorkspaceProgress = { weeklyGoal: number; completedDays: string[] };
export type WorkspaceSnapshot = {
  version: 1;
  chatState: ChatState;
  learning: { notes: WorkspaceNote[]; readingList: string[]; progress: WorkspaceProgress };
  language: AppLanguage;
  responseStyle: WorkspaceResponseStyle;
  syncedAt: string;
};

type SyncToken = { syncId: string; key: string };
type CipherEnvelope = { version: 1; iv: string; ciphertext: string };

export const SYNC_CODE_STORAGE_KEY = "edu-ai:private-sync-code:v1";
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function getCrypto() {
  if (typeof crypto === "undefined" || !crypto.subtle) throw new Error("Este navegador no ofrece cifrado local compatible.");
  return crypto;
}

function tokenToCode(token: SyncToken) {
  return `${token.syncId}.${token.key}`;
}

export function parseSyncCode(value: string): SyncToken | null {
  const [syncId, key, ...extra] = value.trim().replace(/\s/g, "").split(".");
  if (extra.length || !syncId || !key || syncId.length < 32 || syncId.length > 96 || key.length < 32 || key.length > 96) return null;
  if (!BASE64_URL_PATTERN.test(syncId) || !BASE64_URL_PATTERN.test(key)) return null;
  return { syncId, key };
}

export function createSyncCode() {
  const webCrypto = getCrypto();
  const syncId = bytesToBase64Url(webCrypto.getRandomValues(new Uint8Array(32)));
  const key = bytesToBase64Url(webCrypto.getRandomValues(new Uint8Array(32)));
  return tokenToCode({ syncId, key });
}

export function loadSyncCode() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SYNC_CODE_STORAGE_KEY) ?? "";
}

export function persistSyncCode(value: string) {
  const token = parseSyncCode(value);
  if (!token || typeof window === "undefined") return false;
  window.localStorage.setItem(SYNC_CODE_STORAGE_KEY, tokenToCode(token));
  return true;
}

async function importEncryptionKey(token: SyncToken) {
  return getCrypto().subtle.importKey("raw", base64UrlToBytes(token.key), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptWorkspace(syncCode: string, workspace: WorkspaceSnapshot) {
  const token = parseSyncCode(syncCode);
  if (!token) throw new Error("El código privado no es válido.");
  const webCrypto = getCrypto();
  const iv = webCrypto.getRandomValues(new Uint8Array(12));
  const plainText = new TextEncoder().encode(JSON.stringify(workspace));
  const encrypted = await webCrypto.subtle.encrypt({ name: "AES-GCM", iv }, await importEncryptionKey(token), plainText);
  const envelope: CipherEnvelope = { version: 1, iv: bytesToBase64Url(iv), ciphertext: bytesToBase64Url(new Uint8Array(encrypted)) };
  return { syncId: token.syncId, ciphertext: JSON.stringify(envelope) };
}

export async function decryptWorkspace(syncCode: string, encryptedValue: string) {
  const token = parseSyncCode(syncCode);
  if (!token) throw new Error("El código privado no es válido.");
  let envelope: CipherEnvelope;
  try { envelope = JSON.parse(encryptedValue) as CipherEnvelope; } catch { throw new Error("La copia remota no tiene un formato válido."); }
  if (envelope?.version !== 1 || typeof envelope.iv !== "string" || typeof envelope.ciphertext !== "string") throw new Error("La copia remota no tiene un formato válido.");
  try {
    const decrypted = await getCrypto().subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlToBytes(envelope.iv) },
      await importEncryptionKey(token),
      base64UrlToBytes(envelope.ciphertext)
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as unknown;
  } catch {
    throw new Error("No fue posible abrir esta copia. Comprueba que el código privado sea el correcto.");
  }
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<WorkspaceSnapshot>;
  const validLanguage = snapshot.language === "es" || snapshot.language === "en" || snapshot.language === "ru";
  const validStyle = snapshot.responseStyle === "brief" || snapshot.responseStyle === "deep" || snapshot.responseStyle === "creative" || snapshot.responseStyle === "study";
  return snapshot.version === 1
    && typeof snapshot.syncedAt === "string"
    && validLanguage
    && validStyle
    && Boolean(snapshot.chatState && Array.isArray(snapshot.chatState.threads) && typeof snapshot.chatState.activeThreadId === "string")
    && Boolean(snapshot.learning && Array.isArray(snapshot.learning.notes) && Array.isArray(snapshot.learning.readingList) && snapshot.learning.progress && typeof snapshot.learning.progress.weeklyGoal === "number" && Array.isArray(snapshot.learning.progress.completedDays));
}
