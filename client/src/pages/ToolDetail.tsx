import { ArrowLeft, ArrowUpRight, CheckCircle2, CircleAlert, ExternalLink, Lightbulb, ShieldCheck, Star } from "lucide-react";
import { Link, useRoute } from "wouter";
import { tools } from "@/data/tools";
import { ToolMark } from "@/components/ToolMark";
import { ToolCard } from "@/components/ToolCard";

export default function ToolDetail() {
  const [, params] = useRoute("/herramientas/:slug");
  const tool = tools.find((item) => item.slug === params?.slug);
  if (!tool) return <div className="detail-empty"><h1>Herramienta no encontrada</h1><Link href="/">Volver al directorio</Link></div>;
  const similar = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug).slice(0, 3);
  return (
    <main className="detail-page">
      <header className="detail-nav"><Link href="/" className="back-link"><ArrowLeft size={17} /> Volver al directorio</Link><Link href="/" className="brand-mini"><span>e</span> Edu AI</Link></header>
      <section className="detail-hero">
        <div className="detail-tool-title"><ToolMark tool={tool} size="lg" /><div><span className="tool-kicker">{tool.category} · {tool.pricing}</span><h1>{tool.name}</h1><p>{tool.description}</p></div></div>
        <a href={tool.officialUrl} target="_blank" rel="noreferrer" className="official-button">Visitar sitio oficial <ExternalLink size={17} /></a>
      </section>
      <section className="detail-grid">
        <div className="detail-main">
          <div className="detail-section"><div className="section-label"><Lightbulb size={17} /> Cuándo elegirla</div><div className="case-grid">{tool.useCases.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="pros-cons">
            <div><div className="section-label green"><CheckCircle2 size={17} /> Lo que destaca</div><ul>{tool.pros.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><div className="section-label orange"><CircleAlert size={17} /> Antes de empezar</div><ul>{tool.cons.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
          <div className="detail-section free-plan"><div className="section-label"><ShieldCheck size={17} /> Información del plan gratuito</div><p>{tool.freePlan}</p><small>Los planes y límites cambian. Confirma siempre la información vigente en el sitio oficial.</small></div>
        </div>
        <aside className="detail-aside"><div className="score-panel"><Star size={18} /><span>Puntuación</span><strong>En evaluación</strong><p>Edu AI no inventa valoraciones. Cuando existan datos verificables, se mostrarán con su fuente.</p></div><div className="official-box"><span>Enlace verificado</span><a href={tool.officialUrl} target="_blank" rel="noreferrer">{new URL(tool.officialUrl).hostname}<ArrowUpRight size={15} /></a></div></aside>
      </section>
      {similar.length > 0 && <section className="similar-section"><div><span className="eyebrow">Explora más</span><h2>Alternativas en {tool.category}</h2></div><div className="tool-grid small-grid">{similar.map((item) => <ToolCard key={item.slug} tool={item} />)}</div></section>}
    </main>
  );
}
