import { LIBRARY_BOOKS, LIBRARY_COPY } from "@/data/books";
import type { AppLanguage } from "@/lib/i18n";
import {
  BookOpen,
  BookText,
  Brain,
  Check,
  ChevronRight,
  ClipboardPenLine,
  GraduationCap,
  LibraryBig,
  ListChecks,
  PenLine,
  Share2,
  Sparkles,
  Volume2,
  VolumeX,
  WandSparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StudioTab = "library" | "tools" | "notes" | "study" | "preferences";
export type ResponseStyle = "brief" | "deep" | "creative" | "study";

type LearningStudioProps = {
  language: AppLanguage;
  latestAssistantMessage?: string;
  onAskEdu: (prompt: string) => void;
  onClose: () => void;
  responseStyle: ResponseStyle;
  onResponseStyleChange: (style: ResponseStyle) => void;
};

type StudioNote = { id: string; content: string; createdAt: number };

const READING_STORAGE_KEY = "edu-ai:library:v1";
const NOTES_STORAGE_KEY = "edu-ai:notes:v1";

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

export function LearningStudio({ language, latestAssistantMessage, onAskEdu, onClose, responseStyle, onResponseStyleChange }: LearningStudioProps) {
  const [tab, setTab] = useState<StudioTab>("library");
  const [readingList, setReadingList] = useState(() => loadStringList(READING_STORAGE_KEY));
  const [notes, setNotes] = useState(() => loadNotes());
  const [draftNote, setDraftNote] = useState("");
  const [studyTopic, setStudyTopic] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copyState, setCopyState] = useState(false);
  const copy = LIBRARY_COPY[language];
  const challenge = useMemo(() => WEEKLY_CHALLENGES[language][Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_CHALLENGES[language].length], [language]);

  useEffect(() => { window.localStorage.setItem(READING_STORAGE_KEY, JSON.stringify(readingList)); }, [readingList]);
  useEffect(() => { window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes)); }, [notes]);
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

  const navigation: Array<{ id: StudioTab; label: string; icon: typeof LibraryBig }> = [
    { id: "library", label: copy.library, icon: LibraryBig }, { id: "tools", label: copy.tools, icon: WandSparkles }, { id: "notes", label: copy.notes, icon: ClipboardPenLine }, { id: "study", label: copy.study, icon: GraduationCap }, { id: "preferences", label: copy.preferences, icon: Brain },
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
        <aside className="library-criteria"><div><p className="book-kicker">{copy.curationTitle}</p><p>{copy.curationDetail}</p></div><div className="library-criteria-links"><a href="https://www.goodreads.com/list/show/107459.Best_Popular_Classics_Books_on_Goodreads" target="_blank" rel="noreferrer">{copy.curationReaders}<ChevronRight size={13} /></a><a href="https://thebookerprizes.com/the-booker-library/features/full-list-of-international-booker-prize-winners-shortlisted-authors-and-their-books" target="_blank" rel="noreferrer">{copy.curationAwards}<ChevronRight size={13} /></a></div></aside>
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
