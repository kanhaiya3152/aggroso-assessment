import mongoose, { Schema, Document, Model } from 'mongoose';

// ──────────────────────────────────────────────
// ReleaseItem subdocument
// ──────────────────────────────────────────────
const ReleaseItemSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

// ──────────────────────────────────────────────
// ValidationResult subdocument
// ──────────────────────────────────────────────
const ValidationResultSchema = new Schema({
  isComplete: { type: Boolean, required: true },
  missingFields: [{ type: String }],
});

// ──────────────────────────────────────────────
// ReleasePackage subdocument
// ──────────────────────────────────────────────
const ReleasePackageSchema = new Schema({
  completedFeatures: [ReleaseItemSchema],
  bugFixes: [ReleaseItemSchema],
  changedBehaviour: [ReleaseItemSchema],
  qaSummary: [ReleaseItemSchema],
  knownLimitations: [ReleaseItemSchema],
  migrationNotes: [ReleaseItemSchema],
  affectedUserGroups: [ReleaseItemSchema],
});

// ──────────────────────────────────────────────
// Release document
// ──────────────────────────────────────────────
export interface ReleaseDocument extends Document {
  version: string;
  status: 'draft' | 'analysis_complete' | 'needs_review' | 'rejected' | 'approved';
  releasePackage: {
    completedFeatures: { id: string; text: string; createdAt: string }[];
    bugFixes: { id: string; text: string; createdAt: string }[];
    changedBehaviour: { id: string; text: string; createdAt: string }[];
    qaSummary: { id: string; text: string; createdAt: string }[];
    knownLimitations: { id: string; text: string; createdAt: string }[];
    migrationNotes: { id: string; text: string; createdAt: string }[];
    affectedUserGroups: { id: string; text: string; createdAt: string }[];
  };
  validationResult: {
    isComplete: boolean;
    missingFields: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReleaseSchema = new Schema<ReleaseDocument>(
  {
    version: {
      type: String,
      required: [true, 'Version is required'],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'analysis_complete', 'needs_review', 'rejected', 'approved'],
      default: 'draft',
      index: true,
    },
    releasePackage: { type: ReleasePackageSchema, required: true },
    validationResult: { type: ValidationResultSchema, required: true },
  },
  {
    timestamps: true,
  }
);

// Prevent re-registration in hot-reload dev mode
export const Release: Model<ReleaseDocument> =
  mongoose.models.Release ?? mongoose.model<ReleaseDocument>('Release', ReleaseSchema);
