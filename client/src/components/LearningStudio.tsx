import { LIBRARY_BOOKS, LIBRARY_COPY } from "@/data/books";
import type { AppLanguage } from "@/lib/i18n";
import {
  BookOpen,
  BookText,
  Brain,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardPenLine,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  GraduationCap,
  LibraryBig,
  ListChecks,
  KeyRound,
  PenLine,
  Share2,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { createSyncCode, decryptWorkspace, encryptWorkspace, isWorkspaceSnapshot, loadSyncCode, parseSyncCode, persistSyncCode, type WorkspaceSnapshot } from "@/lib/workspaceSync";
import type { ChatState } from "@/lib/chatSession";

type StudioTab = "library" | "tools" | "notes" | "study" | "progress" | "preferences";
export type ResponseStyle = "brief" | "deep" | "creative" | "study";

type LearningStudioProps = {
  language: AppLanguage;
  latestAssistantMessage?: string;
  onAskEdu: (prompt: string) => void;
  onClose: () => void;
  responseStyle: ResponseStyle;
  onResponseStyleChange: (style: ResponseStyle) => void;
  chatState: ChatState;
  onRestoreWorkspace: (snapshot: WorkspaceSnapshot) => void;
};

type StudioNote = { id: string; content: string; createdAt: number };
type StudioProgress = { weeklyGoal: number; completedDays: string[] };

const READING_STORAGE_KEY = "edu-ai:library:v1";
const NOTES_STORAGE_KEY = "edu-ai:notes:v1";
const PROGRESS_STORAGE_KEY = "edu-ai:progress:v1";

const TOOL_PROMPTS: Record<AppLanguage, Array<{ label: string; description: string; prompt: string; icon: "summary" | "plan" | "write" | "decision" | "study" }>> = {
  es: [
    { label: "Resumir con claridad", description: "Quédate con lo que sí importa.", prompt: "Ayúdame a resumir este tema con claridad. Primero identifica la idea central, luego los puntos esenciales y termina con un siguiente paso útil.", icon: "summary" },
    { label: "Plan realista", description: "Pasos pequeños que sí puedo sostener.", prompt: "Quiero crear un plan realista. Pregúntame mi objetivo, tiempo disponible y punto de partida; luego proponme pasos semanales.", icon: "plan" },
    { label: "Escribir mejor", description: "Una primera versión con mi voz.", prompt: "Ayúdame a escribir. Pregúntame por el propósito, la persona que lo leerá y el tono; después crea una primera versión editable.", icon: "write" },
    { label: "Decidir con calma", description: "Ordena opciones sin decidir por mí.", prompt: "Necesito pensar una decisión con calma. Ayúdame a ordenar opciones, criterios, riesgos y próximos pasos sin decidir por mí.", icon: "decision" },
    { label: "Estudiar un tema", description: "Una ruta corta para comprender y practicar.", prompt: "Ayúdame a estudiar un tema. Explícamelo desde lo esencial, propón una práctica breve y termina con tres preguntas de repaso.", icon: "study" },
  ],
  en: [
    { label: "Summarize clearly", description: "Keep what truly matters.", prompt: "Help me summarize this topic clearly. First identify the core idea, then the essential points, and end with one useful next step.", icon: "summary" },
    { label: "Realistic plan", description: "Small steps I can actually sustain.", prompt: "I want to create a realistic plan. Ask about my goal, available time, and starting point; then suggest weekly steps.", icon: "plan" },
    { label: "Write better", description: "A first draft in my own voice.", prompt: "Help me write. Ask about the purpose, the reader, and the tone; then create an editable first draft.", icon: "write" },
    { label: "Decide calmly", description: "Sort options without deciding for me.", prompt: "I need to think through a decision calmly. Help me organize options, criteria, risks, and next steps without deciding for me.", icon: "decision" },
    { label: "Study a topic", description: "A short path to understand and practice.", prompt: "Help me study a topic. Explain it from the essentials, suggest a short practice, and end with three review questions.", icon: "study" },
  ],
  ru: [
    { label: "Ясно резюмировать", description: "Оставить только главное.", prompt: "Помоги мне ясно резюмировать эту тему. Сначала выдели главную мысль, затем основные пункты и закончи полезным следующим шагом.", icon: "summary" },
    { label: "Реалистичный план", description: "Небольшие шаги, которые можно поддерживать.", prompt: "Я хочу составить реалистичный план. Спроси о цели, доступном времени и отправной точке, затем предложи шаги на неделю.", icon: "plan" },
    { label: "Писать лучше", description: "Первый вариант своим голосом.", prompt: "Помоги мне написать текст. Спроси о цели, читателе и тоне, затем создай редактируемый первый вариант.", icon: "write" },
    { label: "Спокойно решить", description: "Упорядочить варианты, не решая за меня.", prompt: "Мне нужно спокойно обдумать решение. Помоги упорядочить варианты, критерии, риски и следующие шаги, не решая за меня.", icon: "decision" },
    { label: "Изучить тему", description: "Короткий путь к пониманию и практике.", prompt: "Помоги мне изучить тему. Объясни с основ, предложи короткую практику и закончи тремя вопросами для повторения.", icon: "study" },
  ],
};

const WEEKLY_CHALLENGES: Record<AppLanguage, string[]> = {
  es: ["Escribe una pregunta que te esté acompañando y no intentes responderla todavía.", "Elige una idea de esta semana y redúcela a una acción de diez minutos.", "Recomienda un libro que te haya dejado pensando y explica por qué en tres líneas.", "Antes de decidir algo, escribe qué información te falta para hacerlo con más calma."],
  en: ["Write down a question that has been following you and do not try to answer it yet.", "Choose one idea from this week and reduce it to a ten-minute action.", "Recommend a book that stayed with you and explain why in three lines.", "Before deciding something, write down what information you still need to move more calmly."],
  ru: ["Запишите вопрос, который не отпускает вас, и пока не пытайтесь на него отвечать.", "Выберите одну идею этой недели и сведите её к действию на десять минут.", "Порекомендуйте книгу, которая осталась с вами, и объясните почему в трёх строках.", "Прежде чем что-то решить, запишите, какой информации вам не хватает, чтобы действовать спокойнее."],
};

function loadStringList(key: string) {
  if (typeof window === "undefined") return [] as string[];
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function loadNotes() {
  if (typeof window === "undefined") return [] as StudioNote[];
  try {
    const stored = JSON.parse(window.localStorage.getItem(NOTES_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter((note): note is StudioNote => Boolean(note && typeof note.content === "string" && typeof note.id === "string")) : [];
  } catch {
    return [];
  }
}

function loadProgress(): StudioProgress {
  if (typeof window === "undefined") return { weeklyGoal: 3, completedDays: [] };
  try {
    const stored = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}");
    return {
      weeklyGoal: typeof stored.weeklyGoal === "number" ? Math.min(7, Math.max(1, stored.weeklyGoal)) : 3,
      completedDays: Array.isArray(stored.completedDays) ? stored.completedDays.filter((day: unknown): day is string => typeof day === "string").slice(-60) : [],
    };
  } catch { return { weeklyGoal: 3, completedDays: [] }; }
}

function downloadText(filename: string, content: string, type = "text/markdown;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapePrintHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export function LearningStudio({ language, latestAssistantMessage, onAskEdu, onClose, responseStyle, onResponseStyleChange, chatState, onRestoreWorkspace }: LearningStudioProps) {
  const [tab, setTab] = useState<StudioTab>("library");
  const [readingList, setReadingList] = useState(() => loadStringList(READING_STORAGE_KEY));
  const [notes, setNotes] = useState(() => loadNotes());
  const [draftNote, setDraftNote] = useState("");
  const [studyTopic, setStudyTopic] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copyState, setCopyState] = useState(false);
  const [progress, setProgress] = useState(loadProgress);
  const [syncCode, setSyncCode] = useState(loadSyncCode);
  const [syncStatus, setSyncStatus] = useState("");
  const [syncCopied, setSyncCopied] = useState(false);
  const workspaceSync = trpc.workspace.sync.useMutation();
  const copy = LIBRARY_COPY[language];
  const challenge = useMemo(() => WEEKLY_CHALLENGES[language][Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_CHALLENGES[language].length], [language]);

  useEffect(() => { window.localStorage.setItem(READING_STORAGE_KEY, JSON.stringify(readingList)); }, [readingList]);
  useEffect(() => { window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleBook = (id: string) => setReadingList(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const saveNote = () => {
    const content = draftNote.trim();
    if (!content) return;
    setNotes(current => [{ id: `${Date.now()}`, content, createdAt: Date.now() }, ...current].slice(0, 24));
    setDraftNote("");
  };
  const saveLatestResponse = () => {
    const content = latestAssistantMessage?.trim();
    if (!content) return;
    setNotes(current => [{ id: `${Date.now()}`, content: `Edu AI · ${content}`, createdAt: Date.now() }, ...current].slice(0, 24));
  };
  const startStudy = () => {
    const topic = studyTopic.trim();
    if (!topic) return;
    const prompts: Record<AppLanguage, string> = {
      es: `Quiero aprender: ${topic}. Diseña una ruta de estudio realista en cuatro semanas. Incluye objetivo, conceptos esenciales, práctica breve, repaso y una forma amable de medir progreso.`,
      en: `I want to learn: ${topic}. Design a realistic four-week study path. Include a goal, essential concepts, short practice, review, and a kind way to measure progress.`,
      ru: `Я хочу изучить: ${topic}. Составь реалистичный план обучения на четыре недели. Включи цель, ключевые понятия, короткую практику, повторение и мягкий способ отслеживать прогресс.`,
    };
    onAskEdu(prompts[language]);
    onClose();
  };
  const toggleSpeech = () => {
    if (!latestAssistantMessage || typeof window === "undefined" || !window.speechSynthesis) return;
    if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const speech = new SpeechSynthesisUtterance(latestAssistantMessage.replace(/[*_#]/g, ""));
    speech.lang = language === "es" ? "es-VE" : language === "ru" ? "ru-RU" : "en-US";
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    setIsSpeaking(true);
  };
  const shareInsight = async () => {
    const text = latestAssistantMessage?.trim();
    if (!text) return;
    try {
      if (navigator.share) await navigator.share({ title: "Edu AI", text, url: window.location.origin });
      else await navigator.clipboard.writeText(text);
      setCopyState(true);
      window.setTimeout(() => setCopyState(false), 1800);
    } catch { /* The person may cancel native sharing; there is no error state needed. */ }
  };
  const today = new Date().toISOString().slice(0, 10);
  const isTodayComplete = progress.completedDays.includes(today);
  const toggleToday = () => setProgress(current => ({ ...current, completedDays: current.completedDays.includes(today) ? current.completedDays.filter(day => day !== today) : [...current.completedDays, today] }));
  const completedThisWeek = progress.completedDays.filter(day => Date.now() - new Date(`${day}T12:00:00`).getTime() < 7 * 86_400_000).length;
  const streak = (() => {
    let count = 0;
    const days = new Set(progress.completedDays);
    const pointer = new Date();
    if (!days.has(today)) pointer.setDate(pointer.getDate() - 1);
    while (days.has(pointer.toISOString().slice(0, 10))) { count += 1; pointer.setDate(pointer.getDate() - 1); }
    return count;
  })();
  const exportNotes = () => downloadText("edu-ai-cuaderno.md", `# Cuaderno de ideas — Edu AI\n\n${notes.map(note => `## ${new Date(note.createdAt).toLocaleDateString(language === "es" ? "es-VE" : language === "ru" ? "ru-RU" : "en-US")}\n\n${note.content}`).join("\n\n") || "Aún no has guardado notas."}`);
  const exportNotesPdf = () => {
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) return;
    const locale = language === "es" ? "es-VE" : language === "ru" ? "ru-RU" : "en-US";
    const entries = notes.length
      ? notes.map(note => `<article><time>${new Date(note.createdAt).toLocaleDateString(locale)}</time><p>${escapePrintHtml(note.content).replace(/\n/g, "<br />")}</p></article>`).join("")
      : `<p>${language === "es" ? "Aún no has guardado notas." : language === "ru" ? "У вас пока нет сохранённых заметок." : "You have no saved notes yet."}</p>`;
    popup.document.write(`<!doctype html><html lang="${language}"><head><title>Edu AI — Cuaderno</title><style>body{font-family:Georgia,serif;max-width:760px;margin:48px auto;color:#173d35;line-height:1.6;padding:0 24px}h1{font-size:32px;margin-bottom:4px}small,time{color:#6a776f;font-family:Arial,sans-serif}article{border-top:1px solid #d9ded8;padding:20px 0;break-inside:avoid}p{white-space:normal}@media print{body{margin:0 auto}}</style></head><body><h1>Cuaderno de ideas</h1><small>Edu AI · ${new Date().toLocaleDateString(locale)}</small>${entries}</body></html>`);
    popup.document.close();
    popup.focus();
    popup.setTimeout(() => popup.print(), 250);
  };
  const exportBackup = () => downloadText("edu-ai-respaldo.json", JSON.stringify({ version: 1, notes, readingList, progress, exportedAt: new Date().toISOString() }, null, 2), "application/json");
  const restoreBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result));
        if (Array.isArray(backup.notes)) setNotes(backup.notes.filter((note: StudioNote) => note && typeof note.content === "string").slice(0, 24));
        if (Array.isArray(backup.readingList)) setReadingList(backup.readingList.filter((item: unknown): item is string => typeof item === "string"));
        if (backup.progress && typeof backup.progress === "object") setProgress({ weeklyGoal: typeof backup.progress.weeklyGoal === "number" ? backup.progress.weeklyGoal : 3, completedDays: Array.isArray(backup.progress.completedDays) ? backup.progress.completedDays.filter((day: unknown): day is string => typeof day === "string") : [] });
      } catch { /* An invalid backup leaves the current private workspace unchanged. */ }
    };
    reader.readAsText(file);
  };
  const syncCopy = {
    heading: language === "es" ? "Copia privada entre dispositivos" : language === "ru" ? "Личная копия между устройствами" : "Private copy across devices",
    detail: language === "es" ? "Tu espacio se cifra en este navegador antes de enviarse. El servidor no puede leer tus conversaciones, notas ni progreso." : language === "ru" ? "Ваше пространство шифруется в этом браузере перед отправкой. Сервер не может прочитать ваши беседы, заметки или прогресс." : "Your space is encrypted in this browser before it is sent. The server cannot read your conversations, notes, or progress.",
    codeLabel: language === "es" ? "Código privado de recuperación" : language === "ru" ? "Личный код восстановления" : "Private recovery code",
    create: language === "es" ? "Crear código" : language === "ru" ? "Создать код" : "Create code",
    copy: language === "es" ? "Copiar" : language === "ru" ? "Копировать" : "Copy",
    copied: language === "es" ? "Copiado" : language === "ru" ? "Скопировано" : "Copied",
    upload: language === "es" ? "Guardar copia cifrada" : language === "ru" ? "Сохранить зашифрованную копию" : "Save encrypted copy",
    download: language === "es" ? "Recuperar mi copia" : language === "ru" ? "Восстановить мою копию" : "Restore my copy",
    warning: language === "es" ? "Guarda este código fuera de este dispositivo. Sin él, nadie —incluido Edu AI— puede abrir tu copia." : language === "ru" ? "Сохраните этот код вне этого устройства. Без него никто, включая Edu AI, не сможет открыть вашу копию." : "Keep this code outside this device. Without it, nobody — including Edu AI — can open your copy.",
  };
  const snapshot = (): WorkspaceSnapshot => ({ version: 1, chatState, learning: { notes, readingList, progress }, language, responseStyle, syncedAt: new Date().toISOString() });
  const createPrivateCode = () => {
    const code = createSyncCode();
    persistSyncCode(code);
    setSyncCode(code);
    setSyncStatus(language === "es" ? "Código creado. Cópialo y guárdalo antes de usar otra pantalla." : language === "ru" ? "Код создан. Скопируйте и сохраните его перед использованием другого устройства." : "Code created. Copy and store it before using another device.");
  };
  const copySyncCode = async () => {
    if (!parseSyncCode(syncCode)) return;
    try { await navigator.clipboard.writeText(syncCode); setSyncCopied(true); window.setTimeout(() => setSyncCopied(false), 1800); } catch { setSyncStatus(language === "es" ? "Selecciona y copia el código manualmente." : language === "ru" ? "Выделите и скопируйте код вручную." : "Select and copy the code manually."); }
  };
  const uploadWorkspace = async () => {
    if (!persistSyncCode(syncCode)) { setSyncStatus(language === "es" ? "Introduce un código privado válido o crea uno nuevo." : language === "ru" ? "Введите действительный личный код или создайте новый." : "Enter a valid private code or create a new one."); return; }
    try {
      setSyncStatus(language === "es" ? "Cifrando y guardando tu copia…" : language === "ru" ? "Шифрование и сохранение вашей копии…" : "Encrypting and saving your copy…");
      const encrypted = await encryptWorkspace(syncCode, snapshot());
      await workspaceSync.mutateAsync({ action: "put", ...encrypted });
      setSyncStatus(language === "es" ? "Copia cifrada guardada. Puedes usar el mismo código en otro dispositivo." : language === "ru" ? "Зашифрованная копия сохранена. Вы можете использовать тот же код на другом устройстве." : "Encrypted copy saved. You can use this same code on another device.");
    } catch {
      setSyncStatus(language === "es" ? "No se pudo guardar la copia ahora. Tu contenido local sigue intacto." : language === "ru" ? "Не удалось сохранить копию. Ваши локальные данные остались нетронутыми." : "Your copy could not be saved right now. Your local content remains untouched.");
    }
  };
  const restoreWorkspace = async () => {
    const token = parseSyncCode(syncCode);
    if (!token || !persistSyncCode(syncCode)) { setSyncStatus(language === "es" ? "Introduce el código privado con el que creaste la copia." : language === "ru" ? "Введите личный код, с которым была создана копия." : "Enter the private code used to create the copy."); return; }
    try {
      setSyncStatus(language === "es" ? "Buscando y descifrando tu copia…" : language === "ru" ? "Поиск и расшифровка вашей копии…" : "Finding and decrypting your copy…");
      const remote = await workspaceSync.mutateAsync({ action: "get", syncId: token.syncId });
      if (!remote.found || !remote.ciphertext) { setSyncStatus(language === "es" ? "No encontramos una copia asociada a ese código." : language === "ru" ? "Копия, связанная с этим кодом, не найдена." : "We could not find a copy associated with that code."); return; }
      const restored = await decryptWorkspace(syncCode, remote.ciphertext);
      if (!isWorkspaceSnapshot(restored)) throw new Error("Invalid workspace");
      onRestoreWorkspace(restored);
      setNotes(restored.learning.notes);
      setReadingList(restored.learning.readingList);
      setProgress(restored.learning.progress);
      setSyncStatus(language === "es" ? "Copia recuperada de forma privada. Tu espacio ya está actualizado." : language === "ru" ? "Копия восстановлена конфиденциально. Ваше пространство обновлено." : "Copy restored privately. Your space is now up to date.");
    } catch {
      setSyncStatus(language === "es" ? "No fue posible abrir esta copia. Verifica que el código sea correcto." : language === "ru" ? "Не удалось открыть эту копию. Проверьте правильность кода." : "This copy could not be opened. Check that the code is correct.");
    }
  };

  const navigation: Array<{ id: StudioTab; label: string; icon: typeof LibraryBig }> = [
    { id: "library", label: copy.library, icon: LibraryBig }, { id: "tools", label: copy.tools, icon: WandSparkles }, { id: "notes", label: copy.notes, icon: ClipboardPenLine }, { id: "study", label: copy.study, icon: GraduationCap }, { id: "progress", label: language === "es" ? "Progreso" : language === "ru" ? "Прогресс" : "Progress", icon: CalendarDays }, { id: "preferences", label: copy.preferences, icon: Brain },
  ];

  return (
    <section className="learning-studio" aria-label={copy.desk}>
      <div className="learning-hero">
        <div><p className="overline">{copy.desk.toUpperCase()}</p><h2>{copy.desk}<em>.</em></h2></div>
        <button className="return-to-chat" onClick={onClose}><ChevronRight size={15} /> Edu AI</button>
      </div>
      <div className="learning-tabs" role="tablist" aria-label={copy.desk}>
        {navigation.map(item => {
          const Icon = item.icon;
          return <button key={item.id} className={tab === item.id ? "active" : ""} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}><Icon size={15} />{item.label}</button>;
        })}
      </div>

      {tab === "library" && <div className="studio-panel library-panel">
        <p className="studio-intro">{copy.libraryIntro}</p>
        <aside className="library-criteria"><div><p className="book-kicker">{copy.curationTitle}</p><p>{copy.curationDetail}</p></div><div className="library-criteria-links"><a href="https://www.britannica.com/biography/Fyodor-Dostoyevsky" target="_blank" rel="noreferrer">{copy.curationReaders}<ChevronRight size={13} /></a><a href="https://www.penguinlibros.com/co/tematicas/12069-libro-la-culpa-es-de-la-vaca-9789584203912" target="_blank" rel="noreferrer">{copy.curationAwards}<ChevronRight size={13} /></a></div></aside>
        {(["known", "discovery"] as const).map(shelf => <section key={shelf} className="book-shelf">
          <h3>{shelf === "known" ? copy.known : copy.discovery}</h3>
          <div className="book-grid">{LIBRARY_BOOKS.filter(book => book.shelf === shelf).map(book => {
            const saved = readingList.includes(book.id);
            return <article className="book-card" key={book.id}>
              <span className="book-spine" aria-hidden="true">{book.title.slice(0, 1)}</span>
              <div className="book-card-copy"><p className="book-kicker">{book.sourceLabel[language]}</p><h4>{book.title}</h4><p className="book-author">{book.author} · {book.year}</p><p>{book.note[language]}</p><div className="book-tags">{book.themes[language].map(theme => <span key={theme}>{theme}</span>)}</div></div>
              <div className="book-actions"><a href={book.sourceUrl} target="_blank" rel="noreferrer">{copy.source}<ChevronRight size={13} /></a><button onClick={() => toggleBook(book.id)} aria-pressed={saved}>{saved ? <Check size={14} /> : <BookOpen size={14} />}{saved ? copy.saved : copy.save}</button></div>
            </article>;
          })}</div>
        </section>)}
      </div>}

      {tab === "tools" && <div className="studio-panel"><p className="studio-intro">{copy.toolsIntro}</p><div className="tool-grid">{TOOL_PROMPTS[language].map(tool => <button key={tool.label} className="tool-card" onClick={() => { onAskEdu(tool.prompt); onClose(); }}>
        <ToolGlyph name={tool.icon} /><span><strong>{tool.label}</strong><small>{tool.description}</small></span><ChevronRight size={15} />
      </button>)}</div><WeeklyChallenge copy={copy} challenge={challenge} /></div>}

      {tab === "notes" && <div className="studio-panel notes-panel"><p className="studio-intro">{copy.notesIntro}</p>{latestAssistantMessage && <button className="save-response-note" onClick={saveLatestResponse}><BookText size={15} />{copy.saveResponse}</button>}<div className="note-composer"><textarea value={draftNote} onChange={event => setDraftNote(event.target.value)} placeholder={copy.notePlaceholder} maxLength={1200} /><button onClick={saveNote}><PenLine size={15} />{copy.addNote}</button></div>
        {notes.length ? <div className="note-list">{notes.map(note => <article key={note.id}><p>{note.content}</p><button onClick={() => setNotes(current => current.filter(item => item.id !== note.id))}>{copy.remove}</button></article>)}</div> : <p className="empty-copy">{copy.emptyNotes}</p>}</div>}

      {tab === "study" && <div className="studio-panel study-panel"><p className="studio-intro">{copy.studyIntro}</p><div className="study-form"><BookText size={23} /><input value={studyTopic} onChange={event => setStudyTopic(event.target.value)} placeholder={copy.studyPlaceholder} onKeyDown={event => event.key === "Enter" && startStudy()} /><button onClick={startStudy}><ListChecks size={15} />{copy.startStudy}</button></div><WeeklyChallenge copy={copy} challenge={challenge} /></div>}

      {tab === "progress" && <div className="studio-panel progress-panel"><div className="progress-heading"><div><p className="overline">{language === "es" ? "TABLERO PERSONAL" : language === "ru" ? "ЛИЧНАЯ ПАНЕЛЬ" : "PERSONAL DASHBOARD"}</p><h3>{language === "es" ? "Un paso que sí cuenta" : language === "ru" ? "Шаг, который имеет значение" : "A step that counts"}</h3><p>{language === "es" ? "Tu avance se guarda de forma privada en este dispositivo. Puedes llevarte una copia cuando quieras." : language === "ru" ? "Ваш прогресс хранится приватно на этом устройстве. Вы можете забрать копию в любой момент." : "Your progress stays private on this device. You can take a copy whenever you want."}</p></div><ShieldCheck size={22} /></div><div className="progress-grid"><article><span>{language === "es" ? "Racha" : language === "ru" ? "Серия" : "Streak"}</span><strong>{streak}</strong><small>{language === "es" ? "días con intención" : language === "ru" ? "дней с намерением" : "intentional days"}</small></article><article><span>{language === "es" ? "Semana" : language === "ru" ? "Неделя" : "Week"}</span><strong>{Math.min(completedThisWeek, progress.weeklyGoal)}/{progress.weeklyGoal}</strong><small>{language === "es" ? "meta personal" : language === "ru" ? "личная цель" : "personal goal"}</small></article><article><span>{language === "es" ? "Cuaderno" : language === "ru" ? "Блокнот" : "Notebook"}</span><strong>{notes.length}</strong><small>{language === "es" ? "ideas guardadas" : language === "ru" ? "сохранённых идей" : "saved ideas"}</small></article></div><div className="progress-actions"><button className={isTodayComplete ? "progress-check complete" : "progress-check"} onClick={toggleToday}><Check size={16} />{isTodayComplete ? (language === "es" ? "Hoy ya cuenta" : language === "ru" ? "Сегодня уже отмечено" : "Today counts") : (language === "es" ? "Marcar mi avance de hoy" : language === "ru" ? "Отметить прогресс сегодня" : "Mark today’s progress")}</button><label>{language === "es" ? "Meta semanal" : language === "ru" ? "Недельная цель" : "Weekly goal"}<input type="range" min="1" max="7" value={progress.weeklyGoal} onChange={event => setProgress(current => ({ ...current, weeklyGoal: Number(event.target.value) }))} /><b>{progress.weeklyGoal}</b></label></div><div className="workspace-export"><button onClick={exportNotes}><Download size={15} />{language === "es" ? "Exportar cuaderno (.md)" : language === "ru" ? "Экспортировать блокнот (.md)" : "Export notebook (.md)"}</button><button onClick={exportNotesPdf}><Download size={15} />{language === "es" ? "Guardar cuaderno (.pdf)" : language === "ru" ? "Сохранить блокнот (.pdf)" : "Save notebook (.pdf)"}</button><button onClick={exportBackup}><Download size={15} />{language === "es" ? "Crear respaldo" : language === "ru" ? "Создать резервную копию" : "Create backup"}</button><label><Download size={15} />{language === "es" ? "Restaurar respaldo" : language === "ru" ? "Восстановить копию" : "Restore backup"}<input type="file" accept="application/json" onChange={event => { const file = event.target.files?.[0]; if (file) restoreBackup(file); event.currentTarget.value = ""; }} /></label></div><section className="workspace-sync"><div className="workspace-sync-heading"><KeyRound size={18} /><div><h4>{syncCopy.heading}</h4><p>{syncCopy.detail}</p></div></div><label className="sync-code-field">{syncCopy.codeLabel}<input value={syncCode} onChange={event => setSyncCode(event.target.value)} placeholder="••••••••.••••••••" spellCheck="false" autoCapitalize="none" /></label><div className="workspace-sync-actions"><button onClick={createPrivateCode} disabled={workspaceSync.isPending}><KeyRound size={15} />{syncCopy.create}</button><button onClick={copySyncCode} disabled={!parseSyncCode(syncCode) || workspaceSync.isPending}><Copy size={15} />{syncCopied ? syncCopy.copied : syncCopy.copy}</button><button className="sync-save" onClick={uploadWorkspace} disabled={workspaceSync.isPending}><CloudUpload size={15} />{syncCopy.upload}</button><button className="sync-restore" onClick={restoreWorkspace} disabled={workspaceSync.isPending}><CloudDownload size={15} />{syncCopy.download}</button></div><p className="sync-warning"><ShieldCheck size={14} />{syncCopy.warning}</p>{syncStatus && <p className="sync-status" role="status">{syncStatus}</p>}</section></div>}

      {tab === "preferences" && <div className="studio-panel preferences-panel"><p className="studio-intro">{copy.preferencesIntro}</p><div className="preference-grid">{(["brief", "deep", "creative", "study"] as ResponseStyle[]).map(style => <button key={style} className={responseStyle === style ? "active" : ""} onClick={() => onResponseStyleChange(style)}><Sparkles size={15} /><span>{copy[style === "study" ? "studyStyle" : style]}</span>{responseStyle === style && <Check size={14} />}</button>)}</div>
        {latestAssistantMessage && <div className="insight-card"><p className="book-kicker">EDU AI</p><blockquote>{latestAssistantMessage}</blockquote><div><button onClick={toggleSpeech}>{isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}{isSpeaking ? copy.stop : copy.speak}</button><button onClick={shareInsight}><Share2 size={15} />{copyState ? copy.copied : copy.share}</button></div></div>}
      </div>}
    </section>
  );
}

function ToolGlyph({ name }: { name: "summary" | "plan" | "write" | "decision" | "study" }) {
  const Icon = name === "summary" ? Sparkles : name === "plan" ? ListChecks : name === "write" ? PenLine : name === "study" ? GraduationCap : Brain;
  return <span className="tool-glyph"><Icon size={17} /></span>;
}

function WeeklyChallenge({ copy, challenge }: { copy: Record<string, string>; challenge: string }) {
  return <aside className="weekly-challenge"><Sparkles size={17} /><div><span>{copy.challenge}</span><p>{challenge}</p></div></aside>;
}
