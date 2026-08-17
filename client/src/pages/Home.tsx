import { AIChatBox } from "@/components/AIChatBox";
import { LearningStudio, type ResponseStyle } from "@/components/LearningStudio";
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
import { getEduAiApiBase, humanizeChatError, isChatTransportAvailable } from "@/lib/chatRuntime";
import { COPY, LANGUAGE_OPTIONS, getLocale, loadLanguage, saveLanguage, type AppCopy, type AppLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { workspaceStateFromSnapshot } from "@/lib/workspaceRestore";
import { parseSharedNotebookSnapshot } from "@/lib/sharedNotebook";
import { ArrowUpRight, Bot, BookOpen, CirclePlus, Eraser, FolderPlus, Languages, LibraryBig, Link2, Menu, MessageSquareText, Search, ShieldCheck, Star, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const EDU_AI_LOGO_SRC = "https://edusearch-9qua9exp.manus.space/manus-storage/edu-ai-origen-mark_85743c02.png";

export default function Home() {
  const [sharedToken, setSharedToken] = useState(() => getSharedToken());
  const [chatState, setChatState] = useState(loadChatState);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLearningOpen, setIsLearningOpen] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(loadLanguage);
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>(() => {
    if (typeof window === "undefined") return "deep";
    const saved = window.localStorage.getItem("edu-ai:response-style:v1");
    return saved === "brief" || saved === "deep" || saved === "creative" || saved === "study" ? saved : "deep";
  });
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
  useEffect(() => window.localStorage.setItem("edu-ai:response-style:v1", responseStyle), [responseStyle]);
  useEffect(() => {
    const onHashChange = () => setSharedToken(getSharedToken());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (sharedToken) return <SharedNotebookPage data={sharedNotebook.data} isLoading={sharedNotebook.isLoading} hasError={sharedNotebook.isError} onBack={() => { window.location.hash = ""; }} />;

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

  const sendMessage = (content: string, imageAttachment?: ChatImageAttachment) => {
    if (!activeThread || chat.isPending || !isChatAvailable) return;
    const threadId = activeThread.id;
    const nextMessages: ConversationMessage[] = [...activeThread.messages, { role: "user", content }];
    setChatState(current => replaceThreadMessages(current, threadId, nextMessages));
    setPendingThreadId(threadId);
    chat.mutate(
      { messages: nextMessages.slice(-18), responseStyle, imageAttachment: imageAttachment ? { name: imageAttachment.name, dataUrl: imageAttachment.dataUrl } : undefined },
      {
        onSuccess: response => setChatState(current => {
          const thread = current.threads.find(item => item.id === threadId);
          return thread ? replaceThreadMessages(current, threadId, [...thread.messages, { role: "assistant", content: response.content }]) : current;
        }),
        onError: error => setChatState(current => {
          const thread = current.threads.find(item => item.id === threadId);
          return thread ? replaceThreadMessages(current, threadId, [...thread.messages, { role: "assistant", content: humanizeChatError(error) }]) : current;
        }),
        onSettled: () => setPendingThreadId(null),
      }
    );
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
    onOpenLearning: () => { setIsLearningOpen(true); setIsHistoryOpen(false); },
  };
  const learningLabel = language === "es" ? "Mi espacio" : language === "ru" ? "Моё пространство" : "My space";
  const latestAssistantMessage = [...activeThread.messages].reverse().find(message => message.role === "assistant")?.content;
  const deleteTarget = chatState.threads.find(thread => thread.id === deleteTargetId);

  return (
    <main className="edu-app">
      <aside className="conversation-sidebar"><SidebarContents {...sidebarProps} /></aside>
      {isHistoryOpen && <div className="mobile-history" role="dialog" aria-modal="true" aria-label={copy.openHistory}>
        <button className="mobile-history-scrim" aria-label={copy.closeHistory} onClick={() => setIsHistoryOpen(false)} />
        <aside className="mobile-history-sheet"><button className="close-history" onClick={() => setIsHistoryOpen(false)} aria-label={copy.closeHistory}><X size={18} /></button><SidebarContents {...sidebarProps} /></aside>
      </div>}

      <section className="conversation-main">
        <div className="mobile-appbar">
          <button className="mobile-menu" onClick={() => setIsHistoryOpen(true)} aria-label={copy.openHistory}><Menu size={20} /></button>
          <div className="mobile-brand"><span className="mini-mark"><img src={EDU_AI_LOGO_SRC} alt="" /></span><strong>Edu AI</strong></div>
          <button className="mobile-new-chat" onClick={startNewConversation} disabled={chat.isPending} aria-label={copy.startNewChat}><CirclePlus size={20} /></button>
        </div>
        <header className="conversation-header">
          <div><span className="status-line"><i /> {copy.statusLine}</span><h1>{hasConversation ? activeThread.title : <>{copy.heroTitle}<br /><em>{copy.heroEmphasis}</em></>}</h1><p className="header-subtitle">{copy.headerSubtitle}</p></div>
          <div className="header-actions"><button className="learning-entry" onClick={() => setIsLearningOpen(current => !current)} aria-pressed={isLearningOpen}><LibraryBig size={15} />{learningLabel}</button><LanguagePicker language={language} copy={copy} onChange={setLanguage} /><span className="header-mark" aria-hidden="true"><img src={EDU_AI_LOGO_SRC} alt="" /></span></div>
        </header>
        <div className="conversation-stage">
          {isLearningOpen ? <LearningStudio language={language} latestAssistantMessage={latestAssistantMessage} onAskEdu={sendMessage} onClose={() => setIsLearningOpen(false)} responseStyle={responseStyle} onResponseStyleChange={setResponseStyle} chatState={chatState} onRestoreWorkspace={snapshot => { const restored = workspaceStateFromSnapshot(snapshot); setChatState(restored.chatState); setLanguage(restored.language); setResponseStyle(restored.responseStyle); }} /> : <>
            {!hasConversation && <section className="conversation-intro">
              <div className="intro-mark" aria-hidden="true"><img src={EDU_AI_LOGO_SRC} alt="" /></div>
              <div className="intro-copy"><p className="overline">{copy.introOverline}</p><h2>{copy.introTitle}<br /><em>{copy.introEmphasis}</em></h2><p>{copy.introDescription}</p><div className="intro-whisper"><span>{copy.introWhisper}</span><ArrowUpRight size={15} /></div></div>
              <div className="starter-row" aria-label={copy.introTitle}>{copy.starters.map((starter, index) => <button key={starter} onClick={() => sendMessage(starter)} disabled={chat.isPending || !isChatAvailable}><span className="starter-number">0{index + 1}</span>{starter}<ArrowUpRight size={14} /></button>)}</div>
            </section>}
            <AIChatBox messages={activeThread.messages} onSendMessage={sendMessage} isLoading={isActivePending} placeholder={isChatAvailable ? copy.composerPlaceholder : copy.unavailablePlaceholder} disabled={!isChatAvailable} disabledMessage={!isChatAvailable ? copy.unavailableMessage : undefined} voiceLanguage={language === "es" ? "es-VE" : language === "ru" ? "ru-RU" : "en-US"} className={hasConversation ? "chat-canvas chat-canvas-active" : "chat-canvas"} height={hasConversation ? "min(67vh, 740px)" : "min(38vh, 420px)"} />
            <p className="composer-caption"><span>↗</span> {copy.disclaimer}</p>
          </>}
        </div>
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

function getSharedToken() {
  if (typeof window === "undefined") return null;
  const match = window.location.hash.match(/^#share=([A-Za-z0-9_-]{32,96})$/);
  return match?.[1] ?? null;
}

function SharedNotebookPage({ data, isLoading, hasError, onBack }: { data?: { title: string; snapshot: string; expiresAt: string | null }; isLoading: boolean; hasError: boolean; onBack: () => void }) {
  const notes = data ? parseSharedNotebookSnapshot(data.snapshot) : [];
  return <main className="shared-notebook-page"><section className="shared-notebook-card">
    <div className="shared-notebook-brand"><span><img src={EDU_AI_LOGO_SRC} alt="" /></span><strong>Edu AI</strong></div>
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
      <div className="identity-lockup"><span className="identity-orb"><img src={EDU_AI_LOGO_SRC} alt="" /></span><span><strong>Edu AI</strong><small>{copy.brandSubtitle}</small></span></div>
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
    <div className="sidebar-bottom"><a className="social-icon-link" href="https://www.facebook.com/EduardovipJ" target="_blank" rel="noreferrer" aria-label="Seguir a Edu AI en Facebook"><FacebookGlyph /></a><div className="privacy-note"><Bot size={16} /><span>{copy.privacyNote}</span></div><button className="erase-button" onClick={onClearConversation} disabled={isPending}><Eraser size={14} /> {copy.resetThread}</button></div>
  </>;
}

function LanguagePicker({ language, copy, onChange }: { language: AppLanguage; copy: AppCopy; onChange: (language: AppLanguage) => void }) {
  return <label className="language-picker"><Languages size={15} aria-hidden="true" /><span className="sr-only">{copy.languageLabel}</span><select value={language} onChange={event => onChange(event.target.value as AppLanguage)} aria-label={copy.languageLabel}>{LANGUAGE_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}</select></label>;
}

function FacebookGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.6 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5H17V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2H7.8v3h2.7v8h3.1Z" fill="currentColor" /></svg>;
}
