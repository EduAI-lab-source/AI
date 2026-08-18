export const TTS_MAX_CHARACTERS_PER_SYNTHESIS = 650;
export const TTS_DAILY_CHARACTERS_PER_VISITOR = 1_950;
export const TTS_DAILY_CHARACTERS_SHARED = 3_000;
export const TTS_DAILY_REQUESTS_PER_VISITOR = 3;
export const TTS_GLOBAL_USAGE_KEY = "global-free-tts-capacity";

export type TtsUsageCounters = {
  usedCharacters: number;
  requests: number;
};

export type TtsQuotaDecision =
  | { allowed: true; visitor: TtsUsageCounters; global: TtsUsageCounters; remainingVisitorCharacters: number; remainingGlobalCharacters: number }
  | { allowed: false; reason: "visitor_characters" | "visitor_requests" | "shared_capacity" };

export function evaluateTtsQuota(input: {
  requestedCharacters: number;
  visitor: TtsUsageCounters;
  global: TtsUsageCounters;
}): TtsQuotaDecision {
  const { requestedCharacters, visitor, global } = input;

  if (!Number.isInteger(requestedCharacters) || requestedCharacters < 1 || requestedCharacters > TTS_MAX_CHARACTERS_PER_SYNTHESIS) {
    return { allowed: false, reason: "visitor_characters" };
  }
  if (visitor.requests + 1 > TTS_DAILY_REQUESTS_PER_VISITOR) {
    return { allowed: false, reason: "visitor_requests" };
  }
  if (visitor.usedCharacters + requestedCharacters > TTS_DAILY_CHARACTERS_PER_VISITOR) {
    return { allowed: false, reason: "visitor_characters" };
  }
  if (global.usedCharacters + requestedCharacters > TTS_DAILY_CHARACTERS_SHARED) {
    return { allowed: false, reason: "shared_capacity" };
  }

  const nextVisitor = { usedCharacters: visitor.usedCharacters + requestedCharacters, requests: visitor.requests + 1 };
  const nextGlobal = { usedCharacters: global.usedCharacters + requestedCharacters, requests: global.requests + 1 };
  return {
    allowed: true,
    visitor: nextVisitor,
    global: nextGlobal,
    remainingVisitorCharacters: TTS_DAILY_CHARACTERS_PER_VISITOR - nextVisitor.usedCharacters,
    remainingGlobalCharacters: TTS_DAILY_CHARACTERS_SHARED - nextGlobal.usedCharacters,
  };
}
