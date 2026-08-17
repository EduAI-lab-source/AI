import { AIChatBox } from "@/components/AIChatBox";
import {
  describeThreadRecency,
  loadChatState,
  replaceThreadMessages,
  saveChatState,
  startFreshConversation,
  type ConversationMessage,
} from "@/lib/chatSession";
import { getEduAiApiBase, humanizeChatError, isChatTransportAvailable } from "@/lib/chatRuntime";
import { COPY, LANGUAGE_OPTIONS, getLocale, loadLanguage, saveLanguage, type AppCopy, type AppLanguage } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Bot, CirclePlus, Eraser, Languages, Menu, MessageSquareText, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [chatState, setChatState] = useState(loadChatState);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(loadLanguage);
  const chat = trpc.eduAi.chat.useMutation();
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

  const sendMessage = (content: string) => {
    if (!activeThread || chat.isPending || !isChatAvailable) return;
    const threadId = activeThread.id;
    const nextMessages: ConversationMessage[] = [...activeThread.messages, { role: "user", content }];
    setChatState(current => replaceThreadMessages(current, threadId, nextMessages));
    setPendingThreadId(threadId);

    chat.mutate(
      { messages: nextMessages.slice(-18) },
      {
        onSuccess: response => {
          setChatState(current => {
            const thread = current.threads.find(item => item.id === threadId);
            return thread
              ? replaceThreadMessages(current, threadId, [...thread.messages, { role: "assistant", content: response.content }])
              : current;
          });
        },
        onError: error => {
          setChatState(current => {
            const thread = current.threads.find(item => item.id === threadId);
            return thread
              ? replaceThreadMessages(current, threadId, [...thread.messages, { role: "assistant", content: humanizeChatError(error) }])
              : current;
          });
        },
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
  const sidebarProps = {
    activeThreadId: activeThread.id,
    isPending: chat.isPending,
    threads: chatState.threads,
    copy,
    locale: getLocale(language),
    onNewConversation: startNewConversation,
    onSelectThread: selectThread,
    onClearConversation: clearActiveConversation,
  };

  return (
    <main className="edu-app">
      <aside className="conversation-sidebar"><SidebarContents {...sidebarProps} /></aside>

      {isHistoryOpen && (
        <div className="mobile-history" role="dialog" aria-modal="true" aria-label={copy.openHistory}>
          <button className="mobile-history-scrim" aria-label={copy.closeHistory} onClick={() => setIsHistoryOpen(false)} />
          <aside className="mobile-history-sheet">
            <button className="close-history" onClick={() => setIsHistoryOpen(false)} aria-label={copy.closeHistory}><X size={18} /></button>
            <SidebarContents {...sidebarProps} />
          </aside>
        </div>
      )}

      <section className="conversation-main">
        <div className="mobile-appbar">
          <button className="mobile-menu" onClick={() => setIsHistoryOpen(true)} aria-label={copy.openHistory}><Menu size={20} /></button>
          <div className="mobile-brand"><span className="mini-mark"><Sparkles size={13} /></span><strong>Edu AI</strong></div>
          <button className="mobile-new-chat" onClick={startNewConversation} disabled={chat.isPending} aria-label={copy.startNewChat}><CirclePlus size={20} /></button>
        </div>

        <header className="conversation-header">
          <div>
            <span className="status-line"><i /> {copy.statusLine}</span>
            <h1>{hasConversation ? activeThread.title : <>{copy.heroTitle}<br /><em>{copy.heroEmphasis}</em></>}</h1>
            <p className="header-subtitle">{copy.headerSubtitle}</p>
          </div>
          <div className="header-actions">
            <LanguagePicker language={language} copy={copy} onChange={setLanguage} />
            <span className="header-mark" aria-hidden="true"><Sparkles size={17} /></span>
          </div>
        </header>

        <div className="conversation-stage">
          {!hasConversation && (
            <section className="conversation-intro">
              <div className="intro-mark"><span /><Sparkles size={20} /></div>
              <div className="intro-copy">
                <p className="overline">{copy.introOverline}</p>
                <h2>{copy.introTitle}<br /><em>{copy.introEmphasis}</em></h2>
                <p>{copy.introDescription}</p>
                <div className="intro-whisper"><span>{copy.introWhisper}</span><ArrowUpRight size={15} /></div>
              </div>
              <div className="starter-row" aria-label={copy.introTitle}>
                {copy.starters.map((starter, index) => (
                  <button key={starter} onClick={() => sendMessage(starter)} disabled={chat.isPending || !isChatAvailable}>
                    <span className="starter-number">0{index + 1}</span>{starter}<ArrowUpRight size={14} />
                  </button>
                ))}
              </div>
            </section>
          )}

          <AIChatBox
            messages={activeThread.messages}
            onSendMessage={sendMessage}
            isLoading={isActivePending}
            placeholder={isChatAvailable ? copy.composerPlaceholder : copy.unavailablePlaceholder}
            disabled={!isChatAvailable}
            disabledMessage={!isChatAvailable ? copy.unavailableMessage : undefined}
            className={hasConversation ? "chat-canvas chat-canvas-active" : "chat-canvas"}
            height={hasConversation ? "min(67vh, 740px)" : "min(38vh, 420px)"}
          />
          <p className="composer-caption"><span>↗</span> {copy.disclaimer}</p>
        </div>
      </section>
    </main>
  );
}

type SidebarContentsProps = {
  activeThreadId: string;
  isPending: boolean;
  threads: ReturnType<typeof loadChatState>["threads"];
  copy: AppCopy;
  locale: string;
  onNewConversation: () => void;
  onSelectThread: (threadId: string) => void;
  onClearConversation: () => void;
};

function SidebarContents({ activeThreadId, isPending, threads, copy, locale, onNewConversation, onSelectThread, onClearConversation }: SidebarContentsProps) {
  return (
    <>
      <div className="identity-lockup">
        <span className="identity-orb"><Sparkles size={17} /></span>
        <span><strong>Edu AI</strong><small>{copy.brandSubtitle}</small></span>
      </div>
      <button className="new-chat-button" onClick={onNewConversation} disabled={isPending}>
        <CirclePlus size={17} /> <span>{copy.newConversation}</span><span className="new-chat-key">N</span>
      </button>
      <div className="sidebar-copy"><span>{copy.notebookLabel}</span><p>{copy.notebookDescription}</p></div>
      <nav className="thread-list" aria-label={copy.notebookLabel}>
        {threads.slice(0, 6).map(thread => (
          <button
            key={thread.id}
            className={thread.id === activeThreadId ? "thread-link active" : "thread-link"}
            onClick={() => onSelectThread(thread.id)}
            disabled={isPending}
            aria-current={thread.id === activeThreadId ? "page" : undefined}
          >
            <MessageSquareText size={15} />
            <span className="thread-text"><strong>{thread.title}</strong><small>{describeThreadRecency(thread.updatedAt, undefined, locale)}</small></span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note"><Bot size={16} /><span>{copy.privacyNote}</span></div>
        <button className="erase-button" onClick={onClearConversation} disabled={isPending}><Eraser size={14} /> {copy.resetThread}</button>
      </div>
    </>
  );
}

function LanguagePicker({ language, copy, onChange }: { language: AppLanguage; copy: AppCopy; onChange: (language: AppLanguage) => void }) {
  return (
    <label className="language-picker">
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">{copy.languageLabel}</span>
      <select value={language} onChange={event => onChange(event.target.value as AppLanguage)} aria-label={copy.languageLabel}>
        {LANGUAGE_OPTIONS.map(option => <option key={option.code} value={option.code}>{option.label}</option>)}
      </select>
    </label>
  );
}
