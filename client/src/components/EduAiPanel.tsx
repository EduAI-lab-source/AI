import { useState } from "react";
import { Bot, BrainCircuit, ShieldCheck, Sparkles } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { tools, type AiTool } from "@/data/tools";
import { createEduAiPayload, getCatalogAnswer } from "@/lib/eduAi";
import { CompactRecommendation } from "./ToolCard";

const prompts = ["¿Cuál es la mejor IA gratis para diseño?", "Compara ChatGPT vs Claude", "Quiero automatizar tareas sin programar"];

export function EduAiPanel() {
  const [messages, setMessages] = useState<Message[]>([{ role: "system", content: "Identidad de Edu AI activa." }]);
  const [recommendations, setRecommendations] = useState<AiTool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"catalog" | "live">("catalog");

  const answer = async (content: string) => {
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setIsLoading(true);
    const endpoint = import.meta.env.VITE_EDU_AI_ENDPOINT as string | undefined;
    try {
      if (endpoint) {
        const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(createEduAiPayload(next, tools)) });
        if (!response.ok) throw new Error("Edu AI no pudo conectarse al servicio en este momento.");
        const data = (await response.json()) as { content?: string; recommendations?: string[] };
        const picked = (data.recommendations ?? []).map((slug) => tools.find((tool) => tool.slug === slug)).filter(Boolean) as AiTool[];
        setRecommendations(picked);
        setMessages((current) => [...current, { role: "assistant", content: data.content || "Soy Edu AI. No pude generar una respuesta completa; prueba de nuevo en unos instantes." }]);
        setMode("live");
      } else {
        const result = getCatalogAnswer(content, tools, messages);
        setRecommendations(result.recommendations);
        setMessages((current) => [...current, { role: "assistant", content: result.content }]);
        setMode("catalog");
      }
    } catch (error) {
      const fallback = getCatalogAnswer(content, tools, messages);
      setRecommendations(fallback.recommendations);
      setMessages((current) => [...current, { role: "assistant", content: "Estoy en modo catálogo temporalmente. " + fallback.content }]);
      setMode("catalog");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="edu-ai" className="edu-ai-shell" aria-labelledby="edu-ai-title">
      <div className="edu-ai-intro">
        <div className="eyebrow eyebrow-light"><Sparkles size={14} /> Asistente propio</div>
        <h2 id="edu-ai-title">Conoce a <span>Edu AI.</span></h2>
        <p>Tu guía educativa para descubrir herramientas, comparar alternativas y avanzar con seguridad. Su identidad, voz y conocimiento están definidos para este directorio.</p>
        <div className="identity-list">
          <div><Bot size={18} /><span><strong>Identidad propia</strong>Siempre se presenta como Edu AI.</span></div>
          <div><BrainCircuit size={18} /><span><strong>Conocimiento del catálogo</strong>Recomienda usando las fichas de este sitio.</span></div>
          <div><ShieldCheck size={18} /><span><strong>Privacidad primero</strong>La versión estática no expone ninguna clave privada.</span></div>
        </div>
      </div>
      <div className="edu-ai-chat-wrap">
        <div className="chat-topbar"><span className="ai-orb"><Sparkles size={16} /></span><span><strong>Edu AI</strong><small>{mode === "live" ? "Asistencia generativa conectada" : "Modo catálogo · sin claves expuestas"}</small></span><span className="online-indicator">Disponible</span></div>
        <AIChatBox messages={messages} onSendMessage={answer} isLoading={isLoading} height="390px" className="edu-chat" placeholder="Pregunta a Edu AI…" emptyStateMessage="Soy Edu AI. ¿Qué quieres crear hoy?" suggestedPrompts={prompts} />
        {recommendations.length > 0 && <div className="recommendations"><span>Herramientas que te sugiere Edu AI</span><div>{recommendations.map((tool) => <CompactRecommendation key={tool.slug} tool={tool} />)}</div></div>}
      </div>
    </section>
  );
}
