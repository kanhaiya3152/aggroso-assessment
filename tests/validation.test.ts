import { describe, it, expect } from 'vitest';
import { 
  validateReleasePackage, 
  assignReleaseItemIds, 
  generateItemId 
} from '@/lib/validation/releaseSchema';

describe('Deterministic Required Field Validation', () => {
  it('should pass complete release package with zero missing fields', () => {
    const pkg = {
      completedFeatures: ['Added CSV export'],
      bugFixes: ['Fixed login session timeout'],
      changedBehaviour: ['Session timeout changed from 60 to 30 days'],
      qaSummary: ['120 tests executed, 115 passed, 5 failed'],
      knownLimitations: ['CSV export limited to 50MB'],
      migrationNotes: ['Database migration v12 required'],
      affectedUserGroups: ['All users'],
    };

    const result = validateReleasePackage(pkg);
    expect(result.isComplete).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('should detect when required release sections are empty', () => {
    const incompletePkg = {
      completedFeatures: ['Feature A'],
      bugFixes: [], // Empty
      changedBehaviour: [], // Empty
      qaSummary: ['10 passed'],
      knownLimitations: [], // Empty
      migrationNotes: [], // Empty
      affectedUserGroups: ['All'],
    };

    const result = validateReleasePackage(incompletePkg);
    expect(result.isComplete).toBe(false);
    expect(result.missingFields).toContain('Bug Fixes');
    expect(result.missingFields).toContain('Changed Behaviour');
    expect(result.missingFields).toContain('Known Limitations');
    expect(result.missingFields).toContain('Migration / Configuration Notes');
  });

  it('should generate stable IDs for evidence tracking', () => {
    const featureId = generateItemId('FEATURE', 0);
    const bugId = generateItemId('BUG', 4);
    const qaId = generateItemId('QA', 9);

    expect(featureId).toBe('FEATURE-001');
    expect(bugId).toBe('BUG-005');
    expect(qaId).toBe('QA-010');
  });

  it('should assign IDs to every release item in a package', () => {
    const pkg = {
      completedFeatures: ['Feat 1', 'Feat 2'],
      bugFixes: ['Bug 1'],
      changedBehaviour: ['Behavior 1'],
      qaSummary: ['QA 1'],
      knownLimitations: ['Limit 1'],
      migrationNotes: ['Mig 1'],
      affectedUserGroups: ['Group 1'],
    };

    const assigned = assignReleaseItemIds(pkg);
    expect(assigned.completedFeatures[0].id).toBe('FEATURE-001');
    expect(assigned.completedFeatures[1].id).toBe('FEATURE-002');
    expect(assigned.bugFixes[0].id).toBe('BUG-001');
    expect(assigned.changedBehaviour[0].id).toBe('BEHAVIOR-001');
    expect(assigned.qaSummary[0].id).toBe('QA-001');
    expect(assigned.knownLimitations[0].id).toBe('LIMITATION-001');
    expect(assigned.migrationNotes[0].id).toBe('MIGRATION-001');
    expect(assigned.affectedUserGroups[0].id).toBe('USERGROUP-001');
  });
});
