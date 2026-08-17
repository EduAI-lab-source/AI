import { AIChatBox } from "@/components/AIChatBox";
import {
  describeThreadRecency,
  loadChatState,
  replaceThreadMessages,
  saveChatState,
  startFreshConversation,
  type ConversationMessage,
} from "@/lib/chatSession";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Bot, CirclePlus, Eraser, Menu, MessageSquareText, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const STARTERS = [
  "Tengo una idea y quiero ordenarla.",
  "Ayúdame a crear un plan para aprender algo nuevo.",
  "Necesito pensar una decisión con más claridad.",
  "Quiero escribir algo, pero no sé cómo empezar.",
];

export default function Home() {
  const [chatState, setChatState] = useState(loadChatState);
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const chat = trpc.eduAi.chat.useMutation();
  const activeThread = useMemo(
    () => chatState.threads.find(thread => thread.id === chatState.activeThreadId) ?? chatState.threads[0],
    [chatState]
  );

  useEffect(() => saveChatState(chatState), [chatState]);

  const startNewConversation = () => {
    if (chat.isPending) return;
    setChatState(current => startFreshConversation(current));
    setIsHistoryOpen(false);
  };

  const clearActiveConversation = () => {
    if (!activeThread || chat.isPending) return;
    setChatState(current => replaceThreadMessages(current, activeThread.id, [activeThread.messages[0]]));
  };

  const sendMessage = (content: string) => {
    if (!activeThread || chat.isPending) return;
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
              ? replaceThreadMessages(current, threadId, [
                  ...thread.messages,
                  { role: "assistant", content: error.message || "Tuve un problema al responder. Intenta enviarme el mensaje otra vez en unos segundos." },
                ])
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

  return (
    <main className="edu-app">
      <aside className="conversation-sidebar">
        <SidebarContents
          activeThreadId={activeThread.id}
          isPending={chat.isPending}
          threads={chatState.threads}
          onNewConversation={startNewConversation}
          onSelectThread={selectThread}
          onClearConversation={clearActiveConversation}
        />
      </aside>

      {isHistoryOpen && (
        <div className="mobile-history" role="dialog" aria-modal="true" aria-label="Historial de conversaciones">
          <button className="mobile-history-scrim" aria-label="Cerrar historial" onClick={() => setIsHistoryOpen(false)} />
          <aside className="mobile-history-sheet">
            <button className="close-history" onClick={() => setIsHistoryOpen(false)} aria-label="Cerrar historial"><X size={18} /></button>
            <SidebarContents
              activeThreadId={activeThread.id}
              isPending={chat.isPending}
              threads={chatState.threads}
              onNewConversation={startNewConversation}
              onSelectThread={selectThread}
              onClearConversation={clearActiveConversation}
            />
          </aside>
        </div>
      )}

      <section className="conversation-main">
        <div className="mobile-appbar">
          <button className="mobile-menu" onClick={() => setIsHistoryOpen(true)} aria-label="Abrir historial de conversaciones"><Menu size={20} /></button>
          <div className="mobile-brand"><span className="mini-mark"><Sparkles size={13} /></span><strong>Edu AI</strong></div>
          <button className="mobile-new-chat" onClick={startNewConversation} disabled={chat.isPending} aria-label="Nueva conversación"><CirclePlus size={20} /></button>
        </div>

        <header className="conversation-header">
          <div>
            <span className="status-line"><i /> Espacio para pensar sin prisa</span>
            <h1>{activeThread.title === "Nueva conversación" ? <>Haz espacio<br /><em>para lo que importa.</em></> : activeThread.title}</h1>
            <p className="header-subtitle">Una conversación a la vez. Una idea con dirección.</p>
          </div>
          <span className="header-mark" aria-hidden="true"><Sparkles size={17} /></span>
        </header>

        <div className="conversation-stage">
          {!hasConversation && (
            <section className="conversation-intro">
              <div className="intro-mark"><span /><Sparkles size={20} /></div>
              <div className="intro-copy">
                <p className="overline">EMPEZAR TAMBIÉN ES AVANZAR</p>
                <h2>¿Por dónde<br /><em>quieres comenzar?</em></h2>
                <p>Edu AI te acompaña a observar, ordenar y llevar cada idea a un siguiente paso posible.</p>
                <div className="intro-whisper"><span>Sin respuestas prefabricadas</span><ArrowUpRight size={15} /></div>
              </div>
              <div className="starter-row" aria-label="Ideas para comenzar">
                {STARTERS.map((starter, index) => (
                  <button key={starter} onClick={() => sendMessage(starter)} disabled={chat.isPending}>
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
            placeholder="Escribe lo que estás pensando…"
            className={hasConversation ? "chat-canvas chat-canvas-active" : "chat-canvas"}
            height={hasConversation ? "min(67vh, 740px)" : "min(38vh, 420px)"}
          />
          <p className="composer-caption"><span>↗</span> Edu AI puede equivocarse. Contrasta la información importante antes de actuar.</p>
        </div>
      </section>
    </main>
  );
}

type SidebarContentsProps = {
  activeThreadId: string;
  isPending: boolean;
  threads: ReturnType<typeof loadChatState>["threads"];
  onNewConversation: () => void;
  onSelectThread: (threadId: string) => void;
  onClearConversation: () => void;
};

function SidebarContents({ activeThreadId, isPending, threads, onNewConversation, onSelectThread, onClearConversation }: SidebarContentsProps) {
  return (
    <>
      <div className="identity-lockup">
        <span className="identity-orb"><Sparkles size={17} /></span>
        <span><strong>Edu AI</strong><small>Estudio para tus ideas</small></span>
      </div>
      <button className="new-chat-button" onClick={onNewConversation} disabled={isPending}>
        <CirclePlus size={17} /> <span>Nueva conversación</span><span className="new-chat-key">N</span>
      </button>
      <div className="sidebar-copy">
        <span>CUADERNO DE IDEAS</span>
        <p>Tus conversaciones viven aquí para que puedas volver cuando quieras.</p>
      </div>
      <nav className="thread-list" aria-label="Conversaciones recientes">
        {threads.slice(0, 6).map(thread => (
          <button
            key={thread.id}
            className={thread.id === activeThreadId ? "thread-link active" : "thread-link"}
            onClick={() => onSelectThread(thread.id)}
            disabled={isPending}
            aria-current={thread.id === activeThreadId ? "page" : undefined}
          >
            <MessageSquareText size={15} />
            <span className="thread-text"><strong>{thread.title}</strong><small>{describeThreadRecency(thread.updatedAt)}</small></span>
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="privacy-note"><Bot size={16} /><span>El contexto se conserva en este navegador.</span></div>
        <button className="erase-button" onClick={onClearConversation} disabled={isPending}><Eraser size={14} /> Reiniciar este hilo</button>
      </div>
    </>
  );
}
