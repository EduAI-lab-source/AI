import { AIChatBox } from "@/components/AIChatBox";
import {
  loadChatState,
  replaceThreadMessages,
  saveChatState,
  startFreshConversation,
  type ConversationMessage,
} from "@/lib/chatSession";
import { trpc } from "@/lib/trpc";
import { Bot, CirclePlus, Eraser, MessageSquareText, Sparkles } from "lucide-react";
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
  const chat = trpc.eduAi.chat.useMutation();
  const activeThread = useMemo(
    () => chatState.threads.find(thread => thread.id === chatState.activeThreadId) ?? chatState.threads[0],
    [chatState]
  );

  useEffect(() => saveChatState(chatState), [chatState]);

  const startNewConversation = () => {
    if (chat.isPending) return;
    setChatState(current => startFreshConversation(current));
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

  return (
    <main className="edu-app">
      <aside className="conversation-sidebar">
        <div className="identity-lockup">
          <span className="identity-orb"><Sparkles size={17} /></span>
          <span><strong>Edu AI</strong><small>Tu espacio para pensar</small></span>
        </div>
        <button className="new-chat-button" onClick={startNewConversation} disabled={chat.isPending}>
          <CirclePlus size={17} /> Nueva conversación
        </button>
        <div className="sidebar-copy">
          <span>HILOS RECIENTES</span>
          <p>Las conversaciones se conservan en este navegador para retomar tus ideas.</p>
        </div>
        <nav className="thread-list" aria-label="Conversaciones recientes">
          {chatState.threads.slice(0, 6).map(thread => (
            <button
              key={thread.id}
              className={thread.id === activeThread.id ? "thread-link active" : "thread-link"}
              onClick={() => !chat.isPending && setChatState(current => ({ ...current, activeThreadId: thread.id }))}
              disabled={chat.isPending}
            >
              <MessageSquareText size={14} /><span>{thread.title}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><Bot size={16} /><span>Edu AI conserva el contexto del hilo activo.</span></div>
          <button className="erase-button" onClick={clearActiveConversation} disabled={chat.isPending}><Eraser size={14} /> Reiniciar este hilo</button>
        </div>
      </aside>

      <section className="conversation-main">
        <header className="conversation-header">
          <div>
            <span className="status-line"><i /> Edu AI está presente</span>
            <h1>{activeThread.title === "Nueva conversación" ? "Conversa. Crea. Avanza." : activeThread.title}</h1>
          </div>
          <button className="mobile-new-chat" onClick={startNewConversation} disabled={chat.isPending} aria-label="Nueva conversación"><CirclePlus size={19} /></button>
        </header>

        <div className="conversation-stage">
          {!hasConversation && (
            <>
              <div className="conversation-intro">
                <div className="intro-mark"><Sparkles size={19} /></div>
                <div>
                  <p className="overline">UNA CONVERSACIÓN A LA VEZ</p>
                  <h2>Un lugar tranquilo para tus próximas ideas.</h2>
                  <p>Edu AI escucha el hilo, se adapta al ritmo de la conversación y te ayuda a pasar de una pregunta a un siguiente paso.</p>
                </div>
              </div>
              <div className="starter-row" aria-label="Ideas para comenzar">
                {STARTERS.map(starter => (
                  <button key={starter} onClick={() => sendMessage(starter)} disabled={chat.isPending}>{starter}</button>
                ))}
              </div>
            </>
          )}

          <AIChatBox
            messages={activeThread.messages}
            onSendMessage={sendMessage}
            isLoading={isActivePending}
            placeholder="Escribe lo que estás pensando…"
            className={hasConversation ? "chat-canvas chat-canvas-active" : "chat-canvas"}
            height={hasConversation ? "min(71vh, 760px)" : "min(59vh, 620px)"}
          />
          <p className="composer-caption">Edu AI puede equivocarse. Contrasta la información importante antes de actuar.</p>
        </div>
      </section>
    </main>
  );
}
