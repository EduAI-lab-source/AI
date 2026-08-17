export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ConversationMessage[];
  folderId?: string;
  tags?: string[];
  isFavorite?: boolean;
};

export type ConversationFolder = {
  id: string;
  name: string;
  color: "violet" | "peach" | "mint";
};

export type ChatState = {
  activeThreadId: string;
  threads: ConversationThread[];
  folders?: ConversationFolder[];
};

export type ConversationSeed = {
  title?: string;
  welcomeMessage?: ConversationMessage;
};

const STORAGE_KEY = "edu-ai:chat-state:v2";
const MAX_THREADS = 12;
const MAX_MESSAGES_PER_THREAD = 60;

export const WELCOME_MESSAGE: ConversationMessage = {
  role: "assistant",
  content:
    "Hola, soy **Edu AI**. Estoy aquí para ayudarte a pensar con claridad, aprender, crear y avanzar en lo que importa. ¿Qué te gustaría explorar hoy?",
};

const TECHNICAL_ERROR_PATTERN = /unexpected token|valid json|<!doctype|syntaxerror/i;

export function sanitizeAssistantMessage(message: ConversationMessage): ConversationMessage {
  if (message.role !== "assistant" || !TECHNICAL_ERROR_PATTERN.test(message.content)) return message;
  return {
    ...message,
    content: "La conversación está preparando una conexión segura. Inténtalo de nuevo cuando esté disponible.",
  };
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `edu-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function deriveThreadTitle(messages: ConversationMessage[]) {
  const firstUserMessage = messages.find(message => message.role === "user")?.content.trim();
  if (!firstUserMessage) return "Nueva conversación";
  return firstUserMessage.length > 44
    ? `${firstUserMessage.slice(0, 44).trimEnd()}…`
    : firstUserMessage;
}

export function describeThreadRecency(updatedAt: number, now = Date.now(), locale = "es-419") {
  const minutes = Math.max(0, Math.floor((now - updatedAt) / 60_000));
  if (locale !== "es-419") {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
    if (minutes < 60) return formatter.format(-minutes, "minute");
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return formatter.format(-hours, "hour");
    const days = Math.floor(hours / 24);
    if (days < 7) return formatter.format(-days, "day");
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(updatedAt);
  }
  if (minutes < 2) return "Ahora mismo";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  if (hours < 48) return "Ayer";
  return new Intl.DateTimeFormat("es-419", { day: "numeric", month: "short" }).format(updatedAt);
}

export function createConversation(seed: ConversationSeed = {}): ConversationThread {
  const now = Date.now();
  return {
    id: makeId(),
    title: seed.title ?? "Nueva conversación",
    createdAt: now,
    updatedAt: now,
    messages: [seed.welcomeMessage ?? WELCOME_MESSAGE],
    tags: [],
    isFavorite: false,
  };
}

function isMessage(value: unknown): value is ConversationMessage {
  return Boolean(value) && typeof value === "object" &&
    ((value as ConversationMessage).role === "user" || (value as ConversationMessage).role === "assistant") &&
    typeof (value as ConversationMessage).content === "string" &&
    (value as ConversationMessage).content.trim().length > 0;
}

function normalizeThread(value: unknown): ConversationThread | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<ConversationThread>;
  if (!candidate.id || !Array.isArray(candidate.messages)) return null;
  const messages = candidate.messages.filter(isMessage).slice(-MAX_MESSAGES_PER_THREAD).map(sanitizeAssistantMessage);
  if (!messages.length) return null;
  const updatedAt = typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now();
  return {
    id: candidate.id,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : deriveThreadTitle(messages),
    createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : updatedAt,
    updatedAt,
    messages,
    folderId: typeof candidate.folderId === "string" ? candidate.folderId : undefined,
    tags: Array.isArray(candidate.tags) ? candidate.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 6) : [],
    isFavorite: candidate.isFavorite === true,
  };
}

export function loadChatState(): ChatState {
  const fallback = createConversation();
  if (typeof window === "undefined") return { activeThreadId: fallback.id, threads: [fallback] };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { activeThreadId: fallback.id, threads: [fallback] };
    const parsed = JSON.parse(raw) as Partial<ChatState>;
    const threads = Array.isArray(parsed.threads)
      ? parsed.threads.map(normalizeThread).filter((thread): thread is ConversationThread => Boolean(thread)).slice(0, MAX_THREADS)
      : [];
    if (!threads.length) return { activeThreadId: fallback.id, threads: [fallback] };
    const folders = Array.isArray(parsed.folders)
      ? parsed.folders.filter((folder): folder is ConversationFolder => Boolean(folder && typeof folder.id === "string" && typeof folder.name === "string" && ["violet", "peach", "mint"].includes(folder.color))).slice(0, 12)
      : [];
    const activeThreadId = threads.some(thread => thread.id === parsed.activeThreadId)
      ? parsed.activeThreadId!
      : threads[0].id;
    return { activeThreadId, threads, folders };
  } catch {
    return { activeThreadId: fallback.id, threads: [fallback] };
  }
}

export function saveChatState(state: ChatState) {
  if (typeof window === "undefined") return;
  const threads = [...state.threads]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_THREADS)
    .map(thread => ({ ...thread, messages: thread.messages.slice(-MAX_MESSAGES_PER_THREAD) }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeThreadId: state.activeThreadId, threads, folders: state.folders ?? [] }));
}

export function replaceThreadMessages(
  state: ChatState,
  threadId: string,
  messages: ConversationMessage[]
): ChatState {
  const updatedAt = Date.now();
  const threads = state.threads.map(thread => thread.id === threadId
    ? {
        ...thread,
        title: deriveThreadTitle(messages),
        updatedAt,
        messages: messages.slice(-MAX_MESSAGES_PER_THREAD),
      }
    : thread);
  return { ...state, threads: threads.sort((a, b) => b.updatedAt - a.updatedAt) };
}

export function startFreshConversation(state: ChatState, seed: ConversationSeed = {}): ChatState {
  const thread = createConversation(seed);
  return { activeThreadId: thread.id, threads: [thread, ...state.threads].slice(0, MAX_THREADS) };
}

export function removeConversation(state: ChatState, threadId: string, seed: ConversationSeed = {}): ChatState {
  const remainingThreads = state.threads.filter(thread => thread.id !== threadId)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  if (!remainingThreads.length) {
    const replacement = createConversation(seed);
    return { activeThreadId: replacement.id, threads: [replacement] };
  }

  const activeThreadId = state.activeThreadId === threadId
    ? remainingThreads[0].id
    : remainingThreads.some(thread => thread.id === state.activeThreadId)
      ? state.activeThreadId
      : remainingThreads[0].id;

  return { activeThreadId, threads: remainingThreads };
}

export function updateConversationOrganization(
  state: ChatState,
  threadId: string,
  changes: Partial<Pick<ConversationThread, "folderId" | "tags" | "isFavorite" | "title">>
): ChatState {
  return {
    ...state,
    threads: state.threads.map(thread => thread.id === threadId ? { ...thread, ...changes, updatedAt: Date.now() } : thread),
  };
}

export function addConversationFolder(
  state: ChatState,
  name: string,
  color: ConversationFolder["color"] = "violet"
): ChatState {
  const trimmed = name.trim().slice(0, 36);
  if (!trimmed || (state.folders ?? []).some(folder => folder.name.toLowerCase() === trimmed.toLowerCase())) return state;
  const folder: ConversationFolder = { id: makeId(), name: trimmed, color };
  return { ...state, folders: [...(state.folders ?? []), folder].slice(0, 12) };
}
