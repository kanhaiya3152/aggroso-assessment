import Link from 'next/link';
import connectDB from '@/lib/db/mongoose';
import { Release } from '@/lib/db/models/Release';
import { Analysis } from '@/lib/db/models/Analysis';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Rocket, 
  FileEdit, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  XCircle,
  FileCheck2
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

export default async function DashboardPage() {
  let stats = {
    total: 0,
    draft: 0,
    needsReview: 0,
    approved: 0,
    rejected: 0,
    analysisComplete: 0,
  };
  let recentReleases: Array<{
    _id: string;
    version: string;
    status: string;
    createdAt: string | Date;
    validationResult: { isComplete: boolean; missingFields: string[] };
    releasePackage: {
      completedFeatures: unknown[];
      bugFixes: unknown[];
      changedBehaviour: unknown[];
    };
    analysis?: {
      readiness: string;
      risks: Array<{ severity: string }>;
    } | null;
  }> = [];

  try {
    await connectDB();
    const [total, draft, needsReview, approved, rejected, analysisComplete] = await Promise.all([
      Release.countDocuments(),
      Release.countDocuments({ status: 'draft' }),
      Release.countDocuments({ status: 'needs_review' }),
      Release.countDocuments({ status: 'approved' }),
      Release.countDocuments({ status: 'rejected' }),
      Release.countDocuments({ status: 'analysis_complete' }),
    ]);
    stats = { total, draft, needsReview, approved, rejected, analysisComplete };

    const rawReleases = await Release.find().sort({ createdAt: -1 }).limit(6).lean();
    
    // Fetch associated analysis readiness for each release
    recentReleases = await Promise.all(
      rawReleases.map(async (r) => {
        const analysis = await Analysis.findOne({ releaseId: r._id }, { readiness: 1, risks: 1 }).lean();
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
          } : null,
        };
      })
    );
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Hero Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 border border-indigo-400/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            Reliable Release Governance Platform
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Release Communication &amp; Readiness Brief Assistant
          </h1>
          <p className="text-sm text-indigo-100/90 leading-relaxed">
            A hybrid release governance platform utilizing deterministic checks for missing information, semver preservation, evidence citations, AI impact &amp; unsupported claim detection, and mandatory human-in-the-loop sign-off.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/releases/create"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-900 hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Create Release Package
            </Link>
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-700/60 border border-indigo-500/40 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Compare Versions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-600">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Releases</CardDescription>
              <Rocket className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl font-bold mt-1">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-slate-500">
            Persisted historical semver releases
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-slate-400">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Draft Releases</CardDescription>
              <FileEdit className="h-4 w-4 text-slate-500" />
            </div>
            <CardTitle className="text-3xl font-bold mt-1">{stats.draft}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-slate-500">
            Awaiting AI analysis workflow
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Needs Review</CardDescription>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <CardTitle className="text-3xl font-bold mt-1">{stats.needsReview + stats.analysisComplete}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-slate-500">
            Requires human approval/edit
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Approved</CardDescription>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl font-bold mt-1">{stats.approved}</CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-xs text-slate-500">
            Human-approved release briefs
          </CardContent>
        </Card>
      </div>

      {/* Recent Releases Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Recent Releases</h2>
            <p className="text-sm text-slate-500">Latest release packages submitted for readiness analysis</p>
          </div>
          <Link
            href="/releases"
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all releases
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {recentReleases.length === 0 ? (
          <Card className="border-dashed p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Rocket className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">No releases found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Get started by creating your first structured release package with QA evidence.
            </p>
            <div className="mt-6">
              <Link
                href="/releases/create"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Create Release
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentReleases.map((release) => {
              const highRisksCount = release.analysis?.risks?.filter((r) => r.severity === 'high').length ?? 0;

              return (
                <Card key={release._id} className="transition-all hover:shadow-md flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                          v{release.version}
                        </span>
                      </div>
                      {getStatusBadge(release.status)}
                    </div>
                    <CardDescription className="text-xs pt-1">
                      Created on {new Date(release.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-5 py-2 space-y-3 flex-1 text-xs">
                    {/* Validation Status */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">Deterministic check:</span>
                      {release.validationResult.isComplete ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> All fields present
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {release.validationResult.missingFields.length} missing field(s)
                        </span>
                      )}
                    </div>

                    {/* AI Readiness Status */}
                    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500">AI Readiness:</span>
                      {release.analysis ? (
                        <span className="font-medium capitalize text-slate-800 dark:text-slate-200">
                          {release.analysis.readiness.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not analyzed yet</span>
                      )}
                    </div>

                    {/* High Risk Count */}
                    {release.analysis && (
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500">High Risks:</span>
                        <span className={`font-semibold ${highRisksCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {highRisksCount} flagged
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Link
                      href={`/releases/${release._id}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      View Details &amp; Analysis
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
