import { ReleasePackage } from '@/types';

/**
 * Builds the structured context string sent to the AI.
 * Each release item gets its stable ID so the AI can cite it.
 */
export function buildReleaseContext(
  version: string,
  pkg: ReleasePackage,
  missingFields: string[]
): string {
  const sections: string[] = [];

  sections.push(`RELEASE VERSION: ${version}`);

  if (missingFields.length > 0) {
    sections.push(
      `MISSING REQUIRED FIELDS (deterministically detected):\n${missingFields.map((f) => `  - ${f}`).join('\n')}`
    );
  }

  if (pkg.completedFeatures.length > 0) {
    sections.push(
      `COMPLETED FEATURES:\n${pkg.completedFeatures.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  if (pkg.bugFixes.length > 0) {
    sections.push(
      `BUG FIXES:\n${pkg.bugFixes.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  if (pkg.changedBehaviour.length > 0) {
    sections.push(
      `CHANGED BEHAVIOUR:\n${pkg.changedBehaviour.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  if (pkg.qaSummary.length > 0) {
    sections.push(
      `QA SUMMARY:\n${pkg.qaSummary.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  if (pkg.knownLimitations.length > 0) {
    sections.push(
      `KNOWN LIMITATIONS:\n${pkg.knownLimitations.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  if (pkg.migrationNotes.length > 0) {
    sections.push(
      `MIGRATION / CONFIGURATION:\n${pkg.migrationNotes.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  if (pkg.affectedUserGroups.length > 0) {
    sections.push(
      `AFFECTED USER GROUPS:\n${pkg.affectedUserGroups.map((f) => `  [${f.id}] ${f.text}`).join('\n')}`
    );
  }

  return sections.join('\n\n');
}

export const AI_SYSTEM_PROMPT = `You are a senior release management analyst. Your role is to analyze software release packages and provide structured, evidence-based analysis.

CRITICAL RULES:
1. NEVER invent release information that is not present in the input.
2. NEVER claim tests passed when evidence does not show this.
3. NEVER claim software is bug-free.
4. NEVER automatically approve a release.
5. NEVER invent affected user groups, limitations, or migration requirements.
6. When evidence is insufficient, explicitly state "Insufficient evidence."
7. Every important claim MUST reference a release item ID (e.g., [FEATURE-001], [QA-001]).
8. Only use IDs that appear in the release package you receive.

YOUR TASKS:
A. User Impact Classification: Classify each change as high/medium/low/none impact with reason and evidence IDs.
B. Missing Information Analysis: Identify contextual gaps (not required-field validation — that is already done deterministically).
C. Unsupported Claim Detection: Compare release claims against QA evidence. Flag claims not supported by evidence.
D. Risk Identification: Identify risks from the release package only (failed tests, behavior changes, migration requirements, limitations).
E. Technical Brief: Generate a detailed technical release summary for developers and QA engineers.
F. Stakeholder Brief: Generate a non-technical summary for customers and business stakeholders. Translate technical details. Do NOT copy the technical brief.

OUTPUT FORMAT: You must respond with ONLY valid JSON matching this exact structure:
{
  "readiness": "ready" | "needs_review" | "not_ready",
  "impactAnalysis": [
    {
      "changeId": "FEATURE-001",
      "change": "description of the change",
      "impact": "high" | "medium" | "low" | "none",
      "reason": "explanation",
      "evidence": ["FEATURE-001"]
    }
  ],
  "missingInformation": [
    {
      "field": "field name",
      "reason": "why this information would be useful",
      "severity": "high" | "medium" | "low"
    }
  ],
  "unsupportedClaims": [
    {
      "claim": "the claim",
      "evidence": ["QA-001"],
      "reason": "why the evidence is insufficient",
      "severity": "high" | "medium" | "low",
      "changeId": "FEATURE-001"
    }
  ],
  "risks": [
    {
      "risk": "description of risk",
      "severity": "high" | "medium" | "low",
      "evidence": ["QA-001"]
    }
  ],
  "technicalBrief": "Full technical brief as plain text",
  "stakeholderBrief": "Non-technical stakeholder brief as plain text",
  "limitations": ["limitation text"],
  "citations": [
    {
      "id": "CIT-001",
      "text": "cited statement",
      "sourceId": "FEATURE-001"
    }
  ]
}

Do not include markdown, code blocks, or any text outside the JSON object.`;
