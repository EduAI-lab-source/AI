import { AIChatBox } from "@/components/AIChatBox";
import { LearningStudio, type ResponseStyle, type StudioTab } from "@/components/LearningStudio";
import type { ChatImageAttachment } from "@/components/AIChatBox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  describeThreadRecency,
  loadChatState,
  removeConversation,
  replaceThreadMessages,
  saveChatState,
  startFreshConversation,
  addConversationFolder,
  updateConversationOrganization,
  type ConversationFolder,
  type ConversationMessage,
} from "@/lib/chatSession";
import { getEduAiApiBase, humanizeChatError, isChatRecoveryMessage, isChatTransportAvailable } from "@/lib/chatRuntime";
import { COPY, GLOBAL_TRANSLATION_OPTIONS, LANGUAGE_OPTIONS, getGlobalTranslationUrl, getLocale, isAppLanguage, loadLanguage, saveLanguage, type AppCopy, type AppLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { workspaceStateFromSnapshot } from "@/lib/workspaceRestore";
import { parseSharedNotebookSnapshot } from "@/lib/sharedNotebook";
import { getAmbientPointerMode, getAmbientPosition } from "@/lib/ambientMotion";
import { getLatestWorkspaceNote } from "@/lib/workspaceRecents";
import { ArrowUpRight, Bot, BookOpen, CirclePlus, ClipboardPenLine, Eraser, FileAudio, FolderPlus, GraduationCap, Languages, LibraryBig, Link2, ListChecks, Menu, MessageSquareText, PenLine, Search, ShieldCheck, Sparkles, Star, Trash2, Volume2, X } from "lucide-react";
import { type PointerEvent, useEffect, useMemo, useState } from "react";
import { TextToSpeechStudio, type RecentAudio } from "@/components/TextToSpeechStudio";
import { EduAiMark } from "@/components/EduAiMark";
import { EditorialGuides, PublicFooter, PublicInfoPage, publicPageFromHash, type PublicPageId } from "@/components/PublicTrustContent";
import { AdPlacement } from "@/components/MonetizationReadiness";

type FailedChatRequest = {
  threadId: string;
  messages: ConversationMessage[];
  imageAttachment?: ChatImageAttachment;
};

const RESPONSE_STYLE_STORAGE_KEY = "edu-ai:response-style:v2";

export default function Home() {
  const [sharedToken, setSharedToken] = useState(() => getSharedToken());
  const [publicPage, setPublicPage] = useState<PublicPageId | null>(() => typeof window === "undefined" ? null : publicPageFromHash(window.location.hash));
  const [chatState, setChatState] = useState(loadChatState);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [learningStartTab, setLearningStartTab] = useState<StudioTab>("library");
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [recentAudio, setRecentAudio] = useState<RecentAudio | null>(null);
  const [language, setLanguage] = useState<AppLanguage>(loadLanguage);
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>(() => {
    if (typeof window === "undefined") return "brief";
    const saved = window.localStorage.getItem(RESPONSE_STYLE_STORAGE_KEY);
    return saved === "brief" || saved === "deep" || saved === "creative" || saved === "study" ? saved : "brief";
  });
  const [failedChatRequest, setFailedChatRequest] = useState<FailedChatRequest | null>(null);
  const chat = trpc.eduAi.chat.useMutation();
  const sharedNotebook = trpc.sharing.get.useQuery({ token: sharedToken ?? "invalid" }, { enabled: Boolean(sharedToken), retry: false, refetchOnWindowFocus: false });
  const copy = COPY[language];
  const isChatAvailable = isChatTransportAvailable({
    apiBaseUrl: getEduAiApiBase(import.meta.env.VITE_EDU_AI_API_URL, typeof window === "undefined" ? "" : window.location.hostname),
    hostname: typeof window === "undefined" ? "" : window.location.hostname,
  });
  const activeThread = useMemo(
    () => chatState.threads.find(thread => thread.id === chatState.activeThreadId) ?? chatState.threads[0],
    [chatState]
  );

  useEffect(() => saveChatState(chatState), [chatState]);
  useEffect(() => {
    saveLanguage(language);
    document.documentElement.lang = getLocale(language);
    document.title = copy.documentTitle;
  }, [copy.documentTitle, language]);
  useEffect(() => window.localStorage.setItem(RESPONSE_STYLE_STORAGE_KEY, responseStyle), [responseStyle]);
  useEffect(() => {
    const onHashChange = () => {
      setSharedToken(getSharedToken());
      setPublicPage(publicPageFromHash(window.location.hash));
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const placeAmbientLight = (surface: HTMLElement, clientX: number, clientY: number, active: boolean) => {
    const position = getAmbientPosition(clientX, clientY, surface.getBoundingClientRect());
    surface.style.setProperty("--ambient-x", `${position.x}%`);
    surface.style.setProperty("--ambient-y", `${position.y}%`);
    surface.dataset.ambientActive = active ? "true" : "false";
  };

  const handleAmbientPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (getAmbientPointerMode(event.pointerType) !== "follow") return;
    placeAmbientLight(event.currentTarget, event.clientX, event.clientY, true);
  };

  const handleAmbientPointerLeave = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.dataset.ambientActive = "false";
  };

  const handleAmbientTouch = (event: PointerEvent<HTMLElement>) => {
    if (getAmbientPointerMode(event.pointerType) !== "pulse") return;
    const surface = event.currentTarget;
    placeAmbientLight(surface, event.clientX, event.clientY, true);
    surface.dataset.ambientPulse = "true";
    window.setTimeout(() => { delete surface.dataset.ambientPulse; }, 540);
    window.setTimeout(() => { surface.dataset.ambientActive = "false"; }, 900);
  };

  if (sharedToken) return <SharedNotebookPage data={sharedNotebook.data} isLoading={sharedNotebook.isLoading} hasError={sharedNotebook.isError} onBack={() => { window.location.hash = ""; }} />;
  if (publicPage) return <PublicInfoPage page={publicPage} language={language} onBack={() => { window.location.hash = ""; }} />;

  const startNewConversation = () => {
    if (chat.isPending) return;
    setChatState(current => startFreshConversation(current, {
      title: copy.newConversation,
      welcomeMessage: { role: "assistant", content: copy.welcomeMessage },
    }));
    setIsHistoryOpen(false);
  };

  const clearActiveConversation = () => {
    if (!activeThread || chat.isPending) return;
    setChatState(current => {
      const resetState = replaceThreadMessages(current, activeThread.id, [{ role: "assistant", content: copy.welcomeMessage }]);
      return {
        ...resetState,
        threads: resetState.threads.map(thread => thread.id === activeThread.id ? { ...thread, title: copy.newConversation } : thread),
      };
    });
  };

  const deleteConversation = () => {
    if (!deleteTargetId || chat.isPending) return;
    setChatState(current => removeConversation(current, deleteTargetId, {
      title: copy.newConversation,
      welcomeMessage: { role: "assistant", content: copy.welcomeMessage },
    }));
    setDeleteTargetId(null);
  };

  const requestChatReply = (threadId: string, messages: ConversationMessage[], imageAttachment?: ChatImageAttachment) => {
    setPendingThreadId(threadId);
    chat.mutate(
      { messages: messages.slice(responseStyle === "brief" ? -8 : -12), responseStyle, imageAttachment: imageAttachment ? { name: imageAttachment.name, dataUrl: imageAttachment.dataUrl } : undefined },
      {
        onSuccess: response => {
          setFailedChatRequest(null);
          setChatState(current => current.threads.some(item => item.id === threadId)
            ? replaceThreadMessages(current, threadId, [...messages, { role: "assistant", content: response.content }])
            : current);
        },
        onError: error => {
          const recoveryMessage = humanizeChatError(error);
          if (isChatRecoveryMessage(recoveryMessage)) setFailedChatRequest({ threadId, messages, imageAttachment });
          setChatState(current => current.threads.some(item => item.id === threadId)
            ? replaceThreadMessages(current, threadId, [...messages, { role: "assistant", content: recoveryMessage }])
            : current);
        },
        onSettled: () => setPendingThreadId(null),
      }
    );
  };

  const sendMessage = (content: string, imageAttachment?: ChatImageAttachment) => {
    if (!activeThread || chat.isPending || !isChatAvailable) return;
    const threadId = activeThread.id;
    const nextMessages: ConversationMessage[] = [...activeThread.messages, { role: "user", content }];
    setFailedChatRequest(null);
    setChatState(current => replaceThreadMessages(current, threadId, nextMessages));
    requestChatReply(threadId, nextMessages, imageAttachment);
  };

  const openLearning = (tab: StudioTab = "library") => {
    setLearningStartTab(tab);
    setIsLearningOpen(true);
    setIsHistoryOpen(false);
  };

  const openAssistant = () => {
    setIsLearningOpen(false);
    setIsAssistantOpen(true);
  };

  const openAssistantSpotlight = () => {
    openAssistant();
    window.setTimeout(() => document.getElementById("edu-ai-assistant")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const startGuidedChat = (prompt: string) => {
    openAssistant();
    window.setTimeout(() => sendMessage(prompt), 0);
  };

  const focusVoiceStudio = () => {
    setIsLearningOpen(false);
    window.setTimeout(() => document.getElementById("tts-title")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  const retryLastMessage = () => {
    if (!activeThread || chat.isPending) return;
    const savedRetry = failedChatRequest?.threadId === activeThread.id ? failedChatRequest : null;
    const trailingMessage = activeThread.messages.at(-1);
    const recoveredRetry: FailedChatRequest | null = !savedRetry && trailingMessage && isChatRecoveryMessage(trailingMessage.content)
      ? { threadId: activeThread.id, messages: activeThread.messages.slice(0, -1) }
      : null;
    const retry = savedRetry ?? recoveredRetry;
    if (!retry) return;
    requestChatReply(retry.threadId, retry.messages, retry.imageAttachment);
  };

  if (!activeThread) return null;
  const hasConversation = activeThread.messages.some(message => message.role === "user");
  const isActivePending = pendingThreadId === activeThread.id;
  const selectThread = (threadId: string) => {
    if (chat.isPending) return;
    setChatState(current => ({ ...current, activeThreadId: threadId }));
    setIsHistoryOpen(false);
  };
  const organizeThread = (threadId: string, changes: Parameters<typeof updateConversationOrganization>[2]) => {
    if (chat.isPending) return;
    setChatState(current => updateConversationOrganization(current, threadId, changes));
  };
  const addFolder = (name: string) => setChatState(current => addConversationFolder(current, name, ["violet", "peach", "mint"][(current.folders?.length ?? 0) % 3] as ConversationFolder["color"]));
  const sidebarProps = {
    activeThreadId: activeThread.id,
    isPending: chat.isPending,
    threads: chatState.threads,
    folders: chatState.folders ?? [],
    copy,
    locale: getLocale(language),
    onNewConversation: startNewConversation,
    onSelectThread: selectThread,
    onClearConversation: clearActiveConversation,
    onDeleteThread: (threadId: string) => setDeleteTargetId(threadId),
    onOrganizeThread: organizeThread,
    onAddFolder: addFolder,
    onOpenLearning: () => openLearning(),
  };
  const learningLabel = language === "es" ? "Mi espacio" : language === "ru" ? "Моё пространство" : "My space";
  const latestAssistantMessage = [...activeThread.messages].reverse().find(message => message.role === "assistant")?.content;
  const latestWorkspaceNote = getLatestWorkspaceNote();
  const mostRecentThread = [...chatState.threads].sort((left, right) => right.updatedAt - left.updatedAt)[0];
  const chatThinkingCopy = language === "es"
    ? { label: "Edu AI está preparando una respuesta", detail: "Ordena el contexto para responderte con claridad." }
    : language === "ru"
      ? { label: "Edu AI готовит ответ", detail: "Собирает контекст, чтобы ответить ясно." }
      : { label: "Edu AI is preparing a reply", detail: "It is organizing the context for a clear answer." };
  const deleteTarget = chatState.threads.find(thread => thread.id === deleteTargetId);

  return (
    <main className="edu-app" onPointerMove={handleAmbientPointerMove} onPointerLeave={handleAmbientPointerLeave} onPointerDown={handleAmbientTouch}>
      <aside className="conversation-sidebar"><SidebarContents {...sidebarProps} /></aside>
      {isHistoryOpen && <div className="mobile-history" role="dialog" aria-modal="true" aria-label={copy.openHistory}>
        <button className="mobile-history-scrim" aria-label={copy.closeHistory} onClick={() => setIsHistoryOpen(false)} />
        <aside className="mobile-history-sheet"><button className="close-history" onClick={() => setIsHistoryOpen(false)} aria-label={copy.closeHistory}><X size={18} /></button><SidebarContents {...sidebarProps} /></aside>
      </div>}

      <section className="conversation-main">
        <div className="mobile-appbar">
          <button className="mobile-menu" onClick={() => setIsHistoryOpen(true)} aria-label={copy.openHistory}><Menu size={20} /></button>
          <div className="mobile-brand"><span className="mini-mark"><EduAiMark /></span><strong>Edu AI</strong></div>
          <button className="mobile-new-chat" onClick={startNewConversation} disabled={chat.isPending} aria-label={copy.startNewChat}><CirclePlus size={20} /></button>
        </div>
        <header className="conversation-header">
          <div><span className="status-line"><i /> {copy.statusLine}</span><h1>{hasConversation && isAssistantOpen ? activeThread.title : <>{copy.heroTitle}<br /><em>{copy.heroEmphasis}</em></>}</h1><p className="header-subtitle">{copy.headerSubtitle}</p></div>
          <div className="header-actions"><button className="learning-entry" onClick={() => isLearningOpen ? setIsLearningOpen(false) : openLearning()} aria-pressed={isLearningOpen}><LibraryBig size={15} />{learningLabel}</button><LanguagePicker language={language} copy={copy} onChange={setLanguage} /><span className="header-mark" aria-hidden="true"><EduAiMark /></span></div>
        </header>
        {!isLearningOpen && <EduAiSpotlight language={language} onOpen={openAssistantSpotlight} />}
        <div className="conversation-stage">
          {isLearningOpen ? <LearningStudio language={language} latestAssistantMessage={latestAssistantMessage} onAskEdu={sendMessage} onClose={() => setIsLearningOpen(false)} responseStyle={responseStyle} onResponseStyleChange={setResponseStyle} chatState={chatState} initialTab={learningStartTab} onRestoreWorkspace={snapshot => { const restored = workspaceStateFromSnapshot(snapshot); setChatState(restored.chatState); setLanguage(restored.language); setResponseStyle(restored.responseStyle); }} /> : <>
            <TextToSpeechStudio language={language} latestAssistantMessage={latestAssistantMessage} onAudioReady={setRecentAudio} />
            <GuidedStartPanel language={language} onOpenStudy={() => openLearning("study")} onWrite={() => startGuidedChat(language === "es" ? "Quiero escribir algo importante. Hazme tres preguntas cortas sobre el propósito, la persona que lo leerá y el tono antes de ayudarme a crear una primera versión." : language === "ru" ? "Я хочу написать важный текст. Задай мне три коротких вопроса о цели, читателе и тоне, прежде чем помочь создать первый вариант." : "I want to write something important. Ask me three short questions about the purpose, reader, and tone before helping me create a first draft.")} onPlan={() => startGuidedChat(language === "es" ? "Quiero organizar un plan realista. Pregúntame mi objetivo, el tiempo disponible y mi punto de partida; después propón pasos pequeños y sostenibles." : language === "ru" ? "Я хочу составить реалистичный план. Спроси о цели, доступном времени и отправной точке, затем предложи небольшие выполнимые шаги." : "I want to make a realistic plan. Ask about my goal, available time, and starting point; then suggest small sustainable steps.")} onCreateAudio={focusVoiceStudio} />
            <RecentShelf language={language} thread={mostRecentThread} latestNote={latestWorkspaceNote} recentAudio={recentAudio} onOpenConversation={threadId => { selectThread(threadId); openAssistant(); }} onOpenNotes={() => openLearning("notes")} onOpenAudio={focusVoiceStudio} />
            <AdPlacement placement="studio" language={language} />
            <section className="assistant-secondary" id="edu-ai-assistant" aria-labelledby="assistant-secondary-title">
              <button className="assistant-secondary-toggle" onClick={() => setIsAssistantOpen(open => !open)} aria-expanded={isAssistantOpen}><span><Bot size={17} /><span><small>{language === "es" ? "HERRAMIENTA DE IDEAS" : language === "ru" ? "ИНСТРУМЕНТ ДЛЯ ИДЕЙ" : "IDEAS TOOL"}</small><strong id="assistant-secondary-title">{language === "es" ? "Conversar con Edu AI" : language === "ru" ? "Поговорить с Edu AI" : "Talk with Edu AI"}</strong></span></span><span>{isAssistantOpen ? (language === "es" ? "Cerrar" : language === "ru" ? "Закрыть" : "Close") : (language === "es" ? "Abrir" : language === "ru" ? "Открыть" : "Open")}</span></button>
              {!isAssistantOpen && <p>{language === "es" ? "Cuando necesites ordenar una idea, estudiar o crear un plan, Edu AI sigue aquí para acompañarte." : language === "ru" ? "Когда нужно упорядочить мысль, учиться или составить план, Edu AI остаётся рядом." : "Whenever you need to organise an idea, study, or make a plan, Edu AI is still here with you."}</p>}
              {isAssistantOpen && <><AIChatBox messages={activeThread.messages} onSendMessage={sendMessage} onRetryLastMessage={retryLastMessage} isRetryableMessage={message => isChatRecoveryMessage(message.content)} retryLabel={language === "es" ? "Reintentar mensaje" : language === "ru" ? "Повторить сообщение" : "Retry message"} isLoading={isActivePending} loadingLabel={chatThinkingCopy.label} loadingDetail={chatThinkingCopy.detail} placeholder={isChatAvailable ? copy.composerPlaceholder : copy.unavailablePlaceholder} disabled={!isChatAvailable} disabledMessage={!isChatAvailable ? copy.unavailableMessage : undefined} voiceLanguage={language === "es" ? "es-VE" : language === "ru" ? "ru-RU" : "en-US"} className="chat-canvas chat-canvas-secondary" height="min(54vh, 620px)" /><p className="composer-caption"><span>↗</span> {copy.disclaimer}</p></>}
            </section>
          </>}
        </div>
        <EditorialGuides language={language} />
        <AdPlacement placement="guides" language={language} />
        <PublicFooter language={language} onNavigate={page => { window.location.hash = page; }} />
      </section>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent className="edu-delete-dialog">
          <AlertDialogHeader>
            <span className="delete-dialog-icon"><Trash2 size={18} /></span>
            <AlertDialogTitle>{copy.deleteConversationTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.deleteConversationPrompt.replace("{title}", deleteTarget?.title ?? copy.newConversation)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="edu-dialog-cancel">{copy.cancelAction}</AlertDialogCancel>
            <AlertDialogAction className="edu-dialog-delete" onClick={deleteConversation}>{copy.deleteConversationAction}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function EduAiSpotlight({ language, onOpen }: { language: AppLanguage; onOpen: () => void }) {
  const copy = language === "es"
    ? { eyebrow: "TU COMPAÑERO DE IDEAS", title: "Habla con Edu AI", detail: "Pregunta, estudia, escribe y organiza tus próximos pasos.", action: "Abrir Edu AI" }
    : language === "ru"
      ? { eyebrow: "ВАШ ПОМОЩНИК ДЛЯ ИДЕЙ", title: "Поговорите с Edu AI", detail: "Спрашивайте, учитесь, пишите и планируйте следующие шаги.", action: "Открыть Edu AI" }
      : { eyebrow: "YOUR IDEAS COMPANION", title: "Talk with Edu AI", detail: "Ask, study, write, and organise your next steps.", action: "Open Edu AI" };

  return <section className="edu-ai-spotlight" aria-labelledby="edu-ai-spotlight-title"><span className="edu-ai-spotlight-mark" aria-hidden="true"><EduAiMark /></span><div><p>{copy.eyebrow}</p><h2 id="edu-ai-spotlight-title"><Sparkles size={16} aria-hidden="true" />{copy.title}</h2><span>{copy.detail}</span></div><button type="button" className="edu-ai-spotlight-cta" onClick={onOpen}><Bot size={16} aria-hidden="true" />{copy.action}<ArrowUpRight size={15} aria-hidden="true" /></button></section>;
}

function getSharedToken() {
  if (typeof window === "undefined") return null;
  const match = window.location.hash.match(/^#share=([A-Za-z0-9_-]{32,96})$/);
  return match?.[1] ?? null;
}

function GuidedStartPanel({ language, onOpenStudy, onWrite, onPlan, onCreateAudio }: { language: AppLanguage; onOpenStudy: () => void; onWrite: () => void; onPlan: () => void; onCreateAudio: () => void }) {
  const copy = language === "es"
    ? { eyebrow: "EMPIEZA POR AQUÍ", title: "¿Qué quieres lograr hoy?", detail: "Elige una ruta; puedes cambiarla cuando quieras.", study: ["Estudiar", "Entender, practicar y repasar"], write: ["Escribir", "Dar forma a una idea propia"], plan: ["Planificar", "Convertir intención en pasos"], audio: ["Crear audio", "Escuchar o descargar tu texto"] }
    : language === "ru"
      ? { eyebrow: "НАЧНИТЕ ЗДЕСЬ", title: "Чего вы хотите достичь сегодня?", detail: "Выберите путь — его можно изменить в любой момент.", study: ["Учиться", "Понять, потренироваться и повторить"], write: ["Писать", "Придать идее форму"], plan: ["Планировать", "Превратить намерение в шаги"], audio: ["Создать аудио", "Прослушать или скачать текст"] }
      : { eyebrow: "START HERE", title: "What would you like to achieve today?", detail: "Choose a path; you can change it anytime.", study: ["Study", "Understand, practice, and review"], write: ["Write", "Shape an idea in your own voice"], plan: ["Plan", "Turn intention into steps"], audio: ["Create audio", "Listen to or download your text"] };
  const actions = [
    { id: "study", copy: copy.study, icon: GraduationCap, action: onOpenStudy },
    { id: "write", copy: copy.write, icon: PenLine, action: onWrite },
    { id: "plan", copy: copy.plan, icon: ListChecks, action: onPlan },
    { id: "audio", copy: copy.audio, icon: Volume2, action: onCreateAudio },
  ];

  return <section className="guided-start" aria-labelledby="guided-start-title"><div className="guided-start-heading"><div><p className="overline">{copy.eyebrow}</p><h2 id="guided-start-title">{copy.title}</h2></div><p>{copy.detail}</p></div><div className="guided-start-grid">{actions.map(item => { const Icon = item.icon; return <button key={item.id} type="button" onClick={item.action}><span><Icon size={17} /></span><strong>{item.copy[0]}</strong><small>{item.copy[1]}</small><ArrowUpRight size={15} aria-hidden="true" /></button>; })}</div></section>;
}

function RecentShelf({ language, thread, latestNote, recentAudio, onOpenConversation, onOpenNotes, onOpenAudio }: { language: AppLanguage; thread?: { id: string; title: string }; latestNote?: { content: string }; recentAudio: RecentAudio | null; onOpenConversation: (threadId: string) => void; onOpenNotes: () => void; onOpenAudio: () => void }) {
  const copy = language === "es"
    ? { eyebrow: "CONTINÚA SIN BUSCAR", title: "Vuelve a lo último", conversation: "Conversación", note: "Nota", audio: "Audio", emptyConversation: "Aún no has iniciado una conversación.", emptyNote: "Guarda una idea en tu cuaderno.", emptyAudio: "Crea un audio desde el estudio." }
    : language === "ru"
      ? { eyebrow: "ПРОДОЛЖИТЕ БЕЗ ПОИСКА", title: "Вернитесь к последнему", conversation: "Беседа", note: "Заметка", audio: "Аудио", emptyConversation: "Вы ещё не начали беседу.", emptyNote: "Сохраните идею в блокнот.", emptyAudio: "Создайте аудио в студии." }
      : { eyebrow: "CONTINUE WITHOUT SEARCHING", title: "Pick up where you left off", conversation: "Conversation", note: "Note", audio: "Audio", emptyConversation: "You have not started a conversation yet.", emptyNote: "Save an idea in your notebook.", emptyAudio: "Create audio from the studio." };
  return <section className="recent-shelf" aria-labelledby="recent-shelf-title"><div><p className="overline">{copy.eyebrow}</p><h2 id="recent-shelf-title">{copy.title}</h2></div><div className="recent-shelf-grid"><button type="button" onClick={() => thread && onOpenConversation(thread.id)} disabled={!thread}><MessageSquareText size={17} /><span><small>{copy.conversation}</small><strong>{thread?.title ?? copy.emptyConversation}</strong></span><ArrowUpRight size={15} /></button><button type="button" onClick={onOpenNotes}><ClipboardPenLine size={17} /><span><small>{copy.note}</small><strong>{latestNote?.content ?? copy.emptyNote}</strong></span><ArrowUpRight size={15} /></button><button type="button" onClick={onOpenAudio}><FileAudio size={17} /><span><small>{copy.audio}</small><strong>{recentAudio?.label ?? copy.emptyAudio}</strong></span><ArrowUpRight size={15} /></button></div></section>;
}

function SharedNotebookPage({ data, isLoading, hasError, onBack }: { data?: { title: string; snapshot: string; expiresAt: string | null }; isLoading: boolean; hasError: boolean; onBack: () => void }) {
  const notes = data ? parseSharedNotebookSnapshot(data.snapshot) : [];
  return <main className="shared-notebook-page"><section className="shared-notebook-card">
    <div className="shared-notebook-brand"><span><EduAiMark /></span><strong>Edu AI</strong></div>
    {isLoading ? <p className="shared-notebook-state">Abriendo un cuaderno compartido de forma segura…</p> : hasError || !data ? <><div className="shared-notebook-icon"><ShieldCheck size={24} /></div><h1>Este enlace no está disponible</h1><p>Es posible que haya vencido o que la persona que lo creó lo haya revocado.</p></> : <><div className="shared-notebook-icon"><BookOpen size={24} /></div><p className="overline">CUADERNO COMPARTIDO</p><h1>{data.title}</h1><p className="shared-notebook-detail">Este enlace muestra solo las notas seleccionadas. Las conversaciones y preferencias personales permanecen privadas.</p><div className="shared-notebook-notes">{notes.length ? notes.map((note, index) => <article key={`${index}-${note.content.slice(0, 12)}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{note.content}</p></article>) : <p>No hay notas legibles en este cuaderno compartido.</p>}</div>{data.expiresAt && <small>Disponible hasta el {new Date(data.expiresAt).toLocaleDateString()}</small>}</>}
    <button onClick={onBack}><Link2 size={15} />Volver a Edu AI</button>
  </section></main>;
}

type SidebarContentsProps = {
  activeThreadId: string; isPending: boolean; threads: ReturnType<typeof loadChatState>["threads"]; copy: AppCopy; locale: string;
  folders: ConversationFolder[];
  onNewConversation: () => void; onSelectThread: (threadId: string) => void; onClearConversation: () => void; onDeleteThread: (threadId: string) => void; onOrganizeThread: (threadId: string, changes: Parameters<typeof updateConversationOrganization>[2]) => void; onAddFolder: (name: string) => void; onOpenLearning: () => void;
};

function SidebarContents({ activeThreadId, isPending, threads, folders, copy, locale, onNewConversation, onSelectThread, onClearConversation, onDeleteThread, onOrganizeThread, onAddFolder, onOpenLearning }: SidebarContentsProps) {
  const learningText = copy.languageLabel === "Idioma" ? "Mi espacio de aprendizaje" : copy.languageLabel === "Язык" ? "Моё пространство для учёбы" : "My learning space";
  const labels = copy.languageLabel === "Idioma"
    ? { search: "Buscar conversaciones", all: "Todas", favorites: "Favoritas", folder: "Nueva carpeta", empty: "No hay conversaciones aquí" }
    : copy.languageLabel === "Язык"
      ? { search: "Поиск разговоров", all: "Все", favorites: "Избранное", folder: "Новая папка", empty: "Здесь пока нет разговоров" }
      : { search: "Search conversations", all: "All", favorites: "Favorites", folder: "New folder", empty: "No conversations here yet" };
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState("all");
  const [showFavoriteOnly, setShowFavoriteOnly] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const visibleThreads = threads.filter(thread => {
    const search = `${thread.title} ${(thread.tags ?? []).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase());
    const folder = folderFilter === "all" || thread.folderId === folderFilter;
    return search && folder && (!showFavoriteOnly || thread.isFavorite);
  });
  const submitFolder = () => {
    if (!folderName.trim()) return;
    onAddFolder(folderName);
    setFolderName("");
    setIsAddingFolder(false);
  };
  return <>
    <div className="sidebar-main">
      <div className="identity-lockup"><span className="identity-orb"><EduAiMark /></span><span><strong>Edu AI</strong><small>{copy.brandSubtitle}</small></span></div>
      <button type="button" className="new-chat-button" onClick={onNewConversation} disabled={isPending}><CirclePlus size={17} /> <span>{copy.newConversation}</span><span className="new-chat-key">N</span></button>
      <button type="button" className="sidebar-learning-link" onClick={onOpenLearning}><LibraryBig size={15} /><span>{learningText}</span></button>
      <div className="sidebar-copy"><span>{copy.notebookLabel}</span><p>{copy.notebookDescription}</p></div>
      <div className="thread-organizer">
        <label className="thread-search"><Search size={14} /><span className="sr-only">{labels.search}</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={labels.search} /></label>
        <div className="thread-filters"><select value={folderFilter} onChange={event => setFolderFilter(event.target.value)} aria-label={labels.folder}><option value="all">{labels.all}</option>{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><button className={showFavoriteOnly ? "thread-filter active" : "thread-filter"} onClick={() => setShowFavoriteOnly(current => !current)} aria-pressed={showFavoriteOnly} title={labels.favorites}><Star size={13} /></button><button className="thread-filter" onClick={() => setIsAddingFolder(current => !current)} title={labels.folder}><FolderPlus size={13} /></button></div>
        {isAddingFolder && <div className="folder-composer"><input value={folderName} onChange={event => setFolderName(event.target.value)} onKeyDown={event => event.key === "Enter" && submitFolder()} placeholder={labels.folder} maxLength={36} /><button onClick={submitFolder}>+</button></div>}
      </div>
      <nav className="thread-list" aria-label={copy.notebookLabel}>{visibleThreads.length ? visibleThreads.slice(0, 12).map(thread => <div className={thread.id === activeThreadId ? "thread-entry active" : "thread-entry"} key={thread.id}><button type="button" className={thread.id === activeThreadId ? "thread-link active" : "thread-link"} onClick={() => onSelectThread(thread.id)} disabled={isPending} aria-current={thread.id === activeThreadId ? "page" : undefined}><MessageSquareText size={15} /><span className="thread-text"><strong>{thread.title}</strong><small>{describeThreadRecency(thread.updatedAt, undefined, locale)}{thread.tags?.length ? ` · ${thread.tags.join(", ")}` : ""}</small></span><span className="thread-arrow" aria-hidden="true">↗</span></button><button type="button" className={thread.isFavorite ? "thread-favorite active" : "thread-favorite"} onClick={() => onOrganizeThread(thread.id, { isFavorite: !thread.isFavorite })} disabled={isPending} aria-label={labels.favorites}><Star size={13} /></button><button type="button" className="thread-delete" onClick={() => onDeleteThread(thread.id)} disabled={isPending} aria-label={copy.deleteThreadLabel.replace("{title}", thread.title)} title={copy.deleteThreadLabel.replace("{title}", thread.title)}><Trash2 size={13} /></button></div>) : <p className="thread-empty">{labels.empty}</p>}</nav>
    </div>
    <div className="sidebar-bottom"><a className="social-icon-link" href="https://www.facebook.com/EduardovipJ" target="_self" aria-label="Seguir a Edu AI en Facebook"><FacebookGlyph /></a><div className="privacy-note"><Bot size={16} /><span>{copy.privacyNote}</span></div><button className="erase-button" onClick={onClearConversation} disabled={isPending}><Eraser size={14} /> {copy.resetThread}</button></div>
  </>;
}

function LanguagePicker({ language, copy, onChange }: { language: AppLanguage; copy: AppCopy; onChange: (language: AppLanguage) => void }) {
  const selectLanguage = (value: string) => {
    if (isAppLanguage(value)) {
      onChange(value);
      return;
    }

    const translationUrl = typeof window === "undefined" ? null : getGlobalTranslationUrl(value, window.location.href);
    if (translationUrl) window.location.assign(translationUrl);
  };

  return <label className="language-picker"><Languages size={15} aria-hidden="true" /><span className="sr-only">{copy.languageLabel}</span><select value={language} onChange={event => selectLanguage(event.target.value)} aria-label={copy.languageLabel}><optgroup label={copy.languageLabel}>{LANGUAGE_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</optgroup><optgroup label={copy.globalTranslationLabel}>{GLOBAL_TRANSLATION_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</optgroup></select></label>;
}

function FacebookGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2H7.8v3h2.7v8h3.1Z" fill="currentColor" /></svg>;
}
