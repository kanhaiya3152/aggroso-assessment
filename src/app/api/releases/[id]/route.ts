import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Analysis } from '@/lib/db/models/Analysis';
import { Review } from '@/lib/db/models/Review';

// GET /api/releases/[id] — get single release with analysis and review
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const release = await Release.findById(id).lean();
    if (!release) {
      return NextResponse.json({ success: false, error: 'Release not found' }, { status: 404 });
    }

    const analysis = await Analysis.findOne({ releaseId: id }).lean();
    const review = await Review.findOne({ releaseId: id }).lean();

    return NextResponse.json({
      success: true,
      data: { release, analysis, review },
    });
  } catch (err) {
    console.error('[GET /api/releases/[id]]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch release' }, { status: 500 });
  }
}

// PUT /api/releases/[id] — update release status (human-only)
// AI CANNOT set status to 'approved'
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const { status } = body;
    const validStatuses = ['draft', 'analysis_complete', 'needs_review', 'rejected', 'approved'];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    const release = await Release.findByIdAndUpdate(id, { status }, { new: true });
    if (!release) {
      return NextResponse.json({ success: false, error: 'Release not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: release });
  } catch (err) {
    console.error('[PUT /api/releases/[id]]', err);
    return NextResponse.json({ success: false, error: 'Failed to update release' }, { status: 500 });
  }
}
