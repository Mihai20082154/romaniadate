import { db } from "@workspace/db";
import { usersTable, notificationsTable, diamondTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getAgeCategory(age: number): "teen" | "adult" {
  return age >= 14 && age <= 17 ? "teen" : "adult";
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getRank(level: number): string {
  if (level <= 5) return "Beginner";
  if (level <= 15) return "Explorer";
  if (level <= 25) return "Romantic";
  if (level <= 35) return "Charmer";
  if (level <= 45) return "Heartbreaker";
  return "Legend";
}

export function getXpForLevel(level: number): number {
  return level * 100;
}

export async function awardDiamonds(
  userId: number,
  amount: number,
  reason: string
): Promise<void> {
  await db
    .update(usersTable)
    .set({
      diamonds: sql`diamonds + ${amount}`,
      totalDiamondsEarned: sql`total_diamonds_earned + ${amount}`,
    })
    .where(eq(usersTable.id, userId));

  await db.insert(diamondTransactionsTable).values({
    userId,
    amount,
    type: "earn",
    reason,
  });
}

export async function spendDiamonds(
  userId: number,
  amount: number,
  reason: string
): Promise<boolean> {
  const [user] = await db
    .select({ diamonds: usersTable.diamonds })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user || user.diamonds < amount) {
    return false;
  }

  await db
    .update(usersTable)
    .set({
      diamonds: sql`diamonds - ${amount}`,
      totalDiamondsSpent: sql`total_diamonds_spent + ${amount}`,
    })
    .where(eq(usersTable.id, userId));

  await db.insert(diamondTransactionsTable).values({
    userId,
    amount,
    type: "spend",
    reason,
  });

  return true;
}

export async function addXp(userId: number, xpAmount: number): Promise<void> {
  const [user] = await db
    .select({ xp: usersTable.xp, level: usersTable.level })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  if (!user) return;

  let newXp = user.xp + xpAmount;
  let newLevel = user.level;

  while (newLevel < 50 && newXp >= getXpForLevel(newLevel + 1)) {
    newXp -= getXpForLevel(newLevel + 1);
    newLevel++;
  }

  if (newLevel >= 50) { newLevel = 50; }

  const rank = getRank(newLevel);

  await db
    .update(usersTable)
    .set({ xp: newXp, level: newLevel, rank })
    .where(eq(usersTable.id, userId));
}

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  body: string,
  relatedId?: number
): Promise<void> {
  await db.insert(notificationsTable).values({
    userId,
    type,
    title,
    body,
    relatedId,
  });
}

export function formatUser(user: any) {
  const { passwordHash, ...safe } = user;
  return {
    ...safe,
    vipExpiresAt: user.vipExpiresAt ? user.vipExpiresAt.toISOString() : null,
    boostExpiresAt: user.boostExpiresAt ? user.boostExpiresAt.toISOString() : null,
    lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
    createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
    photos: user.photos || [],
    interests: user.interests || [],
  };
}

export function formatPublicUser(user: any) {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    ageCategory: user.ageCategory,
    gender: user.gender,
    city: user.city,
    bio: user.bio || null,
    photos: user.photos || [],
    interests: user.interests || [],
    isVerified: user.isVerified,
    isBoosted: user.isBoosted,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
    level: user.level,
    rank: user.rank || null,
  };
}
