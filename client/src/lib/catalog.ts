import type { AiTool, Category, Pricing } from "@/data/tools";

export type CatalogSort = "popularidad" | "nombre" | "categoria" | "precio";

export type CatalogQuery = {
  query: string;
  category: Category | "Todas";
  pricing: Pricing | "Todos";
  sort: CatalogSort;
};

const priceOrder: Record<Pricing, number> = { Gratis: 0, Freemium: 1, Pago: 2 };

export function filterTools(catalog: AiTool[], filters: CatalogQuery) {
  const normalized = filters.query.trim().toLocaleLowerCase("es");
  return catalog.filter((tool) => {
    const searchable = `${tool.name} ${tool.description} ${tool.category} ${tool.useCases.join(" ")}`.toLocaleLowerCase("es");
    const matchesSearch = !normalized || searchable.includes(normalized);
    const matchesCategory = filters.category === "Todas" || tool.category === filters.category;
    const matchesPricing = filters.pricing === "Todos" || tool.pricing === filters.pricing;
    return matchesSearch && matchesCategory && matchesPricing;
  }).sort((a, b) => {
    if (filters.sort === "nombre") return a.name.localeCompare(b.name, "es");
    if (filters.sort === "categoria") return a.category.localeCompare(b.category, "es") || a.name.localeCompare(b.name, "es");
    if (filters.sort === "precio") return priceOrder[a.pricing] - priceOrder[b.pricing] || b.popularity - a.popularity;
    return b.popularity - a.popularity;
  });
}

export function getToolBySlug(catalog: AiTool[], slug: string) {
  return catalog.find((tool) => tool.slug === slug);
}
