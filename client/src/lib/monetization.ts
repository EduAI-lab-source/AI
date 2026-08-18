export const MONETIZATION_CONFIG = {
  analyticsProvider: "cloudflare-web-analytics",
  optionalAnalyticsEnabled: false,
  adsEnabled: false,
  adPublisherId: "ca-pub-5413784450478901",
} as const;

export type MonetizationPlacement = "studio" | "guides" | "footer";

export function canServeAdvertising() {
  return MONETIZATION_CONFIG.adsEnabled && Boolean(MONETIZATION_CONFIG.adPublisherId);
}

export function canLoadOptionalAnalytics() {
  return MONETIZATION_CONFIG.optionalAnalyticsEnabled;
}
