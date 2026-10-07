import { z } from 'zod';

// ──────────────────────────────────────────────
// AI Response Schema — validated before use
// ──────────────────────────────────────────────

const ImpactLevelSchema = z.enum(['high', 'medium', 'low', 'none']);
const SeveritySchema = z.enum(['high', 'medium', 'low']);
const ReadinessSchema = z.enum(['ready', 'needs_review', 'not_ready']);

const ImpactAnalysisItemSchema = z.object({
  changeId: z.string(),
  change: z.string(),
  impact: ImpactLevelSchema,
  reason: z.string(),
  evidence: z.array(z.string()).default([]),
});

const MissingInfoItemSchema = z.object({
  field: z.string(),
  reason: z.string(),
  severity: SeveritySchema,
});

const UnsupportedClaimSchema = z.object({
  claim: z.string(),
  evidence: z.array(z.string()).default([]),
  reason: z.string(),
  severity: SeveritySchema,
  changeId: z.string().default(''),
});

const RiskItemSchema = z.object({
  risk: z.string(),
  severity: SeveritySchema,
  evidence: z.array(z.string()).default([]),
});

const CitationSchema = z.object({
  id: z.string(),
  text: z.string(),
  sourceId: z.string(),
});

export const AIResponseSchema = z.object({
  readiness: ReadinessSchema,
  impactAnalysis: z.array(ImpactAnalysisItemSchema).default([]),
  missingInformation: z.array(MissingInfoItemSchema).default([]),
  unsupportedClaims: z.array(UnsupportedClaimSchema).default([]),
  risks: z.array(RiskItemSchema).default([]),
  technicalBrief: z.string().min(1),
  stakeholderBrief: z.string().min(1),
  limitations: z.array(z.string()).default([]),
  citations: z.array(CitationSchema).default([]),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;

/**
 * Validates AI output. Returns { success: true, data } or { success: false, error }.
 * NEVER trusts raw AI output without this validation.
 */
export function validateAIResponse(raw: unknown):
  | { success: true; data: AIResponse }
  | { success: false; error: string } {
  const result = AIResponseSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: `AI response validation failed: ${result.error.message}`,
  };
}
