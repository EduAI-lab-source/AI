import { describe, expect, it } from "vitest";
import { getCatalogAnswer } from "./eduAi";
import { tools } from "../data/tools";

describe("Edu AI local catalog intelligence", () => {
  it("se presenta con identidad propia", () => {
    const answer = getCatalogAnswer("¿Quién eres y cómo te llamas?", tools);
    expect(answer.content).toContain("Edu AI");
    expect(answer.content).not.toContain("soy ChatGPT");
  });

  it("recomienda opciones gratis para diseño", () => {
    const answer = getCatalogAnswer("¿Cuál es la mejor IA gratis para diseño?", tools);
    expect(answer.recommendations.length).toBeGreaterThan(0);
    expect(answer.recommendations.every((tool) => tool.category === "Diseño")).toBe(true);
    expect(answer.recommendations.every((tool) => tool.pricing !== "Pago")).toBe(true);
  });

  it("compara dos herramientas nombradas", () => {
    const answer = getCatalogAnswer("Compara ChatGPT vs Claude", tools);
    expect(answer.content).toContain("ChatGPT");
    expect(answer.content).toContain("Claude");
    expect(answer.recommendations).toHaveLength(2);
  });

  it("usa la consulta anterior cuando la pregunta hace referencia a ella", () => {
    const answer = getCatalogAnswer("¿y cuál es más fácil para principiantes?", tools, [{ role: "user", content: "Necesito una IA para diseño" }]);
    expect(answer.recommendations.every((tool) => tool.category === "Diseño")).toBe(true);
    expect(answer.content).toContain("principiante");
  });
});
