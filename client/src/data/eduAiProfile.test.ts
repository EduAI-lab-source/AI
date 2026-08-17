import { describe, expect, it } from "vitest";
import { EDU_AI_PROFILE } from "./eduAiProfile";

describe("Edu AI public profile", () => {
  it("keeps a warm Venezuelan-inspired voice without inventing a biography", () => {
    expect(EDU_AI_PROFILE.editorialKnowledge.join(" ")).toContain("sin usar estereotipos");
    expect(EDU_AI_PROFILE.rules.join(" ")).toContain("Nunca afirmes tener edad, ciudad de origen, familia, nacionalidad o vivencias humanas reales");
    expect(EDU_AI_PROFILE.rules.join(" ")).toContain("sin forzar modismos regionales");
  });
});
