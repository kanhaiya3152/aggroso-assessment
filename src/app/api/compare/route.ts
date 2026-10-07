import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { ReleaseComparison } from '@/lib/db/models/ReleaseComparison';
import { compareReleases } from '@/lib/deterministic/comparison';
import { createLog } from '@/lib/logger';
import { ReleasePackage } from '@/types';

// POST /api/compare — compare two releases
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { releaseAId, releaseBId } = body;

    if (!releaseAId || !releaseBId) {
      return NextResponse.json(
        { success: false, error: 'Both releaseAId and releaseBId are required' },
        { status: 400 }
      );
    }

    if (releaseAId === releaseBId) {
      return NextResponse.json(
        { success: false, error: 'Cannot compare a release with itself' },
        { status: 400 }
      );
    }

    const [releaseA, releaseB] = await Promise.all([
      Release.findById(releaseAId).lean(),
      Release.findById(releaseBId).lean(),
    ]);

    if (!releaseA) {
      return NextResponse.json({ success: false, error: 'Release A not found' }, { status: 404 });
    }
    if (!releaseB) {
      return NextResponse.json({ success: false, error: 'Release B not found' }, { status: 404 });
    }

    // Deterministic comparison — no AI used
    const comparisonResult = compareReleases(
      releaseA.releasePackage as ReleasePackage,
      releaseB.releasePackage as ReleasePackage,
      releaseA.version,
      releaseB.version
    );

    // Store comparison
    const comparison = await ReleaseComparison.create({
      releaseAId,
      releaseBId,
      versionA: releaseA.version,
      versionB: releaseB.version,
      comparisonResult,
    });

    await createLog({
      event: 'RELEASE_COMPARED',
      metadata: {
        releaseAId,
        releaseBId,
        versionA: releaseA.version,
        versionB: releaseB.version,
        addedCount: comparisonResult.added.length,
        removedCount: comparisonResult.removed.length,
        staleCount: comparisonResult.staleStatements.length,
      },
    });

    return NextResponse.json({ success: true, data: comparison });
  } catch (err) {
    console.error('[POST /api/compare]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to compare releases' },
      { status: 500 }
    );
  }
}

// GET /api/compare — get all comparisons
export async function GET() {
  try {
    await connectDB();
    const comparisons = await ReleaseComparison.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return NextResponse.json({ success: true, data: comparisons });
  } catch (err) {
    console.error('[GET /api/compare]', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comparisons' },
      { status: 500 }
    );
  }
}
