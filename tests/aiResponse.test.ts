import { describe, it, expect } from 'vitest';
import { validateAIResponse } from '@/lib/validation/aiResponseSchema';

describe('AI Response Validation & Parsing Guardrails', () => {
  it('should accept valid structured AI JSON response', () => {
    const validAIOutput = {
      readiness: 'needs_review',
      impactAnalysis: [
        {
          changeId: 'BEHAVIOR-001',
          change: 'Session timeout changed from 60 days to 30 days',
          impact: 'high',
          reason: 'Directly impacts active users and session persistence',
          evidence: ['BEHAVIOR-001'],
        },
      ],
      missingInformation: [
        {
          field: 'Migration timing',
          reason: 'Database migration is mentioned but timing window is unspecified',
          severity: 'medium',
        },
      ],
      unsupportedClaims: [
        {
          claim: 'Payment functionality is fully tested',
          evidence: ['QA-001'],
          reason: 'Supplied QA evidence indicates 5 tests failed including CSV export tests',
          severity: 'high',
          changeId: 'FEATURE-001',
        },
      ],
      risks: [
        {
          risk: '5 QA tests are currently failing',
          severity: 'high',
          evidence: ['QA-001'],
        },
      ],
      technicalBrief: 'Technical brief summary for engineering team...',
      stakeholderBrief: 'Non-technical brief summary for business stakeholders...',
      limitations: ['CSV export limited to 50MB'],
      citations: [
        {
          id: 'CIT-001',
          text: '5 QA tests failed',
          sourceId: 'QA-001',
        },
      ],
    };

    const result = validateAIResponse(validAIOutput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.readiness).toBe('needs_review');
      expect(result.data.impactAnalysis[0].impact).toBe('high');
      expect(result.data.unsupportedClaims[0].severity).toBe('high');
    }
  });

  it('should reject malformed AI output missing mandatory briefs or invalid readiness', () => {
    const malformedAIOutput = {
      readiness: 'auto_approved', // Illegal! AI cannot approve releases
      impactAnalysis: [],
      // Missing technicalBrief and stakeholderBrief
    };

    const result = validateAIResponse(malformedAIOutput);
    expect(result.success).toBe(false);
  });

  it('should reject non-object or null AI output safely', () => {
    expect(validateAIResponse(null).success).toBe(false);
    expect(validateAIResponse('raw string response').success).toBe(false);
    expect(validateAIResponse(12345).success).toBe(false);
  });
});
