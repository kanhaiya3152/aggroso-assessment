import { describe, it, expect } from 'vitest';
import { detectStaleStatements } from '@/lib/deterministic/comparison';
import { ReleasePackage } from '@/types';

describe('Deterministic Stale Statement Detection', () => {
  it('should detect when limitation changed in a newer release (e.g. 10MB to 50MB)', () => {
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

  it('should detect unsupported theme/mode limitation when feature is subsequently added', () => {
    const packageA: ReleasePackage = {
      completedFeatures: [],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [
        { id: 'LIMITATION-001', text: 'Dark mode theme is not supported', createdAt: '2026-01-01' },
      ],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const packageB: ReleasePackage = {
      completedFeatures: [
        { id: 'FEATURE-002', text: 'Introduced dark mode theme preference for user profiles', createdAt: '2026-02-01' },
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
    expect(stale[0].statement).toContain('Dark mode');
    expect(stale[0].newEvidenceIds).toContain('FEATURE-002');
  });

  it('should return empty list when neither limitations nor negative statements are contradicted', () => {
    const packageA: ReleasePackage = {
      completedFeatures: [{ id: 'FEATURE-001', text: 'User login', createdAt: '2026-01-01' }],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [{ id: 'LIMITATION-001', text: 'Requires internet connectivity', createdAt: '2026-01-01' }],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const packageB: ReleasePackage = {
      completedFeatures: [{ id: 'FEATURE-002', text: 'Dashboard chart', createdAt: '2026-02-01' }],
      bugFixes: [],
      changedBehaviour: [],
      qaSummary: [],
      knownLimitations: [{ id: 'LIMITATION-001', text: 'Requires internet connectivity', createdAt: '2026-02-01' }],
      migrationNotes: [],
      affectedUserGroups: [],
    };

    const stale = detectStaleStatements(packageA, packageB, '1.0.0');
    expect(stale).toHaveLength(0);
  });
});
