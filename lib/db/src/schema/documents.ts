import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id"),
  title: text("title").notNull(),
  originalText: text("original_text").notNull(),
  correctedText: text("corrected_text").notNull(),
  grammarScore: integer("grammar_score").notNull(),
  fluencyScore: integer("fluency_score").notNull(),
  clarityScore: integer("clarity_score").notNull(),
  engagementScore: integer("engagement_score").notNull(),
  overallScore: integer("overall_score").notNull(),
  sourceType: text("source_type").notNull().default("text"),
  corrections: jsonb("corrections").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
