import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Analysis } from '@/lib/db/models/Analysis';
import { Review } from '@/lib/db/models/Review';
import { ReleaseDetailView } from '@/components/releases/ReleaseDetailView';
import { Release as ReleaseType, Analysis as AnalysisType, Review as ReviewType } from '@/types';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReleasePage({ params }: Props) {
  const { id } = await params;

  let releaseData: ReleaseType | null = null;
  let analysisData: AnalysisType | null = null;
  let reviewData: ReviewType | null = null;

  try {
    await connectDB();
    const releaseDoc = await Release.findById(id).lean();
    if (!releaseDoc) {
      notFound();
    }

    // Convert MongoDB documents to plain JSON objects
    releaseData = JSON.parse(JSON.stringify(releaseDoc));

    const analysisDoc = await Analysis.findOne({ releaseId: id }).lean();
    if (analysisDoc) {
      analysisData = JSON.parse(JSON.stringify(analysisDoc));
    }

    const reviewDoc = await Review.findOne({ releaseId: id }).lean();
    if (reviewDoc) {
      reviewData = JSON.parse(JSON.stringify(reviewDoc));
    }
  } catch (err) {
    console.error(`Failed to load release ${id}:`, err);
    notFound();
  }

  if (!releaseData) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/releases"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Releases List
        </Link>
      </div>

      <ReleaseDetailView
        initialRelease={releaseData}
        initialAnalysis={analysisData}
        initialReview={reviewData}
      />
    </div>
  );
}
