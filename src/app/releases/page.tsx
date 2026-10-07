import Link from 'next/link';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Analysis } from '@/lib/db/models/Analysis';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Rocket, 
  PlusCircle, 
  GitCompare, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  FileCheck2,
  FileEdit,
  ArrowRight
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
    case 'needs_review':
      return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Needs Review</Badge>;
    case 'analysis_complete':
      return <Badge variant="default" className="gap-1"><FileCheck2 className="h-3 w-3" /> Analysis Complete</Badge>;
    case 'rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
    case 'draft':
    default:
      return <Badge variant="secondary" className="gap-1"><FileEdit className="h-3 w-3" /> Draft</Badge>;
  }
}

export default async function ReleasesPage() {
  let releases: Array<{
    _id: string;
    version: string;
    status: string;
    createdAt: string | Date;
    validationResult: { isComplete: boolean; missingFields: string[] };
    releasePackage: {
      completedFeatures: Array<{ id: string; text: string }>;
      bugFixes: Array<{ id: string; text: string }>;
      changedBehaviour: Array<{ id: string; text: string }>;
      qaSummary: Array<{ id: string; text: string }>;
    };
    analysis?: {
      readiness: string;
      risks: Array<{ severity: string; risk: string }>;
      unsupportedClaims: Array<{ claim: string }>;
    } | null;
  }> = [];

  try {
    await connectDB();
    const rawReleases = await Release.find().sort({ createdAt: -1 }).lean();

    releases = await Promise.all(
      rawReleases.map(async (r) => {
        const analysis = await Analysis.findOne(
          { releaseId: r._id },
          { readiness: 1, risks: 1, unsupportedClaims: 1 }
        ).lean();

        return {
          _id: r._id.toString(),
          version: r.version,
          status: r.status,
          createdAt: r.createdAt,
          validationResult: r.validationResult,
          releasePackage: r.releasePackage,
          analysis: analysis ? {
            readiness: analysis.readiness,
            risks: analysis.risks || [],
            unsupportedClaims: analysis.unsupportedClaims || [],
          } : null,
        };
      })
    );
  } catch (err) {
    console.error('Failed to load releases:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Release Packages
          </h1>
          <p className="text-sm text-slate-500">
            Immutable, versioned release artifacts and readiness briefs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/compare"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-xs dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
          >
            <GitCompare className="h-4 w-4" />
            Compare Versions
          </Link>
          <Link
            href="/releases/create"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            Create Release
          </Link>
        </div>
      </div>

      {/* Releases Table / Cards */}
      {releases.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Rocket className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No releases created yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Create your first release package to start deterministic validation and AI analysis.
          </p>
          <div className="mt-6">
            <Link
              href="/releases/create"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4" />
              Create First Release
            </Link>
          </div>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Deterministic Check</th>
                  <th className="px-6 py-4">AI Readiness</th>
                  <th className="px-6 py-4">Risks &amp; Claims</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {releases.map((release) => {
                  const highRisks = release.analysis?.risks?.filter((r) => r.severity === 'high').length ?? 0;
                  const unsupportedCount = release.analysis?.unsupportedClaims?.length ?? 0;

                  return (
                    <tr
                      key={release._id}
                      className="hover:bg-slate-50/80 transition-colors dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/releases/${release._id}`}
                          className="font-mono text-base font-bold text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                        >
                          v{release.version}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(release.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {release.validationResult.isComplete ? (
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {release.validationResult.missingFields.length} missing
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {release.analysis ? (
                          <Badge
                            variant={
                              release.analysis.readiness === 'ready'
                                ? 'success'
                                : release.analysis.readiness === 'needs_review'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="capitalize"
                          >
                            {release.analysis.readiness.replace('_', ' ')}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 italic">Not Analyzed</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {release.analysis ? (
                          <div className="flex items-center gap-2">
                            {highRisks > 0 && (
                              <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                                {highRisks} High Risk
                              </span>
                            )}
                            {unsupportedCount > 0 && (
                              <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                {unsupportedCount} Claim Flagged
                              </span>
                            )}
                            {highRisks === 0 && unsupportedCount === 0 && (
                              <span className="text-slate-500">None flagged</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {new Date(release.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/releases/${release._id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
