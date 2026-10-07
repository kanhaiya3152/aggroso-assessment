import mongoose, { Schema, Document, Model } from 'mongoose';

type LogEvent =
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

export interface LogDocument extends Document {
  event: LogEvent;
  releaseId?: mongoose.Types.ObjectId;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const LogSchema = new Schema<LogDocument>(
  {
    event: {
      type: String,
      enum: [
        'RELEASE_CREATED',
        'RELEASE_UPDATED',
        'AI_ANALYSIS_STARTED',
        'AI_ANALYSIS_COMPLETED',
        'AI_ANALYSIS_FAILED',
        'BRIEF_GENERATED',
        'BRIEF_EDITED',
        'BRIEF_APPROVED',
        'BRIEF_REJECTED',
        'RELEASE_COMPARED',
      ],
      required: true,
      index: true,
    },
    releaseId: {
      type: Schema.Types.ObjectId,
      ref: 'Release',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Log: Model<LogDocument> =
  mongoose.models.Log ?? mongoose.model<LogDocument>('Log', LogSchema);
