import { describe, it, expect } from 'vitest';
import { compareReleases } from '@/lib/deterministic/comparison';
import { ReleasePackage } from '@/types';

describe('Deterministic Version Comparison', () => {
  const packageA: ReleasePackage = {
    completedFeatures: [
      { id: 'FEATURE-001', text: 'Legacy Export', createdAt: '2026-01-01' },
      { id: 'FEATURE-002', text: 'Profile Editing', createdAt: '2026-01-01' },
    ],
    bugFixes: [
      { id: 'BUG-001', text: 'Fixed login timeout', createdAt: '2026-01-01' },
    ],
    changedBehaviour: [
      { id: 'BEHAVIOR-001', text: 'Session timeout is 60 days', createdAt: '2026-01-01' },
    ],
    qaSummary: [
      { id: 'QA-001', text: '100 tests executed, 90 passed, 10 failed', createdAt: '2026-01-01' },
    ],
    knownLimitations: [
      { id: 'LIMITATION-001', text: 'Maximum export file size is 10MB', createdAt: '2026-01-01' },
    ],
    migrationNotes: [],
    affectedUserGroups: [
      { id: 'USERGROUP-001', text: 'All users', createdAt: '2026-01-01' },
    ],
  };

  const packageB: ReleasePackage = {
    completedFeatures: [
      { id: 'FEATURE-001', text: 'CSV Export', createdAt: '2026-02-01' }, // Added
      { id: 'FEATURE-002', text: 'Profile Editing', createdAt: '2026-02-01' }, // Unchanged
    ],
    bugFixes: [
      { id: 'BUG-001', text: 'Fixed login timeout', createdAt: '2026-02-01' },
    ],
    changedBehaviour: [
      { id: 'BEHAVIOR-001', text: 'Session timeout changed from 60 days to 30 days', createdAt: '2026-02-01' },
    ],
    qaSummary: [
      { id: 'QA-001', text: '120 tests executed, 115 passed, 5 failed', createdAt: '2026-02-01' },
    ],
    knownLimitations: [
      { id: 'LIMITATION-001', text: 'Maximum export file size is 50MB', createdAt: '2026-02-01' }, // Changed
    ],
    migrationNotes: [
      { id: 'MIGRATION-001', text: 'Database migration v12 required', createdAt: '2026-02-01' }, // Added
    ],
    affectedUserGroups: [
      { id: 'USERGROUP-001', text: 'All users', createdAt: '2026-02-01' },
    ],
  };

  it('should detect added features and migration notes', () => {
    const diff = compareReleases(packageA, packageB, '1.0.0', '1.1.0');

    const addedTexts = diff.added.map((item) => item.text);
    expect(addedTexts).toContain('CSV Export');
    expect(addedTexts).toContain('Database migration v12 required');
  });

  it('should detect removed features', () => {
    const diff = compareReleases(packageA, packageB, '1.0.0', '1.1.0');

    const removedTexts = diff.removed.map((item) => item.text);
    expect(removedTexts).toContain('Legacy Export');
  });

  it('should preserve QA evolution summary for both versions', () => {
    const diff = compareReleases(packageA, packageB, '1.0.0', '1.1.0');

    expect(diff.qaChanges.versionA).toBe('1.0.0');
    expect(diff.qaChanges.versionB).toBe('1.1.0');
    expect(diff.qaChanges.summaryA[0]).toContain('90 passed');
    expect(diff.qaChanges.summaryB[0]).toContain('115 passed');
  });
});
