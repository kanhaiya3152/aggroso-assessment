import { describe, it, expect } from 'vitest';
import { detectStaleStatements } from '@/lib/deterministic/comparison';
import { ReleasePackage } from '@/types';

describe('Deterministic Stale Statement Detection', () => {
  it('should detect when limitation changed in a newer release', () => {
    const packageA: ReleasePackage = {
      completedFeatures: [],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [
        { id: 'LIMITATION-001', text: 'Maximum export file size is 10MB', createdAt: '2026-01-01' },
      ],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const packageB: ReleasePackage = {
      completedFeatures: [],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [
        { id: 'LIMITATION-001', text: 'Maximum export file size is 50MB', createdAt: '2026-02-01' },
      ],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const stale = detectStaleStatements(packageA, packageB, '1.0.0');
    expect(stale.length).toBeGreaterThan(0);
    expect(stale[0].statement).toContain('10MB');
    expect(stale[0].reason).toContain('50MB');
  });

  it('should detect when a feature that was previously not available is now introduced', () => {
    const packageA: ReleasePackage = {
      completedFeatures: [],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [
        { id: 'LIMITATION-001', text: 'CSV export is not available', createdAt: '2026-01-01' },
      ],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const packageB: ReleasePackage = {
      completedFeatures: [
        { id: 'FEATURE-001', text: 'Added CSV export for all users', createdAt: '2026-02-01' },
      ],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const stale = detectStaleStatements(packageA, packageB, '1.0.0');
    expect(stale.length).toBeGreaterThan(0);
    expect(stale[0].statement).toContain('CSV export is not available');
    expect(stale[0].newEvidenceIds).toContain('FEATURE-001');
  });
});
