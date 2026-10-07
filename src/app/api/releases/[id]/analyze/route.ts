import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Analysis } from '@/lib/db/models/Analysis';
import { analyzeRelease } from '@/lib/ai/gemini';
import { createLog } from '@/lib/logger';

// POST /api/releases/[id]/analyze — trigger AI analysis
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const release = await Release.findById(id);
    if (!release) {
      return NextResponse.json({ success: false, error: 'Release not found' }, { status: 404 });
    }

    await createLog({
      event: 'AI_ANALYSIS_STARTED',
      releaseId: id,
      metadata: { version: release.version },
    });

    // Run AI analysis
    const aiResult = await analyzeRelease(
      release.version,
      release.releasePackage as Parameters<typeof analyzeRelease>[1],
      release.validationResult.missingFields
    );

    if (!aiResult.success) {
      await createLog({
        event: 'AI_ANALYSIS_FAILED',
        releaseId: id,
        metadata: { error: aiResult.error, version: release.version },
      });

      return NextResponse.json(
        { success: false, error: aiResult.error },
        { status: 500 }
      );
    }

    // Delete existing analysis for this release (re-analyze)
    await Analysis.deleteOne({ releaseId: id });

    // Store validated AI analysis in DB
    const analysis = await Analysis.create({
      releaseId: id,
      readiness: aiResult.data.readiness,
      impactAnalysis: aiResult.data.impactAnalysis,
      missingInformation: aiResult.data.missingInformation,
      unsupportedClaims: aiResult.data.unsupportedClaims,
      risks: aiResult.data.risks,
      technicalBrief: aiResult.data.technicalBrief,
      stakeholderBrief: aiResult.data.stakeholderBrief,
      limitations: aiResult.data.limitations,
      citations: aiResult.data.citations,
    });

    // Update release status to 'analysis_complete'
    // NOTE: AI cannot set status to 'approved' — only human review can do that
    await Release.findByIdAndUpdate(id, { status: 'analysis_complete' });

    await createLog({
      event: 'AI_ANALYSIS_COMPLETED',
      releaseId: id,
      metadata: {
        version: release.version,
        readiness: aiResult.data.readiness,
        risksCount: aiResult.data.risks.length,
        unsupportedClaimsCount: aiResult.data.unsupportedClaims.length,
      },
    });

    await createLog({
      event: 'BRIEF_GENERATED',
      releaseId: id,
      metadata: { version: release.version, analysisId: analysis._id.toString() },
    });

    return NextResponse.json({ success: true, data: analysis });
  } catch (err) {
    console.error('[POST /api/releases/[id]/analyze]', err);
    return NextResponse.json(
      { success: false, error: 'Unable to analyze release. Please try again.' },
      { status: 500 }
    );
  }
}
