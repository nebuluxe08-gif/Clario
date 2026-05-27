import { Router, type IRouter } from "express";
import { eq, avg, count, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, profilesTable, documentsTable } from "@workspace/db";
import {
  UpdateProfileBody,
  GetProfileResponse,
  UpdateProfileResponse,
  GetStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeProfile(profile: {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: Date | string;
}) {
  return {
    ...profile,
    createdAt:
      profile.createdAt instanceof Date
        ? profile.createdAt.toISOString()
        : profile.createdAt,
  };
}

async function getOrCreateProfile(clerkId: string, seed?: { name?: string; email?: string; avatarUrl?: string | null }) {
  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkId, clerkId));

  if (existing) return existing;

  const [created] = await db
    .insert(profilesTable)
    .values({
      clerkId,
      name: seed?.name ?? "",
      email: seed?.email ?? "",
      avatarUrl: seed?.avatarUrl ?? null,
    })
    .returning();

  return created;
}

router.get("/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const profile = await getOrCreateProfile(userId);
  res.json(GetProfileResponse.parse(serializeProfile(profile)));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateProfile(userId);

  const [updated] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.clerkId, userId))
    .returning();

  res.json(UpdateProfileResponse.parse(serializeProfile(updated)));
});

router.post("/profile/sync", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { name, email, avatarUrl } = req.body as {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
  };

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkId, userId));

  if (!existing) {
    const [created] = await db
      .insert(profilesTable)
      .values({ clerkId: userId, name: name ?? "", email: email ?? "", avatarUrl: avatarUrl ?? null })
      .returning();
    res.json(serializeProfile(created));
    return;
  }

  const updates: Partial<typeof existing> = {};
  if (!existing.name && name) updates.name = name;
  if (!existing.email && email) updates.email = email;
  if (!existing.avatarUrl && avatarUrl) updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length > 0) {
    const [updated] = await db
      .update(profilesTable)
      .set(updates)
      .where(eq(profilesTable.clerkId, userId))
      .returning();
    res.json(serializeProfile(updated));
    return;
  }

  res.json(serializeProfile(existing));
});

router.get("/stats", async (req, res): Promise<void> => {
  const { userId } = getAuth(req);

  const whereClause = userId ? eq(documentsTable.clerkId, userId) : undefined;

  const [aggregates] = await db
    .select({
      totalDocuments: count(documentsTable.id),
      avgGrammarScore: avg(documentsTable.grammarScore),
      avgFluencyScore: avg(documentsTable.fluencyScore),
      avgClarityScore: avg(documentsTable.clarityScore),
      avgEngagementScore: avg(documentsTable.engagementScore),
      avgOverallScore: avg(documentsTable.overallScore),
    })
    .from(documentsTable)
    .$dynamic()
    .where(whereClause);

  const recentDocs = await db
    .select()
    .from(documentsTable)
    .where(whereClause)
    .orderBy(desc(documentsTable.createdAt))
    .limit(5);

  const stats = {
    totalDocuments: aggregates?.totalDocuments ?? 0,
    avgGrammarScore: parseFloat(aggregates?.avgGrammarScore ?? "0"),
    avgFluencyScore: parseFloat(aggregates?.avgFluencyScore ?? "0"),
    avgClarityScore: parseFloat(aggregates?.avgClarityScore ?? "0"),
    avgEngagementScore: parseFloat(aggregates?.avgEngagementScore ?? "0"),
    avgOverallScore: parseFloat(aggregates?.avgOverallScore ?? "0"),
    recentDocuments: recentDocs,
  };

  res.json(GetStatsResponse.parse(stats));
});

export default router;
