import { ReleasePackage, ComparisonResult, ComparisonDiff, StaleStatement } from '@/types';

type PackageField = keyof ReleasePackage;

const SECTION_LABELS: Record<PackageField, string> = {
  completedFeatures: 'Completed Features',
  bugFixes: 'Bug Fixes',
  changedBehaviour: 'Changed Behaviour',
  qaSummary: 'QA Summary',
  knownLimitations: 'Known Limitations',
  migrationNotes: 'Migration / Configuration',
  affectedUserGroups: 'Affected User Groups',
};

/**
 * Deterministic comparison of two release packages.
 * Does NOT use LLM for comparison — pure application logic.
 */
export function compareReleases(
  packageA: ReleasePackage,
  packageB: ReleasePackage,
  versionA: string,
  versionB: string
): ComparisonResult {
  const added: ComparisonDiff[] = [];
  const removed: ComparisonDiff[] = [];
  const changed: ComparisonDiff[] = [];

  const fields = Object.keys(SECTION_LABELS) as PackageField[];

  for (const field of fields) {
    const itemsA = packageA[field];
    const itemsB = packageB[field];

    const textsA = new Map(itemsA.map((item) => [item.text.toLowerCase().trim(), item]));
    const textsB = new Map(itemsB.map((item) => [item.text.toLowerCase().trim(), item]));

    // Items in B not in A → Added
    for (const [textKey, itemB] of textsB) {
      if (!textsA.has(textKey)) {
        added.push({
          type: 'added',
          field: SECTION_LABELS[field],
          itemId: itemB.id,
          text: itemB.text,
        });
      }
    }

    // Items in A not in B → Removed
    for (const [textKey, itemA] of textsA) {
      if (!textsB.has(textKey)) {
        removed.push({
          type: 'removed',
          field: SECTION_LABELS[field],
          itemId: itemA.id,
          text: itemA.text,
        });
      }
    }
  }

  return {
    added,
    removed,
    changed,
    qaChanges: {
      versionA,
      versionB,
      summaryA: packageA.qaSummary.map((i) => i.text),
      summaryB: packageB.qaSummary.map((i) => i.text),
    },
    staleStatements: detectStaleStatements(packageA, packageB, versionA),
  };
}

/**
 * Stale statement detection — purely deterministic.
 * Identifies statements from versionA that are contradicted by versionB.
 */
export function detectStaleStatements(
  packageA: ReleasePackage,
  packageB: ReleasePackage,
  versionA: string
): StaleStatement[] {
  const stale: StaleStatement[] = [];

  // Check known limitations for changes
  for (const limitA of packageA.knownLimitations) {
    for (const limitB of packageB.knownLimitations) {
      const isSameTopicButChanged =
        limitA.text !== limitB.text &&
        limitA.text.toLowerCase().split(' ').some((word) =>
          word.length > 4 && limitB.text.toLowerCase().includes(word)
        );

      if (isSameTopicButChanged) {
        stale.push({
          previousReleaseId: versionA,
          previousVersion: versionA,
          statement: limitA.text,
          statementId: limitA.id,
          reason: `This limitation statement may have changed. New version states: "${limitB.text}"`,
          newEvidenceIds: [limitB.id],
        });
      }
    }
  }

  // Check features: if versionA says something "is not available" but versionB adds it
  const featureTextsB = packageB.completedFeatures.map((f) => f.text.toLowerCase());
  for (const item of [...packageA.knownLimitations, ...packageA.changedBehaviour]) {
    for (const featureB of featureTextsB) {
      const keywords = item.text
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 4);
      const isReferenced = keywords.some((kw) => featureB.includes(kw));
      const isNegative =
        item.text.toLowerCase().includes('not available') ||
        item.text.toLowerCase().includes('not supported') ||
        item.text.toLowerCase().includes('unavailable');

      if (isReferenced && isNegative) {
        stale.push({
          previousReleaseId: versionA,
          previousVersion: versionA,
          statement: item.text,
          statementId: item.id,
          reason: `A new feature was added that may make this statement stale: "${packageB.completedFeatures.find((f) => f.text.toLowerCase().includes(keywords[0]))?.text}"`,
          newEvidenceIds: packageB.completedFeatures
            .filter((f) => keywords.some((kw) => f.text.toLowerCase().includes(kw)))
            .map((f) => f.id),
        });
      }
    }
  }

  return stale;
}
