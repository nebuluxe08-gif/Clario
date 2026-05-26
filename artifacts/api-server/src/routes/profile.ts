import { Router, type IRouter } from "express";
import { eq, avg, count, desc } from "drizzle-orm";
import { db, profilesTable, documentsTable } from "@workspace/db";
import {
  UpdateProfileBody,
  GetProfileResponse,
  UpdateProfileResponse,
  GetStatsResponse,
} from "@workspace/api-zod";

const DEFAULT_PROFILE_ID = 1;

async function ensureProfile() {
  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, DEFAULT_PROFILE_ID));

  if (!existing) {
    const [created] = await db
      .insert(profilesTable)
      .values({ name: "Clario User", email: "user@clario.app" })
      .returning();
    return created;
  }
  return existing;
}

const router: IRouter = Router();

router.get("/profile", async (req, res): Promise<void> => {
  const profile = await ensureProfile();
  res.json(GetProfileResponse.parse(profile));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureProfile();

  const [updated] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.id, DEFAULT_PROFILE_ID))
    .returning();

  res.json(UpdateProfileResponse.parse(updated));
});

router.get("/stats", async (req, res): Promise<void> => {
  const [aggregates] = await db
    .select({
      totalDocuments: count(documentsTable.id),
      avgGrammarScore: avg(documentsTable.grammarScore),
      avgFluencyScore: avg(documentsTable.fluencyScore),
      avgClarityScore: avg(documentsTable.clarityScore),
      avgEngagementScore: avg(documentsTable.engagementScore),
      avgOverallScore: avg(documentsTable.overallScore),
    })
    .from(documentsTable);

  const recentDocs = await db
    .select()
    .from(documentsTable)
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
