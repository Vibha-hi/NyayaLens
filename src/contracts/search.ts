import { z } from "zod";
import type { Precedent } from "@/data/precedents";

const LEGAL_CITATION_QUERY =
  /(?:\bAIR\s+(?:19|20)\d{2}\s+[A-Z]{1,12}\s+\d+\b|\(?\b(?:19|20)\d{2}\)?\s+(?:\d+\s+)?(?:SCC(?:\s+ON(?:LINE|L))?(?:\s+[A-Z]{1,12})?|SCR|INSC|Cri\.?\s*L\.?\s*J\.?)\s+\d+\b)/i;
const LEGAL_CASE_TITLE_QUERY =
  /\b[A-Z][A-Z0-9.&'()/-]*(?:\s+[A-Z][A-Z0-9.&'()/-]*){0,8}\s+(?:v\.?|vs\.?|versus)\s+[A-Z][A-Z0-9.&'()/-]*(?:\s+[A-Z][A-Z0-9.&'()/-]*){0,8}\b/i;

export function isExactLegalLookup(value: string): boolean {
  const cleaned = value.trim();
  return LEGAL_CITATION_QUERY.test(cleaned) || LEGAL_CASE_TITLE_QUERY.test(cleaned);
}

export function isSupportedSearchQuery(value: string): boolean {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return isExactLegalLookup(cleaned) || (cleaned.length >= 20 && cleaned.split(/\s+/).length >= 4);
}

export const searchFiltersSchema = z.object({
  court: z.enum(["All Courts", "Supreme Court", "High Court"]),
  year: z.union([z.literal("All Years"), z.string().regex(/^(19|20)\d{2}$/)]),
  outcome: z.enum([
    "Any Outcome",
    "Petitioner / Appellant side succeeded",
    "Respondent / State side succeeded",
    "Partial / mixed relief",
    "Remanded / no final winner",
  ]),
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
    "Succession / Inheritance",
    "Probate / Wills",
    "Tenancy / Rent Control",
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
  query: z
    .string()
    .trim()
    .min(5, "Enter a case title, citation, or a fuller description.")
    .max(4000)
    .refine(isSupportedSearchQuery, {
      message:
        "Enter a recognized case title/citation, or describe at least four meaningful words and 20 characters.",
    }),
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
    caseSummary: z.string(),
    highlightPhrases: z.array(z.string()),
    outcome: z.string(),
    matterStatus: z.string(),
    trialStatus: z.string(),
    winner: z.string(),
    caseStage: z.string(),
    caseStageConfidence: z.enum(["High", "Medium", "Low"]),
    caseStageEvidence: z.string(),
    outcomeRelief: z.string(),
    outcomeEvidence: z.string(),
    relevanceBasis: z.array(z.string()),
    authorityScore: z.number().nonnegative(),
    authorityBasis: z.array(z.string()),
    benchStrength: z.string(),
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
    // Transparent reranking penalties can make this signed score negative; it
    // is an ordering trace, not a confidence or probability value.
    retrievalScore: z.number(),
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
