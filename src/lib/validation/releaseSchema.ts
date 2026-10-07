import { z } from 'zod';

// ──────────────────────────────────────────────
// Release Package Zod schemas
// ──────────────────────────────────────────────
export const ReleaseItemInputSchema = z.object({
  text: z.string().min(1, 'Item text cannot be empty'),
});

export const ReleasePackageInputSchema = z.object({
  completedFeatures: z.array(z.string().min(1)).default([]),
  bugFixes: z.array(z.string().min(1)).default([]),
  changedBehaviour: z.array(z.string().min(1)).default([]),
  qaSummary: z.array(z.string().min(1)).default([]),
  knownLimitations: z.array(z.string().min(1)).default([]),
  migrationNotes: z.array(z.string().min(1)).default([]),
  affectedUserGroups: z.array(z.string().min(1)).default([]),
});

export const CreateReleaseSchema = z.object({
  version: z
    .string()
    .min(1, 'Version is required')
    .regex(/^\d+\.\d+\.\d+/, 'Version must follow semver format (e.g., 1.0.0)'),
  releasePackage: ReleasePackageInputSchema,
});

export type CreateReleaseInput = z.infer<typeof CreateReleaseSchema>;

// ──────────────────────────────────────────────
// Required field validation (deterministic)
// ──────────────────────────────────────────────
const REQUIRED_FIELDS: { key: keyof z.infer<typeof ReleasePackageInputSchema>; label: string }[] = [
  { key: 'completedFeatures', label: 'Completed Features' },
  { key: 'bugFixes', label: 'Bug Fixes' },
  { key: 'changedBehaviour', label: 'Changed Behaviour' },
  { key: 'qaSummary', label: 'QA Summary' },
  { key: 'knownLimitations', label: 'Known Limitations' },
  { key: 'migrationNotes', label: 'Migration / Configuration Notes' },
  { key: 'affectedUserGroups', label: 'Affected User Groups' },
];

export interface ValidationResult {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Deterministic required-field validation.
 * Never delegates to the LLM. Pure application logic.
 */
export function validateReleasePackage(
  pkg: z.infer<typeof ReleasePackageInputSchema>
): ValidationResult {
  const missingFields: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const value = pkg[field.key];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      missingFields.push(field.label);
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

// ──────────────────────────────────────────────
// Stable ID generation for release items
// ──────────────────────────────────────────────
type ItemPrefix =
  | 'FEATURE'
  | 'BUG'
  | 'BEHAVIOR'
  | 'QA'
  | 'LIMITATION'
  | 'MIGRATION'
  | 'USERGROUP';

export function generateItemId(prefix: ItemPrefix, index: number): string {
  return `${prefix}-${String(index + 1).padStart(3, '0')}`;
}

export function assignReleaseItemIds(pkg: z.infer<typeof ReleasePackageInputSchema>) {
  const now = new Date().toISOString();
  return {
    completedFeatures: pkg.completedFeatures.map((text, i) => ({
      id: generateItemId('FEATURE', i),
      text,
      createdAt: now,
    })),
    bugFixes: pkg.bugFixes.map((text, i) => ({
      id: generateItemId('BUG', i),
      text,
      createdAt: now,
    })),
    changedBehaviour: pkg.changedBehaviour.map((text, i) => ({
      id: generateItemId('BEHAVIOR', i),
      text,
      createdAt: now,
    })),
    qaSummary: pkg.qaSummary.map((text, i) => ({
      id: generateItemId('QA', i),
      text,
      createdAt: now,
    })),
    knownLimitations: pkg.knownLimitations.map((text, i) => ({
      id: generateItemId('LIMITATION', i),
      text,
      createdAt: now,
    })),
    migrationNotes: pkg.migrationNotes.map((text, i) => ({
      id: generateItemId('MIGRATION', i),
      text,
      createdAt: now,
    })),
    affectedUserGroups: pkg.affectedUserGroups.map((text, i) => ({
      id: generateItemId('USERGROUP', i),
      text,
      createdAt: now,
    })),
  };
}
