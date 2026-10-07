import { ReleaseCreateForm } from '@/components/releases/ReleaseCreateForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateReleasePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/releases"
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Releases
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Create Release Package
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Provide structured software release package information. All items will be assigned stable identifiers for evidence tracing.
        </p>
      </div>

      <ReleaseCreateForm />
    </div>
  );
}
