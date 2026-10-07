import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ReviewDocument extends Document {
  releaseId: mongoose.Types.ObjectId;
  technicalBrief: string;
  stakeholderBrief: string;
  status: 'draft' | 'analysis_complete' | 'needs_review' | 'rejected' | 'approved';
  reviewNotes?: string;
  editedFields: string[];
  reviewedAt: Date;
}

const ReviewSchema = new Schema<ReviewDocument>(
  {
    releaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Release',
      required: true,
      index: true,
    },
    technicalBrief: { type: String, default: '' },
    stakeholderBrief: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'analysis_complete', 'needs_review', 'rejected', 'approved'],
      default: 'needs_review',
    },
    reviewNotes: { type: String },
    editedFields: [String],
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Review: Model<ReviewDocument> =
  mongoose.models.Review ?? mongoose.model<ReviewDocument>('Review', ReviewSchema);
