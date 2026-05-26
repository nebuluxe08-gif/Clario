import { Router, type IRouter } from "express";
import { eq, desc, avg } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  CreateDocumentBody,
  GetDocumentParams,
  DeleteDocumentParams,
  ListDocumentsResponse,
  GetDocumentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDoc(doc: { createdAt: Date | string; [key: string]: unknown }) {
  return { ...doc, createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt };
}

router.get("/documents", async (req, res): Promise<void> => {
  const docs = await db
    .select()
    .from(documentsTable)
    .orderBy(desc(documentsTable.createdAt));

  res.json(ListDocumentsResponse.parse(docs.map(serializeDoc)));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db
    .insert(documentsTable)
    .values({
      title: parsed.data.title,
      originalText: parsed.data.originalText,
      correctedText: parsed.data.correctedText,
      grammarScore: parsed.data.grammarScore,
      fluencyScore: parsed.data.fluencyScore,
      clarityScore: parsed.data.clarityScore,
      engagementScore: parsed.data.engagementScore,
      overallScore: parsed.data.overallScore,
      sourceType: parsed.data.sourceType,
      corrections: parsed.data.corrections ?? [],
    })
    .returning();

  res.status(201).json(GetDocumentResponse.parse(serializeDoc(doc)));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetDocumentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(GetDocumentResponse.parse(serializeDoc(doc)));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteDocumentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .delete(documentsTable)
    .where(eq(documentsTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
