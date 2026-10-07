import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { ComparisonView } from '@/components/compare/ComparisonView';
import { Release as ReleaseType } from '@/types';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ releaseA?: string; releaseB?: string }>;
}

export default async function ComparePage({ searchParams }: Props) {
  const params = await searchParams;
  let releases: ReleaseType[] = [];

  try {
    await connectDB();
    const rawReleases = await Release.find().sort({ createdAt: -1 }).lean();
    releases = JSON.parse(JSON.stringify(rawReleases));
  } catch (err) {
    console.error('Failed to load releases for comparison:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Compare Release Versions
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Deterministic side-by-side comparison. Identifies added/removed items, QA evolution, and stale historical statements.
        </p>
      </div>

      <ComparisonView
        releases={releases}
        initialReleaseAId={params.releaseA}
        initialReleaseBId={params.releaseB}
      />
    </div>
  );
}
