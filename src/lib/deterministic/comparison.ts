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
 * Identifies statements from versionA that are contradicted by NEW items in versionB.
 */
export function detectStaleStatements(
  packageA: ReleasePackage,
  packageB: ReleasePackage,
  versionA: string
): StaleStatement[] {
  const stale: StaleStatement[] = [];

  // Check known limitations for changes across releases
  for (const limitA of packageA.knownLimitations) {
    for (const limitB of packageB.knownLimitations) {
      // If exact same text, it's not changed
      if (limitA.text.trim().toLowerCase() === limitB.text.trim().toLowerCase()) {
        continue;
      }

      // Check if both limitations refer to the exact same metric/topic (e.g. "maximum export file size")
      const wordsA = limitA.text.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const commonWords = wordsA.filter((w) => limitB.text.toLowerCase().includes(w));

      // Must share significant overlap (at least 2 words > 4 chars) to be the same topic
      const isSameTopicButChanged = commonWords.length >= 2;

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

  // Check features: only NEW features introduced in package B can make an older statement stale
  const existingFeaturesA = new Set(packageA.completedFeatures.map((f) => f.text.toLowerCase().trim()));
  const newFeaturesB = packageB.completedFeatures.filter(
    (f) => !existingFeaturesA.has(f.text.toLowerCase().trim())
  );

  for (const item of [...packageA.knownLimitations, ...packageA.changedBehaviour]) {
    const isNegative =
      item.text.toLowerCase().includes('not available') ||
      item.text.toLowerCase().includes('not supported') ||
      item.text.toLowerCase().includes('unavailable');

    if (!isNegative) continue;

    const keywords = item.text
      .toLowerCase()
      .replace(/not available|not supported|unavailable/g, '')
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z0-9]/g, ''))
      .filter((w) => w.length >= 3 && w !== 'the' && w !== 'and' && w !== 'for');

    for (const featureB of newFeaturesB) {
      const isReferenced = keywords.some((kw) => featureB.text.toLowerCase().includes(kw));

      if (isReferenced) {
        stale.push({
          previousReleaseId: versionA,
          previousVersion: versionA,
          statement: item.text,
          statementId: item.id,
          reason: `A new feature was added in the new version that may make this statement stale: "${featureB.text}"`,
          newEvidenceIds: [featureB.id],
        });
        break;
      }
    }
  }

  return stale;
}
