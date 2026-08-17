import { Link } from "wouter";
import { ArrowUpRight, Check, CircleDollarSign, ExternalLink, Star } from "lucide-react";
import type { AiTool } from "@/data/tools";
import { ToolMark } from "./ToolMark";

export function ToolCard({ tool, featured = false }: { tool: AiTool; featured?: boolean }) {
  return (
    <article className={`tool-card ${featured ? "tool-card-featured" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <ToolMark tool={tool} />
        <span className={`price-pill price-${tool.pricing.toLowerCase()}`}><CircleDollarSign size={13} />{tool.pricing}</span>
      </div>
      <div className="mt-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
          <span className="category-dot" style={{ backgroundColor: tool.accent }} /> {tool.category}
        </div>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="score-status"><Star size={14} />{tool.scoreLabel}</span>
        <span className="card-actions"><a href={tool.officialUrl} target="_blank" rel="noreferrer" className="official-card-link" aria-label={`Visitar sitio oficial de ${tool.name}`}><ExternalLink size={14} /></a><Link href={`/herramientas/${tool.slug}`} className="card-link">Ver ficha <ArrowUpRight size={15} /></Link></span>
      </div>
      <div className="sr-only">Pros: {tool.pros.join(", ")}. Plan gratuito: {tool.freePlan}</div>
    </article>
  );
}

export function CompactRecommendation({ tool }: { tool: AiTool }) {
  return (
    <Link href={`/herramientas/${tool.slug}`} className="recommendation-card">
      <ToolMark tool={tool} size="sm" />
      <span className="min-w-0"><strong>{tool.name}</strong><small>{tool.category} · {tool.pricing}</small></span>
      <Check size={15} className="text-emerald-600" />
    </Link>
  );
}
