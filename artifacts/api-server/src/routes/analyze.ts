import { Router, type IRouter } from "express";
import { AnalyzeTextBody } from "@workspace/api-zod";
import { analyzeText } from "../lib/analyzer";

const router: IRouter = Router();

router.post("/analyze", async (req, res): Promise<void> => {
  const parsed = AnalyzeTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const result = await analyzeText(parsed.data.text);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Analysis failed");
    res.status(500).json({ error: "Failed to analyze text" });
  }
});

export default router;
