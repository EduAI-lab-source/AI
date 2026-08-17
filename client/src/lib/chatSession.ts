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
};

export type ChatState = {
  activeThreadId: string;
  threads: ConversationThread[];
};

const STORAGE_KEY = "edu-ai:chat-state:v2";
const MAX_THREADS = 12;
const MAX_MESSAGES_PER_THREAD = 60;

export const WELCOME_MESSAGE: ConversationMessage = {
  role: "assistant",
  content:
    "Hola, soy **Edu AI**. Estoy aquí para ayudarte a pensar con claridad, aprender, crear y avanzar en lo que importa. ¿Qué te gustaría explorar hoy?",
};

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

export function createConversation(): ConversationThread {
  const now = Date.now();
  return {
    id: makeId(),
    title: "Nueva conversación",
    createdAt: now,
    updatedAt: now,
    messages: [WELCOME_MESSAGE],
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
  const messages = candidate.messages.filter(isMessage).slice(-MAX_MESSAGES_PER_THREAD);
  if (!messages.length) return null;
  const updatedAt = typeof candidate.updatedAt === "number" ? candidate.updatedAt : Date.now();
  return {
    id: candidate.id,
    title: typeof candidate.title === "string" && candidate.title.trim() ? candidate.title : deriveThreadTitle(messages),
    createdAt: typeof candidate.createdAt === "number" ? candidate.createdAt : updatedAt,
    updatedAt,
    messages,
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
    const activeThreadId = threads.some(thread => thread.id === parsed.activeThreadId)
      ? parsed.activeThreadId!
      : threads[0].id;
    return { activeThreadId, threads };
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeThreadId: state.activeThreadId, threads }));
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

export function startFreshConversation(state: ChatState): ChatState {
  const thread = createConversation();
  return { activeThreadId: thread.id, threads: [thread, ...state.threads].slice(0, MAX_THREADS) };
}
