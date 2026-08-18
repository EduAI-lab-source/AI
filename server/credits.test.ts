import { describe, expect, it } from "vitest";
import { CREDIT_CHECKOUT_ENABLED, CREDIT_PACKAGES, getCreditReadiness } from "./credits";

describe("preparación de créditos", () => {
  it("mantiene los pagos y canjes desactivados hasta configurar un proveedor", () => {
    expect(CREDIT_CHECKOUT_ENABLED).toBe(false);
    expect(getCreditReadiness().checkoutEnabled).toBe(false);
  });

  it("publica paquetes expresados como créditos completos de mil caracteres", () => {
    expect(CREDIT_PACKAGES.map(item => item.credits)).toEqual([30, 60, 120]);
    expect(getCreditReadiness().unit).toBe("1 crédito = 1.000 caracteres de voz");
  });
});
