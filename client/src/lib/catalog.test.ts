import { describe, expect, it } from "vitest";
import { tools } from "@/data/tools";
import { filterTools, getToolBySlug } from "./catalog";

const baseFilters = { query: "", category: "Todas" as const, pricing: "Todos" as const, sort: "popularidad" as const };

describe("lógica del catálogo", () => {
  it("busca por nombre, descripción y categoría", () => {
    expect(filterTools(tools, { ...baseFilters, query: "ChatGPT" }).map((tool) => tool.slug)).toContain("chatgpt");
    expect(filterTools(tools, { ...baseFilters, query: "automatización" }).every((tool) => tool.category === "Automatización")).toBe(true);
    expect(filterTools(tools, { ...baseFilters, query: "presentaciones" }).length).toBeGreaterThan(0);
  });

  it("combina filtros de categoría y precio", () => {
    const results = filterTools(tools, { ...baseFilters, category: "Diseño", pricing: "Freemium" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((tool) => tool.category === "Diseño" && tool.pricing === "Freemium")).toBe(true);
  });

  it("ordena por nombre, categoría, precio y popularidad", () => {
    const byName = filterTools(tools, { ...baseFilters, sort: "nombre" });
    const byCategory = filterTools(tools, { ...baseFilters, sort: "categoria" });
    const byPrice = filterTools(tools, { ...baseFilters, sort: "precio" });
    const byPopularity = filterTools(tools, baseFilters);
    expect(byName[0]?.name.localeCompare(byName[1]?.name ?? "", "es")).toBeLessThanOrEqual(0);
    expect(byCategory[0]?.category.localeCompare(byCategory[1]?.category ?? "", "es")).toBeLessThanOrEqual(0);
    expect(byPrice[0]?.pricing).toBe("Gratis");
    expect(byPopularity[0]?.popularity).toBeGreaterThanOrEqual(byPopularity[1]?.popularity ?? 0);
  });

  it("encuentra la ficha individual por slug", () => {
    expect(getToolBySlug(tools, "chatgpt")?.officialUrl).toBe("https://chatgpt.com/");
    expect(getToolBySlug(tools, "herramienta-inexistente")).toBeUndefined();
  });
});
