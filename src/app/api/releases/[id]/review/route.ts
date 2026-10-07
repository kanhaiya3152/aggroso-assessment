import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Review } from '@/lib/db/models/Review';
import { createLog } from '@/lib/logger';

// POST /api/releases/[id]/review — submit human review (approve/reject/edit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const { action, technicalBrief, stakeholderBrief, reviewNotes, editedFields } = body;

    const validActions = ['approve', 'reject', 'edit'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    const release = await Release.findById(id);
    if (!release) {
      return NextResponse.json({ success: false, error: 'Release not found' }, { status: 404 });
    }

    // Determine new status based on human action
    // AI NEVER controls this — only the human reviewer does
    let newStatus: 'approved' | 'rejected' | 'needs_review';
    let logEvent: 'BRIEF_APPROVED' | 'BRIEF_REJECTED' | 'BRIEF_EDITED';

    if (action === 'approve') {
      newStatus = 'approved';
      logEvent = 'BRIEF_APPROVED';
    } else if (action === 'reject') {
      newStatus = 'rejected';
      logEvent = 'BRIEF_REJECTED';
    } else {
      newStatus = 'needs_review';
      logEvent = 'BRIEF_EDITED';
    }

    // Upsert review
    const review = await Review.findOneAndUpdate(
      { releaseId: id },
      {
        releaseId: id,
        technicalBrief: technicalBrief ?? '',
        stakeholderBrief: stakeholderBrief ?? '',
        status: newStatus,
        reviewNotes: reviewNotes ?? '',
        editedFields: editedFields ?? [],
        reviewedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Update release status — human-controlled only
    await Release.findByIdAndUpdate(id, { status: newStatus });

    await createLog({
      event: logEvent,
      releaseId: id,
      metadata: {
        action,
        newStatus,
        editedFields: editedFields ?? [],
        hasNotes: Boolean(reviewNotes),
        version: release.version,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (err) {
    console.error('[POST /api/releases/[id]/review]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

// GET /api/releases/[id]/review — get existing review
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const review = await Review.findOne({ releaseId: id }).lean();
    return NextResponse.json({ success: true, data: review });
  } catch (err) {
    console.error('[GET /api/releases/[id]/review]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}
