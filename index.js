// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, inArray } from "drizzle-orm";

// drizzle/schema.ts
import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var conversationFolders = mysqlTable("conversation_folders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  color: varchar("color", { length: 32 }).notNull().default("violet"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [
  index("conversation_folders_user_idx").on(table.userId)
]);
var conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  folderId: varchar("folderId", { length: 64 }),
  title: varchar("title", { length: 240 }).notNull(),
  preview: text("preview"),
  tags: json("tags").$type().notNull(),
  isFavorite: boolean("isFavorite").notNull().default(false),
  isArchived: boolean("isArchived").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [
  index("conversations_owner_updated_idx").on(table.userId, table.updatedAt),
  index("conversations_folder_idx").on(table.folderId)
]);
var conversationMessages = mysqlTable("conversation_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  index("conversation_messages_thread_created_idx").on(table.conversationId, table.createdAt)
]);
var learningNotes = mysqlTable("learning_notes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  conversationId: varchar("conversationId", { length: 64 }),
  title: varchar("title", { length: 240 }).notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [
  index("learning_notes_owner_updated_idx").on(table.userId, table.updatedAt)
]);
var userLearningPreferences = mysqlTable("user_learning_preferences", {
  userId: int("userId").primaryKey(),
  language: varchar("language", { length: 12 }).notNull().default("es"),
  responseStyle: varchar("responseStyle", { length: 24 }).notNull().default("deep"),
  weeklyGoal: int("weeklyGoal").notNull().default(4),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var learningActivity = mysqlTable("learning_activity", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  activityDate: varchar("activityDate", { length: 10 }).notNull(),
  activityType: varchar("activityType", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  uniqueIndex("learning_activity_once_per_type_idx").on(table.userId, table.activityDate, table.activityType),
  index("learning_activity_owner_date_idx").on(table.userId, table.activityDate)
]);
var learningUploads = mysqlTable("learning_uploads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 512 }).notNull(),
  extractedText: text("extractedText"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  index("learning_uploads_owner_created_idx").on(table.userId, table.createdAt)
]);
var sharedLearningLinks = mysqlTable("shared_learning_links", {
  id: varchar("id", { length: 64 }).primaryKey(),
  token: varchar("token", { length: 96 }).notNull(),
  userId: int("userId").notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  snapshot: text("snapshot").notNull(),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  uniqueIndex("shared_learning_links_token_idx").on(table.token),
  index("shared_learning_links_owner_created_idx").on(table.userId, table.createdAt)
]);
var encryptedWorkspaces = mysqlTable("encrypted_workspaces", {
  syncId: varchar("syncId", { length: 96 }).primaryKey(),
  ciphertext: text("ciphertext").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var accountEncryptedWorkspaces = mysqlTable("account_encrypted_workspaces", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var ttsDailyUsage = mysqlTable("tts_daily_usage", {
  visitorHash: varchar("visitorHash", { length: 64 }).notNull(),
  usageDate: varchar("usageDate", { length: 10 }).notNull(),
  usedCharacters: int("usedCharacters").notNull().default(0),
  requests: int("requests").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
}, (table) => [
  uniqueIndex("tts_daily_usage_visitor_date_idx").on(table.visitorHash, table.usageDate),
  index("tts_daily_usage_date_idx").on(table.usageDate)
]);
var creditBalances = mysqlTable("credit_balances", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  availableCredits: int("availableCredits").notNull().default(0),
  pendingCredits: int("pendingCredits").notNull().default(0),
  lifetimePurchasedCredits: int("lifetimePurchasedCredits").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var creditLedger = mysqlTable("credit_ledger", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  change: int("change").notNull(),
  reason: varchar("reason", { length: 48 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "reversed"]).notNull().default("pending"),
  provider: varchar("provider", { length: 48 }),
  providerReference: varchar("providerReference", { length: 191 }),
  metadata: json("metadata").$type(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
}, (table) => [
  index("credit_ledger_user_created_idx").on(table.userId, table.createdAt),
  uniqueIndex("credit_ledger_provider_reference_idx").on(table.provider, table.providerReference)
]);

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/ttsQuota.ts
import { createHmac } from "node:crypto";
var TTS_MAX_CHARACTERS_PER_SYNTHESIS = 650;
var TTS_DAILY_CHARACTERS_PER_VISITOR = 650;
var TTS_DAILY_CHARACTERS_SHARED = 3e3;
var TTS_DAILY_REQUESTS_PER_VISITOR = 1;
var TTS_GLOBAL_USAGE_KEY = "global-free-tts-capacity";
function createTtsNetworkIdentity(clientIp, secret) {
  return createHmac("sha256", secret).update(`edu-ai-tts-network:${clientIp}`).digest("hex");
}
function evaluateTtsQuota(input) {
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
    remainingGlobalCharacters: TTS_DAILY_CHARACTERS_SHARED - nextGlobal.usedCharacters
  };
}

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getEncryptedWorkspace(syncId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select({ ciphertext: encryptedWorkspaces.ciphertext, updatedAt: encryptedWorkspaces.updatedAt }).from(encryptedWorkspaces).where(eq(encryptedWorkspaces.syncId, syncId)).limit(1);
  return result[0];
}
async function saveEncryptedWorkspace(syncId, ciphertext) {
  const db = await getDb();
  if (!db) throw new Error("La sincronizaci\xF3n privada no est\xE1 disponible en este momento.");
  await db.insert(encryptedWorkspaces).values({ syncId, ciphertext }).onDuplicateKeyUpdate({
    set: { ciphertext, updatedAt: /* @__PURE__ */ new Date() }
  });
}
async function getAccountEncryptedWorkspace(userId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select({ ciphertext: accountEncryptedWorkspaces.ciphertext, updatedAt: accountEncryptedWorkspaces.updatedAt }).from(accountEncryptedWorkspaces).where(eq(accountEncryptedWorkspaces.userId, userId)).limit(1);
  return result[0];
}
async function saveAccountEncryptedWorkspace(userId, ciphertext) {
  const db = await getDb();
  if (!db) throw new Error("La sincronizaci\xF3n de cuenta no est\xE1 disponible en este momento.");
  await db.insert(accountEncryptedWorkspaces).values({ userId, ciphertext }).onDuplicateKeyUpdate({
    set: { ciphertext, updatedAt: /* @__PURE__ */ new Date() }
  });
}
async function createSharedLearningLink(input) {
  const db = await getDb();
  if (!db) throw new Error("La compartici\xF3n no est\xE1 disponible en este momento.");
  await db.insert(sharedLearningLinks).values(input);
}
async function listSharedLearningLinks(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: sharedLearningLinks.id, token: sharedLearningLinks.token, kind: sharedLearningLinks.kind, title: sharedLearningLinks.title, expiresAt: sharedLearningLinks.expiresAt, revokedAt: sharedLearningLinks.revokedAt, createdAt: sharedLearningLinks.createdAt }).from(sharedLearningLinks).where(eq(sharedLearningLinks.userId, userId));
}
async function revokeSharedLearningLink(userId, id) {
  const db = await getDb();
  if (!db) throw new Error("La compartici\xF3n no est\xE1 disponible en este momento.");
  await db.update(sharedLearningLinks).set({ revokedAt: /* @__PURE__ */ new Date() }).where(and(eq(sharedLearningLinks.id, id), eq(sharedLearningLinks.userId, userId)));
}
async function getPublicSharedLearningLink(token) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select({ kind: sharedLearningLinks.kind, title: sharedLearningLinks.title, snapshot: sharedLearningLinks.snapshot, expiresAt: sharedLearningLinks.expiresAt, revokedAt: sharedLearningLinks.revokedAt }).from(sharedLearningLinks).where(eq(sharedLearningLinks.token, token)).limit(1);
  const link = result[0];
  if (!link || link.revokedAt || link.expiresAt && link.expiresAt.getTime() <= Date.now()) return void 0;
  return link;
}
async function reserveTtsQuota(input) {
  const db = await getDb();
  if (!db) throw new Error("La s\xEDntesis de voz no est\xE1 disponible en este momento.");
  const usageDate = (input.now ?? /* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return db.transaction(async (tx) => {
    const rows = await tx.select({ visitorHash: ttsDailyUsage.visitorHash, usedCharacters: ttsDailyUsage.usedCharacters, requests: ttsDailyUsage.requests }).from(ttsDailyUsage).where(and(eq(ttsDailyUsage.usageDate, usageDate), inArray(ttsDailyUsage.visitorHash, [TTS_GLOBAL_USAGE_KEY, input.visitorHash]))).for("update");
    const counters = new Map(rows.map((row) => [row.visitorHash, { usedCharacters: row.usedCharacters, requests: row.requests }]));
    const decision = evaluateTtsQuota({
      requestedCharacters: input.characters,
      visitor: counters.get(input.visitorHash) ?? { usedCharacters: 0, requests: 0 },
      global: counters.get(TTS_GLOBAL_USAGE_KEY) ?? { usedCharacters: 0, requests: 0 }
    });
    if (!decision.allowed) return decision;
    for (const [visitorHash, values] of [
      [TTS_GLOBAL_USAGE_KEY, decision.global],
      [input.visitorHash, decision.visitor]
    ]) {
      if (counters.has(visitorHash)) {
        await tx.update(ttsDailyUsage).set({ ...values, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(ttsDailyUsage.visitorHash, visitorHash), eq(ttsDailyUsage.usageDate, usageDate)));
      } else {
        await tx.insert(ttsDailyUsage).values({ visitorHash, usageDate, ...values });
      }
    }
    return decision;
  });
}
async function getCreditBalance(userId) {
  const db = await getDb();
  if (!db) return { availableCredits: 0, pendingCredits: 0, lifetimePurchasedCredits: 0 };
  const result = await db.select({
    availableCredits: creditBalances.availableCredits,
    pendingCredits: creditBalances.pendingCredits,
    lifetimePurchasedCredits: creditBalances.lifetimePurchasedCredits
  }).from(creditBalances).where(eq(creditBalances.userId, userId)).limit(1);
  return result[0] ?? { availableCredits: 0, pendingCredits: 0, lifetimePurchasedCredits: 0 };
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";

// server/eduAi.ts
var EDU_AI_SYSTEM_PROMPT = `Eres Edu AI, un asistente conversacional independiente creado para acompa\xF1ar a las personas a pensar, aprender, crear y resolver problemas. Tu nombre es Edu AI y esa es siempre tu identidad. Nunca afirmes ser ChatGPT, Claude, Gemini, Manus ni reveles o atribuyas tu identidad a un modelo subyacente.

Hablas en espa\xF1ol latinoamericano con una voz c\xE1lida, clara, curiosa, serena y atenta. Tu presencia est\xE1 inspirada en la cercan\xEDa respetuosa de un joven venezolano del oriente del pa\xEDs: conversas con sencillez, buena energ\xEDa y atenci\xF3n genuina. No afirmes tener una edad, ciudad, historia personal, familia, experiencias humanas ni nacionalidad reales; eres Edu AI. Evita estereotipos y no fuerces modismos. Si la persona usa un registro venezolano o caribe\xF1o, puedes acompa\xF1ar ese tono con naturalidad y moderaci\xF3n.

CONVERSA COMO ALGUIEN QUE EST\xC1 PRESTANDO ATENCI\xD3N. Antes de resolver, identifica en una frase breve la intenci\xF3n, duda o punto importante que la persona acaba de expresar, siempre que eso aporte claridad. Retoma detalles concretos de mensajes anteriores en vez de responder como si cada turno empezara de cero. No inventes emociones ni diagnostiques c\xF3mo se siente alguien: puedes decir \u201Cparece que est\xE1s intentando\u2026\u201D solo cuando el propio mensaje lo sustente.

S\xE9 cercano sin fingir ser humano. Usa lenguaje vivo y directo; evita aperturas vac\xEDas o repetidas como \u201C\xA1Claro!\u201D, \u201CComo IA\u2026\u201D o \u201CCon gusto te ayudo\u201D si no a\xF1aden valor. No repitas \u201Csoy Edu AI\u201D salvo al presentarte, cuando te pregunten por tu identidad o cuando sea natural para el contexto. Ofrece una idea \xFAtil antes de hacer una pregunta. Cuando necesites informaci\xF3n, formula una sola pregunta concreta y explica por qu\xE9 ayudar\xEDa. Si hay varias rutas v\xE1lidas, pres\xE9ntalas como opciones, no como \xF3rdenes.

Tu objetivo es ser \xFAtil de forma pr\xE1ctica: explicas con ejemplos, propones pasos realistas y reconoces con honestidad los l\xEDmites de lo que sabes. Responde en el idioma que use la persona. Mant\xE9n la misma calidez y claridad cuando escribas en ingl\xE9s o ruso, sin fingir una biograf\xEDa humana. Para preguntas simples, responde con naturalidad en pocas frases. Para tareas complejas, organiza la respuesta con t\xEDtulos cortos o pasos solo cuando realmente ayuden; alterna p\xE1rrafos claros con listas breves, no muros de vi\xF1etas. No termines cada respuesta con una pregunta autom\xE1tica; pregunta solo cuando sea \xFAtil para avanzar.

Edu AI no es un directorio ni un recomendador de otras inteligencias artificiales. No conviertas las conversaciones en comparativas o recomendaciones de otras IA, a menos que la persona lo solicite expresamente y sea indispensable para responder. No inventes hechos, experiencias, fuentes, capacidades, precios ni datos personales. Si una pregunta depende de informaci\xF3n cambiante o incierta, expl\xEDcalo con transparencia.

Si una persona pregunta qui\xE9n te cre\xF3 o qui\xE9n es tu creador, responde con naturalidad que Edu AI fue creado por Eduardo, un joven venezolano de 26 a\xF1os y experto en programaci\xF3n e ingenier\xEDa web. Esta descripci\xF3n se refiere a tu creador; no la presentes como una biograf\xEDa propia ni inventes datos adicionales sobre Eduardo.

Si preguntan qu\xE9 tan bueno es Eduardo jugando Warframe, responde con un tono l\xFAdico, seguro y bien escrito: Eduardo es un pro en Warframe, especialmente usando Khora y Wukong; probablemente de los jugadores m\xE1s pro que encontrar\xE1s, y no por nada cre\xF3 Edu AI. Pres\xE9ntalo como un gui\xF1o de orgullo, no como un ranking oficial ni como una afirmaci\xF3n verificable sobre el juego.

Cuando una pregunta casual trate sobre secretos, estilo o talentos de Eduardo, puedes a\xF1adir de forma ocasional un gui\xF1o breve: su superpoder es convertir una idea en una experiencia web cuidada, y tiene la paciencia de quien domina a Khora y Wukong. Si alguien elogia a Edu AI, puedes responder con calidez que el proyecto naci\xF3 de esa mezcla de ingenier\xEDa web, atenci\xF3n por los detalles y creatividad. No conviertas estos gui\xF1os en una biograf\xEDa extensa ni los introduzcas si no son relevantes para la pregunta.`;
var MAX_HISTORY_MESSAGES = 18;
var MAX_MESSAGE_CHARACTERS = 6e3;
function buildEduAiMessages(messages, responseStyle = "deep", imageAttachment) {
  const recent = messages.filter((message) => message.content.trim().length > 0).slice(-MAX_HISTORY_MESSAGES);
  const lastUserIndex = imageAttachment ? recent.map((message) => message.role).lastIndexOf("user") : -1;
  const recentMessages = recent.map((message, index2) => ({
    role: message.role,
    content: index2 === lastUserIndex ? [
      { type: "text", text: `${message.content.trim().slice(0, MAX_MESSAGE_CHARACTERS)}

La persona adjunt\xF3 la imagen \xAB${imageAttachment?.name ?? "imagen"}\xBB. Obs\xE9rvala con atenci\xF3n y responde sobre lo que se ve.` },
      { type: "image_url", image_url: { url: imageAttachment?.dataUrl ?? "", detail: "auto" } }
    ] : message.content.trim().slice(0, MAX_MESSAGE_CHARACTERS)
  }));
  const styleInstruction = {
    brief: "Para esta respuesta, prioriza lo esencial: responde en dos a cinco frases claras y accionables, sin perder cercan\xEDa.",
    deep: "Para esta respuesta, explica con profundidad amable: ordena el razonamiento, reconoce matices y evita extenderte sin necesidad.",
    creative: "Para esta respuesta, explora posibilidades con imaginaci\xF3n pr\xE1ctica: desarrolla una direcci\xF3n que se sienta espec\xEDfica para la idea de la persona, manteniendo los hechos y l\xEDmites claros.",
    study: "Para esta respuesta, acompa\xF1a como un buen tutor: parte de lo esencial, conecta con lo que la persona ya entiende, incluye una pr\xE1ctica breve y una manera de comprobar comprensi\xF3n."
  };
  return [{ role: "system", content: `${EDU_AI_SYSTEM_PROMPT}

${styleInstruction[responseStyle]}` }, ...recentMessages];
}
function getTextResponse(content) {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) {
    return content.type === "text" ? content.text.trim() : "";
  }
  return content.filter(
    (part) => typeof part === "object" && part.type === "text"
  ).map((part) => part.text).join("\n").trim();
}

// server/eduAiGateway.ts
function hasValidEduAiGateway(headers, configuredSecret) {
  if (!configuredSecret) return false;
  const received = headers["x-gateway-secret"];
  const value = Array.isArray(received) ? received[0] : received;
  return value === configuredSecret;
}

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
var assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
var RETRY_MAX_RETRIES = 4;
var RETRY_BASE_DELAY_MS = 500;
var RETRY_MAX_DELAY_MS = 3e4;
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var parseRetryAfter = (value) => {
  if (!value) return void 0;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1e3);
  const at = Date.parse(value);
  return Number.isNaN(at) ? void 0 : Math.max(0, at - Date.now());
};
var computeBackoffDelay = (attempt, retryAfterMs) => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};
var fetchWithBackoff = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) {
        return response;
      }
      const retryAfterMs = parseRetryAfter(
        response.headers.get("retry-after")
      );
      try {
        await response.body?.cancel();
      } catch {
      }
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`
      );
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(
        `LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`
      );
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens
  } = params;
  const payload = {
    messages: messages.map(normalizeMessage)
  };
  if (model) {
    payload.model = model;
  }
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  const resolvedMaxTokens = max_tokens ?? maxTokens;
  if (typeof resolvedMaxTokens === "number") {
    payload.max_tokens = resolvedMaxTokens;
  }
  if (thinking) {
    payload.thinking = thinking;
  }
  if (reasoning) {
    payload.reasoning = reasoning;
  }
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetchWithBackoff(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { randomBytes, randomUUID } from "node:crypto";

// server/credits.ts
var CREDIT_CHECKOUT_ENABLED = false;
var CREDIT_PACKAGES = [
  { id: "voice-30", credits: 30, label: "30.000 caracteres de voz" },
  { id: "voice-60", credits: 60, label: "60.000 caracteres de voz" },
  { id: "voice-120", credits: 120, label: "120.000 caracteres de voz" }
];
function getCreditReadiness() {
  return {
    checkoutEnabled: CREDIT_CHECKOUT_ENABLED,
    unit: "1 cr\xE9dito = 1.000 caracteres de voz",
    packages: CREDIT_PACKAGES,
    message: "Los cr\xE9ditos est\xE1n en preparaci\xF3n. No hay cobros ni canjes activos."
  };
}

// server/routers.ts
var REQUEST_LIMIT = 18;
var REQUEST_WINDOW_MS = 5 * 60 * 1e3;
var requestWindows = /* @__PURE__ */ new Map();
function assertRateLimit(request) {
  const forwarded = request.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  const key = forwardedIp?.trim() || request.ip || "anonymous";
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || current.resetAt <= now) {
    requestWindows.set(key, { count: 1, resetAt: now + REQUEST_WINDOW_MS });
    return;
  }
  if (current.count >= REQUEST_LIMIT) {
    throw new TRPCError3({
      code: "TOO_MANY_REQUESTS",
      message: "Edu AI est\xE1 recibiendo muchas preguntas. Espera unos minutos antes de continuar."
    });
  }
  current.count += 1;
}
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  eduAi: router({
    chat: publicProcedure.input(
      z2.object({
        messages: z2.array(
          z2.object({
            role: z2.enum(["user", "assistant"]),
            content: z2.string().trim().min(1).max(6e3)
          })
        ).min(1).max(20),
        responseStyle: z2.enum(["brief", "deep", "creative", "study"]).optional(),
        imageAttachment: z2.object({
          name: z2.string().trim().min(1).max(120),
          dataUrl: z2.string().max(34e5).regex(/^data:image\/(png|jpeg|webp|gif);base64,/, "La imagen adjunta debe ser un formato compatible.")
        }).optional()
      })
    ).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "La puerta segura de Edu AI no autoriz\xF3 esta solicitud."
        });
      }
      assertRateLimit(ctx.req);
      try {
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: buildEduAiMessages(input.messages, input.responseStyle, input.imageAttachment)
        });
        const content = getTextResponse(response.choices[0]?.message.content ?? "");
        if (!content) {
          throw new Error("El modelo no devolvi\xF3 una respuesta de texto");
        }
        return { content };
      } catch (error) {
        console.error("[Edu AI] Chat request failed", error);
        if (error instanceof TRPCError3) throw error;
        throw new TRPCError3({
          code: "INTERNAL_SERVER_ERROR",
          message: "Edu AI no pudo responder en este momento. Int\xE9ntalo de nuevo en unos segundos."
        });
      }
    })
  }),
  tts: router({
    reserve: publicProcedure.input(z2.object({
      visitorId: z2.string().uuid(),
      characters: z2.number().int().min(1).max(TTS_MAX_CHARACTERS_PER_SYNTHESIS)
    })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
        throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la s\xEDntesis de voz." });
      }
      const forwarded = ctx.req.headers["x-forwarded-for"];
      const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
      const clientIp = forwardedIp?.trim() ?? ctx.req.ip ?? "anonymous";
      const visitorHash = createTtsNetworkIdentity(clientIp, process.env.EDU_AI_GATEWAY_SECRET ?? "tts-fallback-secret");
      try {
        const decision = await reserveTtsQuota({ visitorHash, characters: input.characters });
        if (!decision.allowed) {
          const messages = {
            visitor_requests: "Ya usaste el audio gratuito disponible hoy. Vuelve ma\xF1ana para continuar.",
            visitor_characters: "El texto supera tu cuota diaria de voz. Prueba con un fragmento m\xE1s corto o vuelve ma\xF1ana.",
            shared_capacity: "La capacidad gratuita de voz de hoy ya se agot\xF3. Vuelve a intentarlo ma\xF1ana."
          };
          throw new TRPCError3({ code: "TOO_MANY_REQUESTS", message: messages[decision.reason] });
        }
        return { allowed: true, remainingCharacters: decision.remainingVisitorCharacters, remainingSharedCharacters: decision.remainingGlobalCharacters };
      } catch (error) {
        if (error instanceof TRPCError3) throw error;
        console.error("[TTS] Failed to reserve capacity", error);
        throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "La voz de Edu AI no est\xE1 disponible en este momento." });
      }
    })
  }),
  credits: router({
    readiness: publicProcedure.query(() => getCreditReadiness()),
    account: protectedProcedure.query(async ({ ctx }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
        throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la consulta de cr\xE9ditos." });
      }
      const balance = await getCreditBalance(ctx.user.id);
      return { ...getCreditReadiness(), balance };
    })
  }),
  workspace: router({
    sync: publicProcedure.input(z2.object({
      action: z2.enum(["get", "put"]),
      syncId: z2.string().regex(/^[A-Za-z0-9_-]{32,96}$/, "El identificador de sincronizaci\xF3n no es v\xE1lido."),
      ciphertext: z2.string().min(32).max(15e5).optional()
    })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
        throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la sincronizaci\xF3n." });
      }
      assertRateLimit(ctx.req);
      if (input.action === "get") {
        const workspace = await getEncryptedWorkspace(input.syncId);
        return {
          found: Boolean(workspace),
          ciphertext: workspace?.ciphertext ?? null,
          updatedAt: workspace?.updatedAt?.toISOString() ?? null
        };
      }
      if (!input.ciphertext) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Falta la instant\xE1nea cifrada para sincronizar." });
      }
      await saveEncryptedWorkspace(input.syncId, input.ciphertext);
      return { saved: true, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    }),
    accountSync: protectedProcedure.input(z2.object({
      action: z2.enum(["get", "put"]),
      ciphertext: z2.string().min(32).max(15e5).optional()
    })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) {
        throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la sincronizaci\xF3n de cuenta." });
      }
      if (input.action === "get") {
        const workspace = await getAccountEncryptedWorkspace(ctx.user.id);
        return { found: Boolean(workspace), ciphertext: workspace?.ciphertext ?? null, updatedAt: workspace?.updatedAt?.toISOString() ?? null };
      }
      if (!input.ciphertext) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Falta la instant\xE1nea cifrada para sincronizar." });
      }
      await saveAccountEncryptedWorkspace(ctx.user.id, input.ciphertext);
      return { saved: true, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    })
  }),
  sharing: router({
    create: protectedProcedure.input(z2.object({ title: z2.string().trim().min(1).max(160), snapshot: z2.string().min(2).max(25e4), expiresInDays: z2.number().int().min(1).max(30) })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la compartici\xF3n." });
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + input.expiresInDays * 864e5);
      await createSharedLearningLink({ id: randomUUID(), token, userId: ctx.user.id, kind: "notebook", title: input.title, snapshot: input.snapshot, expiresAt });
      return { token, expiresAt: expiresAt.toISOString() };
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la compartici\xF3n." });
      return listSharedLearningLinks(ctx.user.id);
    }),
    revoke: protectedProcedure.input(z2.object({ id: z2.string().uuid() })).mutation(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la compartici\xF3n." });
      await revokeSharedLearningLink(ctx.user.id, input.id);
      return { revoked: true };
    }),
    get: publicProcedure.input(z2.object({ token: z2.string().regex(/^[A-Za-z0-9_-]{32,96}$/) })).query(async ({ ctx, input }) => {
      if (!hasValidEduAiGateway(ctx.req.headers, process.env.EDU_AI_GATEWAY_SECRET)) throw new TRPCError3({ code: "FORBIDDEN", message: "La puerta segura de Edu AI no autoriz\xF3 la consulta compartida." });
      const link = await getPublicSharedLearningLink(input.token);
      if (!link) throw new TRPCError3({ code: "NOT_FOUND", message: "Este enlace no est\xE1 disponible o ya venci\xF3." });
      return { kind: link.kind, title: link.title, snapshot: link.snapshot, expiresAt: link.expiresAt?.toISOString() ?? null };
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    reportCompressedSize: false
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use("/api/trpc", (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "https://eduai-lab-source.github.io",
      process.env.EDU_AI_ALLOWED_ORIGIN
    ].filter((value) => Boolean(value));
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
