import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

interface Correction {
  original: string;
  corrected: string;
  explanation: string;
  type: "grammar" | "fluency" | "clarity" | "engagement" | "spelling";
}

interface AnalysisResult {
  correctedText: string;
  grammarScore: number;
  fluencyScore: number;
  clarityScore: number;
  engagementScore: number;
  overallScore: number;
  corrections: Correction[];
  summary: string;
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const prompt = `You are an expert writing editor and linguist. Analyze the following text and return a JSON response with corrections and scores.

Text to analyze:
"""
${text}
"""

Return ONLY valid JSON with this exact structure:
{
  "correctedText": "the fully corrected version of the text",
  "grammarScore": <integer 0-100>,
  "fluencyScore": <integer 0-100>,
  "clarityScore": <integer 0-100>,
  "engagementScore": <integer 0-100>,
  "overallScore": <integer 0-100>,
  "corrections": [
    {
      "original": "the original phrase with the issue",
      "corrected": "the corrected version",
      "explanation": "brief explanation of the correction",
      "type": "grammar" | "fluency" | "clarity" | "engagement" | "spelling"
    }
  ],
  "summary": "A 1-2 sentence summary of the overall writing quality and main improvements made."
}

Scoring guide:
- grammarScore: correctness of grammar, punctuation, spelling (100 = perfect)
- fluencyScore: how naturally and smoothly the text reads (100 = very natural)
- clarityScore: how clear and easy to understand the text is (100 = crystal clear)
- engagementScore: how engaging, interesting, and compelling the writing is (100 = very engaging)
- overallScore: weighted average of all four scores

List 3-8 of the most important corrections. If text is very short or already good, fewer corrections are fine.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: "You are an expert writing editor. Always respond with valid JSON only, no markdown code blocks.",
        },
        { role: "user", content: prompt },
      ],
      max_completion_tokens: 2048,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const result = JSON.parse(cleaned) as AnalysisResult;
    return result;
  } catch (err) {
    logger.error({ err }, "Failed to analyze text with OpenAI");
    throw new Error("Failed to analyze text");
  }
}
