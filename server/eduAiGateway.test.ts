import { describe, expect, it } from "vitest";
import { hasValidEduAiGateway } from "./eduAiGateway";

describe("protección del gateway de Edu AI", () => {
  it("deniega la solicitud si falta la clave de configuración", () => {
    expect(hasValidEduAiGateway({}, undefined)).toBe(false);
  });

  it("acepta solo la clave compartida cuando se configura el gateway", () => {
    expect(hasValidEduAiGateway({ "x-gateway-secret": "clave-segura" }, "clave-segura")).toBe(true);
    expect(hasValidEduAiGateway({}, "clave-segura")).toBe(false);
    expect(hasValidEduAiGateway({ "x-gateway-secret": "otra-clave" }, "clave-segura")).toBe(false);
  });
});
