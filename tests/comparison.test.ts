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
      { id: 'LIMITATION-002', text: 'CSV export is not available', createdAt: '2026-01-01' },
    ],
    migrationNotes: [],
    affectedUserGroups: [
      { id: 'USERGROUP-001', text: 'All users', createdAt: '2026-01-01' },
    ],
  };

  const packageB: ReleasePackage = {
    completedFeatures: [
      { id: 'FEATURE-001', text: 'Added CSV export for all users', createdAt: '2026-02-01' }, // Added
      { id: 'FEATURE-002', text: 'Profile Editing', createdAt: '2026-02-01' }, // Unchanged
      { id: 'FEATURE-003', text: 'Added dark mode theme preference', createdAt: '2026-02-01' }, // Added
    ],
    bugFixes: [
      { id: 'BUG-001', text: 'Fixed login timeout', createdAt: '2026-02-01' },
      { id: 'BUG-002', text: 'Fixed incorrect dashboard calculation', createdAt: '2026-02-01' },
    ],
    changedBehaviour: [
      { id: 'BEHAVIOR-001', text: 'Session timeout changed from 60 days to 30 days', createdAt: '2026-02-01' },
    ],
    qaSummary: [
      { id: 'QA-001', text: '120 tests executed, 115 passed, 5 failed', createdAt: '2026-02-01' },
      { id: 'QA-002', text: 'CSV export tests failed', createdAt: '2026-02-01' },
    ],
    knownLimitations: [
      { id: 'LIMITATION-001', text: 'Maximum export file size is 50MB', createdAt: '2026-02-01' }, // Changed
      { id: 'LIMITATION-002', text: 'CSV export supports files up to 50MB only', createdAt: '2026-02-01' },
    ],
    migrationNotes: [
      { id: 'MIGRATION-001', text: 'Database migration v12 required prior to deployment', createdAt: '2026-02-01' }, // Added
    ],
    affectedUserGroups: [
      { id: 'USERGROUP-001', text: 'All active web users', createdAt: '2026-02-01' },
      { id: 'USERGROUP-002', text: 'Enterprise customers with custom timeouts', createdAt: '2026-02-01' },
    ],
  };

  const packageC_QuickCommerce: ReleasePackage = {
    completedFeatures: [
      { id: 'FEATURE-001', text: 'Introduced 10-minute order delivery', createdAt: '2026-03-01' },
      { id: 'FEATURE-002', text: 'Real-time GPS courier tracking via WebSocket', createdAt: '2026-03-01' },
    ],
    bugFixes: [
      { id: 'BUG-001', text: 'Fixed double billing race condition', createdAt: '2026-03-01' },
    ],
    changedBehaviour: [
      { id: 'BEHAVIOR-001', text: 'Free cancellation window reduced from 60 to 30 seconds', createdAt: '2026-03-01' },
      { id: 'BEHAVIOR-002', text: 'Cash on delivery disabled for orders above 10,000 INR', createdAt: '2026-03-01' },
    ],
    qaSummary: [
      { id: 'QA-001', text: '350 tests executed, 341 passed, 9 failed', createdAt: '2026-03-01' },
      { id: 'QA-002', text: 'Surge simulation failed at peak hours', createdAt: '2026-03-01' },
    ],
    knownLimitations: [
      { id: 'LIMITATION-001', text: '10-minute delivery restricted to 2.5km dark store radius', createdAt: '2026-03-01' },
    ],
    migrationNotes: [
      { id: 'MIGRATION-001', text: 'Redis cluster migration v4 required for live courier queues', createdAt: '2026-03-01' },
    ],
    affectedUserGroups: [
      { id: 'USERGROUP-001', text: 'All mobile app users in Tier-1 cities', createdAt: '2026-03-01' },
    ],
  };

  it('should detect added features and migration notes between v1.0.0 and v1.1.0', () => {
    const diff = compareReleases(packageA, packageB, '1.0.0', '1.1.0');

    const addedTexts = diff.added.map((item) => item.text);
    expect(addedTexts).toContain('Added CSV export for all users');
    expect(addedTexts).toContain('Added dark mode theme preference');
    expect(addedTexts).toContain('Database migration v12 required prior to deployment');
  });

  it('should detect removed features when upgraded', () => {
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

  it('should automatically flag stale limitation statements in comparison result', () => {
    const diff = compareReleases(packageA, packageB, '1.0.0', '1.1.0');

    expect(diff.staleStatements.length).toBeGreaterThan(0);
    const staleStatements = diff.staleStatements.map((s) => s.statement);
    
    // "Maximum export file size is 10MB" was changed to 50MB -> stale!
    expect(staleStatements.some((s) => s.includes('10MB'))).toBe(true);
    // "CSV export is not available" became stale because CSV export was added!
    expect(staleStatements.some((s) => s.includes('CSV export is not available'))).toBe(true);
  });

  it('should compare major enterprise releases across quick-commerce paradigm (v1.1.0 vs v2.0.0)', () => {
    const diff = compareReleases(packageB, packageC_QuickCommerce, '1.1.0', '2.0.0');

    expect(diff.added.length).toBeGreaterThan(0);
    const addedTexts = diff.added.map((i) => i.text);
    expect(addedTexts).toContain('Introduced 10-minute order delivery');
    expect(addedTexts).toContain('Redis cluster migration v4 required for live courier queues');

    expect(diff.qaChanges.summaryB[0]).toContain('341 passed');
  });

  it('should return empty added and removed lists when comparing identical release packages', () => {
    const diff = compareReleases(packageA, packageA, '1.0.0', '1.0.0');

    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.staleStatements).toHaveLength(0);
  });
});
