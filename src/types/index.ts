// Shared TypeScript types for Release Brief Assistant

export type ReleaseStatus =
  | 'draft'
  | 'analysis_complete'
  | 'needs_review'
  | 'rejected'
  | 'approved';

export type ImpactLevel = 'high' | 'medium' | 'low' | 'none';
export type SeverityLevel = 'high' | 'medium' | 'low';
export type ReadinessStatus = 'ready' | 'needs_review' | 'not_ready';

// ──────────────────────────────────────────────
// Release Package Items (each with stable ID)
// ──────────────────────────────────────────────
export interface ReleaseItem {
  id: string; // e.g. FEATURE-001, BUG-002
  text: string;
  createdAt: string;
}

export interface ReleasePackage {
  completedFeatures: ReleaseItem[];
  bugFixes: ReleaseItem[];
  changedBehaviour: ReleaseItem[];
  qaSummary: ReleaseItem[];
  knownLimitations: ReleaseItem[];
  migrationNotes: ReleaseItem[];
  affectedUserGroups: ReleaseItem[];
}

// ──────────────────────────────────────────────
// Release
// ──────────────────────────────────────────────
export interface Release {
  _id: string;
  version: string;
  status: ReleaseStatus;
  releasePackage: ReleasePackage;
  validationResult: ValidationResult;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────────
// Validation
// ──────────────────────────────────────────────
export interface ValidationResult {
  isComplete: boolean;
  missingFields: string[];
}

// ──────────────────────────────────────────────
// AI Analysis
// ──────────────────────────────────────────────
export interface ImpactAnalysisItem {
  changeId: string;
  change: string;
  impact: ImpactLevel;
  reason: string;
  evidence: string[];
}

export interface MissingInfoItem {
  field: string;
  reason: string;
  severity: SeverityLevel;
}

export interface UnsupportedClaim {
  claim: string;
  evidence: string[];
  reason: string;
  severity: SeverityLevel;
  changeId: string;
}

export interface RiskItem {
  risk: string;
  severity: SeverityLevel;
  evidence: string[];
}

export interface Citation {
  id: string;
  text: string;
  sourceId: string;
}

export interface Analysis {
  _id: string;
  releaseId: string;
  readiness: ReadinessStatus;
  impactAnalysis: ImpactAnalysisItem[];
  missingInformation: MissingInfoItem[];
  unsupportedClaims: UnsupportedClaim[];
  risks: RiskItem[];
  technicalBrief: string;
  stakeholderBrief: string;
  limitations: string[];
  citations: Citation[];
  createdAt: string;
}

// ──────────────────────────────────────────────
// Review
// ──────────────────────────────────────────────
export interface Review {
  _id: string;
  releaseId: string;
  technicalBrief: string;
  stakeholderBrief: string;
  status: ReleaseStatus;
  reviewNotes?: string;
  editedFields: string[];
  reviewedAt: string;
}

// ──────────────────────────────────────────────
// Comparison
// ──────────────────────────────────────────────
export interface ComparisonDiff {
  type: 'added' | 'removed' | 'changed';
  field: string;
  itemId?: string;
  text: string;
  previousText?: string;
}

export interface QAComparison {
  versionA: string;
  versionB: string;
  summaryA: string[];
  summaryB: string[];
}

export interface StaleStatement {
  previousReleaseId: string;
  previousVersion: string;
  statement: string;
  statementId: string;
  reason: string;
  newEvidenceIds: string[];
}

export interface ComparisonResult {
  added: ComparisonDiff[];
  removed: ComparisonDiff[];
  changed: ComparisonDiff[];
  qaChanges: QAComparison;
  staleStatements: StaleStatement[];
}

export interface ReleaseComparison {
  _id: string;
  releaseAId: string;
  releaseBId: string;
  versionA: string;
  versionB: string;
  comparisonResult: ComparisonResult;
  createdAt: string;
}

// ──────────────────────────────────────────────
// Logs
// ──────────────────────────────────────────────
export type LogEvent =
  | 'RELEASE_CREATED'
  | 'RELEASE_UPDATED'
  | 'AI_ANALYSIS_STARTED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'AI_ANALYSIS_FAILED'
  | 'BRIEF_GENERATED'
  | 'BRIEF_EDITED'
  | 'BRIEF_APPROVED'
  | 'BRIEF_REJECTED'
  | 'RELEASE_COMPARED';

export interface Log {
  _id: string;
  event: LogEvent;
  releaseId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ──────────────────────────────────────────────
// Dashboard Stats
// ──────────────────────────────────────────────
export interface DashboardStats {
  total: number;
  draft: number;
  needsReview: number;
  approved: number;
  rejected: number;
  analysisComplete: number;
}
