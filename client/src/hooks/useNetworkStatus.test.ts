import { describe, expect, it } from "vitest";
import { getNetworkStatus } from "./useNetworkStatus";

describe("getNetworkStatus", () => {
  it("mantiene la interfaz disponible cuando no existe información del navegador", () => {
    expect(getNetworkStatus()).toBe(true);
  });

  it("identifica el estado de conexión reportado por el navegador", () => {
    expect(getNetworkStatus({ onLine: true })).toBe(true);
    expect(getNetworkStatus({ onLine: false })).toBe(false);
  });
});
