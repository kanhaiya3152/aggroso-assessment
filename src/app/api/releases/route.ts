import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Analysis } from '@/lib/db/models/Analysis';
import { Review } from '@/lib/db/models/Review';
import { CreateReleaseSchema, validateReleasePackage, assignReleaseItemIds } from '@/lib/validation/releaseSchema';
import { createLog } from '@/lib/logger';
import { DashboardStats } from '@/types';

// GET /api/releases — list all releases
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const [total, draft, needsReview, approved, rejected, analysisComplete] = await Promise.all([
        Release.countDocuments(),
        Release.countDocuments({ status: 'draft' }),
        Release.countDocuments({ status: 'needs_review' }),
        Release.countDocuments({ status: 'approved' }),
        Release.countDocuments({ status: 'rejected' }),
        Release.countDocuments({ status: 'analysis_complete' }),
      ]);

      const stats: DashboardStats = {
        total,
        draft,
        needsReview,
        approved,
        rejected,
        analysisComplete,
      };

      return NextResponse.json({ success: true, data: stats });
    }

    const releases = await Release.find().sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, data: releases });
  } catch (err) {
    console.error('[GET /api/releases]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch releases' },
      { status: 500 }
    );
  }
}

// POST /api/releases — create a new release
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate input with Zod
    const parseResult = CreateReleaseSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: parseResult.error.message },
        { status: 400 }
      );
    }

    const { version, releasePackage } = parseResult.data;

    // Check for duplicate version
    const existing = await Release.findOne({ version });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Release version ${version} already exists` },
        { status: 409 }
      );
    }

    // Deterministic required-field validation
    const validationResult = validateReleasePackage(releasePackage);

    // Assign stable IDs to all release items
    const packageWithIds = assignReleaseItemIds(releasePackage);

    const release = await Release.create({
      version,
      status: 'draft',
      releasePackage: packageWithIds,
      validationResult,
    });

    await createLog({
      event: 'RELEASE_CREATED',
      releaseId: release._id.toString(),
      metadata: {
        version,
        isComplete: validationResult.isComplete,
        missingFields: validationResult.missingFields,
      },
    });

    return NextResponse.json({ success: true, data: release }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/releases]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create release' },
      { status: 500 }
    );
  }
}
