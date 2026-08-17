import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Private collections used to organize a person's conversations. */
export const conversationFolders = mysqlTable("conversation_folders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  color: varchar("color", { length: 32 }).notNull().default("violet"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("conversation_folders_user_idx").on(table.userId),
]);

/** Synced thread metadata. Message text remains isolated by thread and owner. */
export const conversations = mysqlTable("conversations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  folderId: varchar("folderId", { length: 64 }),
  title: varchar("title", { length: 240 }).notNull(),
  preview: text("preview"),
  tags: json("tags").$type<string[]>().notNull(),
  isFavorite: boolean("isFavorite").notNull().default(false),
  isArchived: boolean("isArchived").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("conversations_owner_updated_idx").on(table.userId, table.updatedAt),
  index("conversations_folder_idx").on(table.folderId),
]);

/** Individual messages associated with an owned conversation. */
export const conversationMessages = mysqlTable("conversation_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("conversation_messages_thread_created_idx").on(table.conversationId, table.createdAt),
]);

/** Personal notes and saved learning material. */
export const learningNotes = mysqlTable("learning_notes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  conversationId: varchar("conversationId", { length: 64 }),
  title: varchar("title", { length: 240 }).notNull(),
  content: text("content").notNull(),
  tags: json("tags").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("learning_notes_owner_updated_idx").on(table.userId, table.updatedAt),
]);

/** Per-user choices that should follow the person across devices. */
export const userLearningPreferences = mysqlTable("user_learning_preferences", {
  userId: int("userId").primaryKey(),
  language: varchar("language", { length: 12 }).notNull().default("es"),
  responseStyle: varchar("responseStyle", { length: 24 }).notNull().default("deep"),
  weeklyGoal: int("weeklyGoal").notNull().default(4),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Daily learning activity supports streaks and weekly progress without profiling message contents. */
export const learningActivity = mysqlTable("learning_activity", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  activityDate: varchar("activityDate", { length: 10 }).notNull(),
  activityType: varchar("activityType", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("learning_activity_once_per_type_idx").on(table.userId, table.activityDate, table.activityType),
  index("learning_activity_owner_date_idx").on(table.userId, table.activityDate),
]);

/** File metadata lives in the database; original bytes live only in S3 storage. */
export const learningUploads = mysqlTable("learning_uploads", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("userId").notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  sizeBytes: int("sizeBytes").notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  storageUrl: varchar("storageUrl", { length: 512 }).notNull(),
  extractedText: text("extractedText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("learning_uploads_owner_created_idx").on(table.userId, table.createdAt),
]);

/** Revocable, tokenized snapshots avoid exposing private history by default. */
export const sharedLearningLinks = mysqlTable("shared_learning_links", {
  id: varchar("id", { length: 64 }).primaryKey(),
  token: varchar("token", { length: 96 }).notNull(),
  userId: int("userId").notNull(),
  kind: varchar("kind", { length: 32 }).notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  snapshot: text("snapshot").notNull(),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("shared_learning_links_token_idx").on(table.token),
  index("shared_learning_links_owner_created_idx").on(table.userId, table.createdAt),
]);

/** Client-encrypted workspace snapshots can be restored across devices with a private recovery key. */
export const encryptedWorkspaces = mysqlTable("encrypted_workspaces", {
  syncId: varchar("syncId", { length: 96 }).primaryKey(),
  ciphertext: text("ciphertext").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** One opaque workspace snapshot per authenticated account. The browser encrypts it before storage. */
export const accountEncryptedWorkspaces = mysqlTable("account_encrypted_workspaces", {
  userId: int("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConversationFolder = typeof conversationFolders.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ConversationMessageRow = typeof conversationMessages.$inferSelect;
export type LearningNote = typeof learningNotes.$inferSelect;
export type LearningUpload = typeof learningUploads.$inferSelect;
