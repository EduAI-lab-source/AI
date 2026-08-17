type RequestHeaders = Record<string, string | string[] | undefined>;

export function hasValidEduAiGateway(headers: RequestHeaders, configuredSecret?: string) {
  if (!configuredSecret) return true;
  const received = headers["x-gateway-secret"];
  const value = Array.isArray(received) ? received[0] : received;
  return value === configuredSecret;
}
