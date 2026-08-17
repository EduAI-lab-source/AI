import { EDU_AI_SYSTEM_PROMPT } from "@/data/eduAiProfile";
import { EDU_AI_PROFILE } from "@/data/eduAiProfile";
import type { AiTool, Category } from "@/data/tools";

export { EDU_AI_SYSTEM_PROMPT } from "@/data/eduAiProfile";

export type EduAiMessage = { role: "system" | "user" | "assistant"; content: string };
export type EduAiAnswer = { content: string; recommendations: AiTool[]; mode: "catalog" | "live" };

const categoryAliases: Array<{ category: Category; words: string[] }> = [
  { category: "Chatbots", words: ["chatbot", "chatbots", "asistente", "chat", "pregunta"] },
  { category: "Diseño", words: ["diseño", "diseno", "imagen", "imagenes", "foto", "logo", "gráfico", "grafico"] },
  { category: "Video", words: ["video", "vídeo", "reel", "clip", "animación", "animacion"] },
  { category: "Audio", words: ["audio", "voz", "música", "musica", "podcast", "transcribir"] },
  { category: "Productividad", words: ["productividad", "tarea", "notas", "organizar", "trabajo"] },
  { category: "Programación", words: ["programación", "programacion", "código", "codigo", "programar", "app", "web"] },
  { category: "Automatización", words: ["automatización", "automatizacion", "automatizar", "flujo", "integrar"] },
  { category: "Traducción", words: ["traducción", "traduccion", "traducir", "idioma", "gramática", "gramatica"] },
  { category: "Investigación", words: ["investigación", "investigacion", "paper", "fuentes", "evidencia"] },
  { category: "Documentos", words: ["pdf", "documento", "archivo", "contrato"] },
  { category: "Presentaciones", words: ["presentación", "presentacion", "diapositiva", "pitch"] },
];

const priceRank = { Gratis: 0, Freemium: 1, Pago: 2 } as const;

function findCategory(query: string): Category | undefined {
  return categoryAliases.find(({ words }) => words.some((word) => query.includes(word)))?.category;
}

type ExperienceLevel = "principiante" | "intermedio" | "avanzado" | undefined;

function findExperienceLevel(query: string): ExperienceLevel {
  if (/principiante|empiezo|empezar|sin experiencia|f[aá]cil|fácil/.test(query)) return "principiante";
  if (/avanzado|profesional|t[eé]cnico|experto/.test(query)) return "avanzado";
  if (/intermedio/.test(query)) return "intermedio";
  return undefined;
}

const beginnerSlugs = new Set(["chatgpt", "gemini", "canva-ai", "gamma", "google-translate", "notion-ai", "pika", "make", "zapier", "deepl", "notebooklm", "replit"]);
const advancedSlugs = new Set(["cursor", "windsurf", "n8n", "midjourney", "runway", "elicit", "figma-ai"]);

function experienceBoost(slug: string, level: ExperienceLevel) {
  if (level === "principiante" && beginnerSlugs.has(slug)) return 30;
  if (level === "avanzado" && advancedSlugs.has(slug)) return 30;
  return 0;
}

function matchingTools(query: string, catalog: AiTool[]) {
  const clean = query.toLocaleLowerCase("es");
  const category = findCategory(clean);
  const wantsFree = /gratis|gratuita|gratuito|sin pagar|sin costo|barata|barato/.test(clean);
  const base = category ? catalog.filter((tool) => tool.category === category) : catalog;
  const budget = wantsFree ? base.filter((tool) => tool.pricing !== "Pago") : base;
  const words = clean.split(/\s+/).filter((word) => word.length > 3);
  const related = budget.filter((tool) =>
    words.some((word) => `${tool.name} ${tool.description} ${tool.category} ${tool.useCases.join(" ")}`.toLowerCase().includes(word)),
  );
  const level = findExperienceLevel(clean);
  return (related.length >= 2 ? related : budget).sort((a, b) => (b.popularity + experienceBoost(b.slug, level)) - (a.popularity + experienceBoost(a.slug, level)));
}

function toolLine(tool: AiTool) {
  return `**${tool.name}** · ${tool.category} · ${tool.pricing}`;
}

export function getCatalogAnswer(question: string, catalog: AiTool[], history: EduAiMessage[] = []): EduAiAnswer {
  const cleanQuestion = question.trim().toLocaleLowerCase("es");
  const previousQuestion = [...history].reverse().find((message) => message.role === "user")?.content?.toLocaleLowerCase("es") ?? "";
  const refersToPrevious = /\b(esa|ese|esas|esos|la primera|la segunda|cu[aá]l de ellas|cu[aá]l de esos|y para principiantes|y para avanzados)\b/.test(cleanQuestion) || (!findCategory(cleanQuestion) && Boolean(findExperienceLevel(cleanQuestion)));
  const query = refersToPrevious && previousQuestion ? `${previousQuestion} ${cleanQuestion}` : cleanQuestion;
  if (!query) return { content: "Soy **Edu AI**. Cuéntame qué quieres crear o aprender y te ayudaré a elegir una herramienta.", recommendations: [], mode: "catalog" };

  if (/qu[ií]en eres|como te llamas|cu[aá]l es tu nombre|tu identidad/.test(query)) {
    return { content: "Soy **Edu AI**, tu guía educativa dentro de este directorio. Mi trabajo es ayudarte a descubrir, comparar y elegir herramientas de IA con respuestas claras y basadas en el catálogo. No soy una herramienta de terceros: esta es mi propia identidad y mi propósito aquí es orientarte.", recommendations: [], mode: "catalog" };
  }

  const mentioned = catalog.filter((tool) => query.includes(tool.name.toLocaleLowerCase("es")));
  if ((/compar|diferencia|versus| vs\.? /.test(query)) && mentioned.length >= 2) {
    const [first, second] = mentioned.slice(0, 2);
    return {
      content: `Claro. **${first.name}** es una opción de ${first.category.toLowerCase()} enfocada en ${first.useCases.slice(0, 2).join(" y ")}. **${second.name}** también pertenece a ${second.category.toLowerCase()} y destaca para ${second.useCases.slice(0, 2).join(" y ")}.\n\nSi buscas ${first.pros[0].toLocaleLowerCase("es")}, empezaría por ${first.name}; si tu prioridad es ${second.pros[0].toLocaleLowerCase("es")}, probaría ${second.name}. Revisa sus planes oficiales antes de decidir, porque cambian con frecuencia.`,
      recommendations: [first, second],
      mode: "catalog",
    };
  }

  const results = matchingTools(query, catalog);
  const category = findCategory(query);
  const wantsFree = /gratis|gratuita|gratuito|sin pagar|sin costo|barata|barato/.test(query);
  const picks = results.slice(0, 3);
  if (picks.length) {
    const level = findExperienceLevel(query);
    const scope = category ? `para **${category.toLowerCase()}**` : "según tu consulta";
    const budget = wantsFree ? " con opciones gratuitas o freemium" : "";
    const experience = level ? ` Para un nivel **${level}**, prioricé opciones con un flujo más adecuado a ese punto de partida.` : "";
    const details = picks.map((tool) => `- ${toolLine(tool)}: ideal para ${tool.useCases.slice(0, 2).join(" y ")}.`).join("\n");
    return {
      content: `Soy **Edu AI** y estas son mis recomendaciones ${scope}${budget}:${experience}\n\n${details}\n\nMi consejo: empieza por una opción ${wantsFree ? "gratuita o freemium" : "que se ajuste a tu flujo"}, prueba una tarea real y compárala con una segunda alternativa. ¿Quieres que las compare para un proyecto específico?`,
      recommendations: picks,
      mode: "catalog",
    };
  }

  const alternatives = [...catalog].sort((a, b) => priceRank[a.pricing] - priceRank[b.pricing] || b.popularity - a.popularity).slice(0, 3);
  return {
    content: "Soy **Edu AI**. Aún no encuentro una coincidencia suficientemente clara en el catálogo, pero puedo ayudarte si me dices tu objetivo, tu presupuesto y si tienes experiencia. Mientras tanto, estas opciones versátiles son un buen punto de partida.",
    recommendations: alternatives,
    mode: "catalog",
  };
}

export function createEduAiPayload(messages: EduAiMessage[], catalog: AiTool[]) {
  const compactCatalog = catalog.map(({ name, category, pricing, description, freePlan, useCases }) => ({ name, category, pricing, description, freePlan, useCases }));
  return {
    system: EDU_AI_SYSTEM_PROMPT,
    editorialKnowledge: EDU_AI_PROFILE.editorialKnowledge,
    messages: messages.filter((message) => message.role !== "system").slice(-8),
    catalog: compactCatalog,
  };
}
