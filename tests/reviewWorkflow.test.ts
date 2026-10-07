import { describe, it, expect } from 'vitest';
import { ReleaseStatus } from '@/types';

describe('Human-in-the-Loop Review Governance Workflow', () => {
  // Pure domain workflow verification
  function applyReviewAction(
    currentStatus: ReleaseStatus,
    action: 'approve' | 'reject' | 'edit',
    isHuman: boolean
  ): { nextStatus: ReleaseStatus; permitted: boolean } {
    // Critical Rule: The AI must NEVER automatically approve a release or deploy anything
    if (!isHuman && (action === 'approve' || action === 'reject')) {
      return { nextStatus: currentStatus, permitted: false };
    }

    if (action === 'approve') {
      return { nextStatus: 'approved', permitted: true };
    }
    if (action === 'reject') {
      return { nextStatus: 'rejected', permitted: true };
    }
    if (action === 'edit') {
      return { nextStatus: 'needs_review', permitted: true };
    }

    return { nextStatus: currentStatus, permitted: false };
  }

  it('should allow human reviewer to approve a release', () => {
    const result = applyReviewAction('needs_review', 'approve', true);
    expect(result.permitted).toBe(true);
    expect(result.nextStatus).toBe('approved');
  });

  it('should allow human reviewer to reject a release', () => {
    const result = applyReviewAction('needs_review', 'reject', true);
    expect(result.permitted).toBe(true);
    expect(result.nextStatus).toBe('rejected');
  });

  it('should transition to needs_review when human edits briefs', () => {
    const result = applyReviewAction('analysis_complete', 'edit', true);
    expect(result.permitted).toBe(true);
    expect(result.nextStatus).toBe('needs_review');
  });

  it('should strictly prohibit AI from setting approved or rejected status', () => {
    const aiApproveAttempt = applyReviewAction('analysis_complete', 'approve', false);
    expect(aiApproveAttempt.permitted).toBe(false);
    expect(aiApproveAttempt.nextStatus).toBe('analysis_complete');

    const aiRejectAttempt = applyReviewAction('analysis_complete', 'reject', false);
    expect(aiRejectAttempt.permitted).toBe(false);
    expect(aiRejectAttempt.nextStatus).toBe('analysis_complete');
  });
});
