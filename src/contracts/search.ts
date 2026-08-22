import { z } from "zod";
import type { Precedent } from "@/data/precedents";

export const searchFiltersSchema = z.object({
  court: z.enum(["All Courts", "Supreme Court", "High Court"]),
  year: z.union([z.literal("All Years"), z.string().regex(/^(19|20)\d{2}$/)]),
  issue: z.enum([
    "All Issues",
    "Regular Bail",
    "Anticipatory Bail",
    "Default Bail",
    "Prolonged Custody",
    "Documentary Evidence",
    "Witness Interference",
    "Flight Risk",
    "Criminal Law",
    "Constitutional Law",
    "Service Law",
    "Taxation",
    "Arbitration",
    "Property / Land",
    "Family / Matrimonial",
    "Motor Vehicles / Compensation",
    "Consumer Law",
    "Insolvency",
    "Environmental Law",
    "Narcotics / NDPS",
    "Economic Offences / PMLA",
    "Cheque Dishonour",
    "Civil Procedure",
    "Quashing of Criminal Proceedings",
    "Unclassified",
  ]),
});

export const searchRequestSchema = z.object({
  query: z.string().trim().min(20).max(4000),
  filters: searchFiltersSchema,
  topK: z.number().int().min(1).max(20).default(10),
});

const precedentSchema = z
  .object({
    id: z.string(),
    rank: z.number().int().positive(),
    title: z.string(),
    court: z.string().min(3),
    year: z.string(),
    category: z.string(),
    citation: z.string(),
    posture: z.string(),
    legalIssues: z.array(z.string()),
    filterIssues: z.array(z.string()),
    matchedEvidence: z.string(),
    highlightPhrases: z.array(z.string()),
    outcome: z.string(),
    whyItMatched: z.array(z.string()),
    explanation: z.object({
      sharedFacts: z.string(),
      sharedLegalIssues: z.string(),
      proceduralPosture: z.string(),
      matchingTerms: z.array(z.string()),
      relation: z.string(),
    }),
    sourceUrl: z.string().url(),
    evidenceLocator: z.object({ section: z.string(), paragraph: z.string() }),
    reasonCodes: z.array(z.string()),
    denseRank: z.number().int().positive().nullable().optional(),
    lexicalRank: z.number().int().positive().nullable().optional(),
    retrievalScore: z.number().nonnegative(),
  })
  .transform((value) => value as Precedent);

export const searchResponseSchema = z.object({
  runId: z.string(),
  corpusVersion: z.string(),
  modelVersion: z.string(),
  retrievalMethod: z.string(),
  extractedSignals: z.array(z.string()),
  latencyMs: z.number().int().nonnegative(),
  caseCount: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  results: z.array(precedentSchema),
});

export type SearchEngineResponse = z.infer<typeof searchResponseSchema>;
