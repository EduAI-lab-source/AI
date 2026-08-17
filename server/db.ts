import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accountEncryptedWorkspaces, encryptedWorkspaces, InsertUser, sharedLearningLinks, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getEncryptedWorkspace(syncId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ ciphertext: encryptedWorkspaces.ciphertext, updatedAt: encryptedWorkspaces.updatedAt })
    .from(encryptedWorkspaces)
    .where(eq(encryptedWorkspaces.syncId, syncId))
    .limit(1);

  return result[0];
}

export async function saveEncryptedWorkspace(syncId: string, ciphertext: string) {
  const db = await getDb();
  if (!db) throw new Error("La sincronización privada no está disponible en este momento.");

  await db.insert(encryptedWorkspaces).values({ syncId, ciphertext }).onDuplicateKeyUpdate({
    set: { ciphertext, updatedAt: new Date() },
  });
}

export async function getAccountEncryptedWorkspace(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select({ ciphertext: accountEncryptedWorkspaces.ciphertext, updatedAt: accountEncryptedWorkspaces.updatedAt })
    .from(accountEncryptedWorkspaces)
    .where(eq(accountEncryptedWorkspaces.userId, userId))
    .limit(1);

  return result[0];
}

export async function saveAccountEncryptedWorkspace(userId: number, ciphertext: string) {
  const db = await getDb();
  if (!db) throw new Error("La sincronización de cuenta no está disponible en este momento.");

  await db.insert(accountEncryptedWorkspaces).values({ userId, ciphertext }).onDuplicateKeyUpdate({
    set: { ciphertext, updatedAt: new Date() },
  });
}

export async function createSharedLearningLink(input: { id: string; token: string; userId: number; kind: string; title: string; snapshot: string; expiresAt: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("La compartición no está disponible en este momento.");
  await db.insert(sharedLearningLinks).values(input);
}

export async function listSharedLearningLinks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: sharedLearningLinks.id, token: sharedLearningLinks.token, kind: sharedLearningLinks.kind, title: sharedLearningLinks.title, expiresAt: sharedLearningLinks.expiresAt, revokedAt: sharedLearningLinks.revokedAt, createdAt: sharedLearningLinks.createdAt }).from(sharedLearningLinks).where(eq(sharedLearningLinks.userId, userId));
}

export async function revokeSharedLearningLink(userId: number, id: string) {
  const db = await getDb();
  if (!db) throw new Error("La compartición no está disponible en este momento.");
  await db.update(sharedLearningLinks).set({ revokedAt: new Date() }).where(and(eq(sharedLearningLinks.id, id), eq(sharedLearningLinks.userId, userId)));
}

export async function getPublicSharedLearningLink(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({ kind: sharedLearningLinks.kind, title: sharedLearningLinks.title, snapshot: sharedLearningLinks.snapshot, expiresAt: sharedLearningLinks.expiresAt, revokedAt: sharedLearningLinks.revokedAt }).from(sharedLearningLinks).where(eq(sharedLearningLinks.token, token)).limit(1);
  const link = result[0];
  if (!link || link.revokedAt || (link.expiresAt && link.expiresAt.getTime() <= Date.now())) return undefined;
  return link;
}
