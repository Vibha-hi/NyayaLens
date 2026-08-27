import { z } from "zod";

export const graphRequestSchema = z.object({
  caseIds: z.array(z.string()).min(1).max(20),
});

export const graphNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  citation: z.string(),
  court: z.string(),
  year: z.string(),
  category: z.string(),
  isResult: z.boolean(),
  availableInCorpus: z.boolean(),
  sourceUrl: z.string().url().nullable(),
});

export const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.enum(["cites", "statute"]),
  label: z.string(),
  evidence: z.string(),
});

export const graphResponseSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  citationEdgeCount: z.number().int().nonnegative(),
  statuteEdgeCount: z.number().int().nonnegative(),
  relatedCaseCount: z.number().int().nonnegative(),
  resolvedRelatedCaseCount: z.number().int().nonnegative(),
  unresolvedRelatedCaseCount: z.number().int().nonnegative(),
  omittedRelatedCaseCount: z.number().int().nonnegative(),
});

export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;
export type CaseGraphResponse = z.infer<typeof graphResponseSchema>;
