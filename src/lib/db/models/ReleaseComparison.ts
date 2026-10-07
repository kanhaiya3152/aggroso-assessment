import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ReleaseComparisonDocument extends Document {
  releaseAId: mongoose.Types.ObjectId;
  releaseBId: mongoose.Types.ObjectId;
  versionA: string;
  versionB: string;
  comparisonResult: {
    added: { type: string; field: string; itemId?: string; text: string; previousText?: string }[];
    removed: { type: string; field: string; itemId?: string; text: string; previousText?: string }[];
    changed: { type: string; field: string; itemId?: string; text: string; previousText?: string }[];
    qaChanges: {
      versionA: string;
      versionB: string;
      summaryA: string[];
      summaryB: string[];
    };
    staleStatements: {
      previousReleaseId: string;
      previousVersion: string;
      statement: string;
      statementId: string;
      reason: string;
      newEvidenceIds: string[];
    }[];
  };
  createdAt: Date;
}

const ComparisonDiffSchema = new Schema({
  type: { type: String, enum: ['added', 'removed', 'changed'] },
  field: String,
  itemId: String,
  text: String,
  previousText: String,
});

const ReleaseComparisonSchema = new Schema<ReleaseComparisonDocument>(
  {
    releaseAId: { type: Schema.Types.ObjectId, ref: 'Release', required: true },
    releaseBId: { type: Schema.Types.ObjectId, ref: 'Release', required: true },
    versionA: { type: String, required: true },
    versionB: { type: String, required: true },
    comparisonResult: {
      added: [ComparisonDiffSchema],
      removed: [ComparisonDiffSchema],
      changed: [ComparisonDiffSchema],
      qaChanges: {
        versionA: String,
        versionB: String,
        summaryA: [String],
        summaryB: [String],
      },
      staleStatements: [
        {
          previousReleaseId: String,
          previousVersion: String,
          statement: String,
          statementId: String,
          reason: String,
          newEvidenceIds: [String],
        },
      ],
    },
  },
  { timestamps: true }
);

export const ReleaseComparison: Model<ReleaseComparisonDocument> =
  mongoose.models.ReleaseComparison ??
  mongoose.model<ReleaseComparisonDocument>('ReleaseComparison', ReleaseComparisonSchema);
