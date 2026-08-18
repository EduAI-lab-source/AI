import { describe, expect, it } from "vitest";
import { MONETIZATION_CONFIG, canLoadOptionalAnalytics, canServeAdvertising } from "./monetization";

describe("configuración de monetización", () => {
  it("mantiene los anuncios inactivos hasta tener un editor aprobado", () => {
    expect(MONETIZATION_CONFIG.adsEnabled).toBe(false);
    expect(MONETIZATION_CONFIG.adPublisherId).toBeNull();
    expect(canServeAdvertising()).toBe(false);
  });

  it("no habilita analítica opcional sin una decisión de consentimiento", () => {
    expect(MONETIZATION_CONFIG.analyticsProvider).toBe("cloudflare-web-analytics");
    expect(canLoadOptionalAnalytics()).toBe(false);
  });
});
