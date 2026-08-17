export type AppLanguage = "es" | "en" | "ru";

export type AppCopy = {
  documentTitle: string;
  brandSubtitle: string;
  languageLabel: string;
  newConversation: string;
  notebookLabel: string;
  notebookDescription: string;
  privacyNote: string;
  resetThread: string;
  statusLine: string;
  heroTitle: string;
  heroEmphasis: string;
  headerSubtitle: string;
  introOverline: string;
  introTitle: string;
  introEmphasis: string;
  introDescription: string;
  introWhisper: string;
  starters: [string, string, string, string];
  welcomeMessage: string;
  composerPlaceholder: string;
  unavailablePlaceholder: string;
  unavailableMessage: string;
  disclaimer: string;
  openHistory: string;
  closeHistory: string;
  startNewChat: string;
};

export const LANGUAGE_OPTIONS: Array<{ code: AppLanguage; label: string; compact: string; locale: string }> = [
  { code: "es", label: "Español", compact: "ES", locale: "es-419" },
  { code: "en", label: "English", compact: "EN", locale: "en" },
  { code: "ru", label: "Русский", compact: "RU", locale: "ru" },
];

export const COPY: Record<AppLanguage, AppCopy> = {
  es: {
    documentTitle: "Edu AI — Tu espacio para pensar",
    brandSubtitle: "Estudio para tus ideas",
    languageLabel: "Idioma",
    newConversation: "Nueva conversación",
    notebookLabel: "CUADERNO DE IDEAS",
    notebookDescription: "Tus conversaciones viven aquí para que puedas volver cuando quieras.",
    privacyNote: "El contexto se conserva en este navegador.",
    resetThread: "Reiniciar este hilo",
    statusLine: "Espacio para pensar sin prisa",
    heroTitle: "Haz espacio",
    heroEmphasis: "para lo que importa.",
    headerSubtitle: "Una conversación a la vez. Una idea con dirección.",
    introOverline: "EMPEZAR TAMBIÉN ES AVANZAR",
    introTitle: "¿Por dónde",
    introEmphasis: "quieres comenzar?",
    introDescription: "Edu AI te acompaña a observar, ordenar y llevar cada idea a un siguiente paso posible.",
    introWhisper: "Sin respuestas prefabricadas",
    starters: ["Tengo una idea y quiero ordenarla.", "Ayúdame a crear un plan para aprender algo nuevo.", "Necesito pensar una decisión con más claridad.", "Quiero escribir algo, pero no sé cómo empezar."],
    welcomeMessage: "Hola, soy **Edu AI**. Estoy aquí para ayudarte a pensar con claridad, aprender, crear y avanzar en lo que importa. ¿Qué te gustaría explorar hoy?",
    composerPlaceholder: "Escribe lo que estás pensando…",
    unavailablePlaceholder: "La conversación se está preparando…",
    unavailableMessage: "El chat completo se habilitará aquí cuando su conexión segura esté lista.",
    disclaimer: "Edu AI puede equivocarse. Contrasta la información importante antes de actuar.",
    openHistory: "Abrir historial de conversaciones",
    closeHistory: "Cerrar historial",
    startNewChat: "Nueva conversación",
  },
  en: {
    documentTitle: "Edu AI — A space to think",
    brandSubtitle: "A studio for your ideas",
    languageLabel: "Language",
    newConversation: "New conversation",
    notebookLabel: "IDEAS NOTEBOOK",
    notebookDescription: "Your conversations live here, ready for whenever you want to return.",
    privacyNote: "Context stays in this browser.",
    resetThread: "Reset this thread",
    statusLine: "A space to think without rushing",
    heroTitle: "Make room",
    heroEmphasis: "for what matters.",
    headerSubtitle: "One conversation at a time. One idea with direction.",
    introOverline: "BEGINNING IS ALSO MOVING FORWARD",
    introTitle: "Where would you",
    introEmphasis: "like to begin?",
    introDescription: "Edu AI helps you notice, organize, and take each idea to a possible next step.",
    introWhisper: "No prefabricated answers",
    starters: ["I have an idea and want to organize it.", "Help me make a plan to learn something new.", "I need to think through a decision more clearly.", "I want to write something, but I do not know how to start."],
    welcomeMessage: "Hello, I’m **Edu AI**. I’m here to help you think clearly, learn, create, and move toward what matters. What would you like to explore today?",
    composerPlaceholder: "Write what you’re thinking…",
    unavailablePlaceholder: "The conversation is getting ready…",
    unavailableMessage: "The complete chat will be available here when its secure connection is ready.",
    disclaimer: "Edu AI can make mistakes. Check important information before acting on it.",
    openHistory: "Open conversation history",
    closeHistory: "Close history",
    startNewChat: "New conversation",
  },
  ru: {
    documentTitle: "Edu AI — Пространство для мыслей",
    brandSubtitle: "Студия для ваших идей",
    languageLabel: "Язык",
    newConversation: "Новый разговор",
    notebookLabel: "БЛОКНОТ ИДЕЙ",
    notebookDescription: "Ваши разговоры хранятся здесь, чтобы вы могли вернуться к ним в любой момент.",
    privacyNote: "Контекст сохраняется в этом браузере.",
    resetThread: "Начать этот диалог заново",
    statusLine: "Пространство для мыслей без спешки",
    heroTitle: "Освободите место",
    heroEmphasis: "для важного.",
    headerSubtitle: "Один разговор за раз. Одна идея с направлением.",
    introOverline: "НАЧАТЬ — УЖЕ ДВИГАТЬСЯ ВПЕРЁД",
    introTitle: "С чего вы",
    introEmphasis: "хотите начать?",
    introDescription: "Edu AI поможет заметить, упорядочить и превратить каждую идею в возможный следующий шаг.",
    introWhisper: "Без готовых шаблонных ответов",
    starters: ["У меня есть идея, и я хочу её упорядочить.", "Помоги составить план изучения чего-то нового.", "Мне нужно яснее обдумать решение.", "Я хочу что-то написать, но не знаю, с чего начать."],
    welcomeMessage: "Здравствуйте, я **Edu AI**. Я помогу вам ясно мыслить, учиться, создавать и двигаться к тому, что важно. Что бы вы хотели исследовать сегодня?",
    composerPlaceholder: "Напишите, о чём вы думаете…",
    unavailablePlaceholder: "Диалог готовится…",
    unavailableMessage: "Полный чат появится здесь, когда его защищённое подключение будет готово.",
    disclaimer: "Edu AI может ошибаться. Проверяйте важную информацию перед тем, как действовать.",
    openHistory: "Открыть историю разговоров",
    closeHistory: "Закрыть историю",
    startNewChat: "Новый разговор",
  },
};

const LANGUAGE_STORAGE_KEY = "edu-ai:language:v1";

export function loadLanguage(): AppLanguage {
  if (typeof window === "undefined") return "es";
  const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "en" || savedLanguage === "ru" || savedLanguage === "es" ? savedLanguage : "es";
}

export function saveLanguage(language: AppLanguage) {
  if (typeof window !== "undefined") window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getLocale(language: AppLanguage) {
  return LANGUAGE_OPTIONS.find(option => option.code === language)?.locale ?? "es-419";
}
