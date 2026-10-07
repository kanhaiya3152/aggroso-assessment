import mongoose, { Schema, Document, Model } from 'mongoose';

export interface AnalysisDocument extends Document {
  releaseId: mongoose.Types.ObjectId;
  readiness: 'ready' | 'needs_review' | 'not_ready';
  impactAnalysis: {
    changeId: string;
    change: string;
    impact: 'high' | 'medium' | 'low' | 'none';
    reason: string;
    evidence: string[];
  }[];
  missingInformation: {
    field: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
  }[];
  unsupportedClaims: {
    claim: string;
    evidence: string[];
    reason: string;
    severity: 'high' | 'medium' | 'low';
    changeId: string;
  }[];
  risks: {
    risk: string;
    severity: 'high' | 'medium' | 'low';
    evidence: string[];
  }[];
  technicalBrief: string;
  stakeholderBrief: string;
  limitations: string[];
  citations: {
    id: string;
    text: string;
    sourceId: string;
  }[];
  createdAt: Date;
}

const AnalysisSchema = new Schema<AnalysisDocument>(
  {
    releaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Release',
      required: true,
      index: true,
    },
    readiness: {
      type: String,
      enum: ['ready', 'needs_review', 'not_ready'],
      default: 'needs_review',
    },
    impactAnalysis: [
      {
        changeId: String,
        change: String,
        impact: { type: String, enum: ['high', 'medium', 'low', 'none'] },
        reason: String,
        evidence: [String],
      },
    ],
    missingInformation: [
      {
        field: String,
        reason: String,
        severity: { type: String, enum: ['high', 'medium', 'low'] },
      },
    ],
    unsupportedClaims: [
      {
        claim: String,
        evidence: [String],
        reason: String,
        severity: { type: String, enum: ['high', 'medium', 'low'] },
        changeId: String,
      },
    ],
    risks: [
      {
        risk: String,
        severity: { type: String, enum: ['high', 'medium', 'low'] },
        evidence: [String],
      },
    ],
    technicalBrief: { type: String, default: '' },
    stakeholderBrief: { type: String, default: '' },
    limitations: [String],
    citations: [
      {
        id: String,
        text: String,
        sourceId: String,
      },
    ],
  },
  { timestamps: true }
);

export const Analysis: Model<AnalysisDocument> =
  mongoose.models.Analysis ?? mongoose.model<AnalysisDocument>('Analysis', AnalysisSchema);
