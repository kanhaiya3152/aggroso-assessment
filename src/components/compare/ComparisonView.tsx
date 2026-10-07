'use client';

import * as React from 'react';
import { 
  GitCompare, 
  PlusCircle, 
  MinusCircle, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight,
  FileText,
  Search,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Release, ComparisonResult } from '@/types';

interface ComparisonViewProps {
  releases: Release[];
  initialReleaseAId?: string;
  initialReleaseBId?: string;
}

export function ComparisonView({
  releases,
  initialReleaseAId,
  initialReleaseBId,
}: ComparisonViewProps) {
  const [releaseAId, setReleaseAId] = React.useState<string>(
    initialReleaseAId || (releases.length > 1 ? releases[1]._id : releases[0]?._id || '')
  );
  const [releaseBId, setReleaseBId] = React.useState<string>(
    initialReleaseBId || releases[0]?._id || ''
  );
  const [comparison, setComparison] = React.useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Evidence Modal for stale statement citations
  const [inspectedStatement, setInspectedStatement] = React.useState<{
    statement: string;
    reason: string;
    newEvidenceIds: string[];
  } | null>(null);

  const handleCompare = async () => {
    if (!releaseAId || !releaseBId) {
      setError('Please select both releases to compare.');
      return;
    }
    if (releaseAId === releaseBId) {
      setError('Please select two different release versions.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseAId, releaseBId }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to compare releases');
      }

      setComparison(data.data.comparisonResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto trigger compare on initial load if two different releases are available
  React.useEffect(() => {
    if (releaseAId && releaseBId && releaseAId !== releaseBId && !comparison) {
      const timeoutId = window.setTimeout(() => {
        void handleCompare();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  const releaseA = releases.find((r) => r._id === releaseAId);
  const releaseB = releases.find((r) => r._id === releaseBId);

  return (
    <div className="space-y-8">
      {/* Release Selection Controls */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Base Release (Version A / Older)
            </label>
            <select
              value={releaseAId}
              onChange={(e) => setReleaseAId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">Select Release A...</option>
              {releases.map((r) => (
                <option key={r._id} value={r._id}>
                  v{r.version} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center items-center py-2 md:py-0">
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <GitCompare className="h-4 w-4" />
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Target Release (Version B / Newer)
            </label>
            <select
              value={releaseBId}
              onChange={(e) => setReleaseBId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
            >
              <option value="">Select Release B...</option>
              {releases.map((r) => (
                <option key={r._id} value={r._id}>
                  v{r.version} ({new Date(r.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Compares additions, deletions, QA status deltas, and detects stale documentation statements.
          </p>
          <Button
            onClick={handleCompare}
            isLoading={isLoading}
            size="sm"
            className="gap-2"
          >
            <GitCompare className="h-4 w-4" />
            Run Comparison
          </Button>
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Comparison Results */}
      {comparison && releaseA && releaseB && (
        <div className="space-y-6">
          {/* Header summary banner */}
          <div className="flex items-center justify-between p-4 bg-slate-100/80 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
                v{releaseA.version}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                v{releaseB.version}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="success">+{comparison.added.length} Added</Badge>
              <Badge variant="destructive">-{comparison.removed.length} Removed</Badge>
              {comparison.staleStatements.length > 0 && (
                <Badge variant="warning">{comparison.staleStatements.length} Stale</Badge>
              )}
            </div>
          </div>

          {/* Stale Statement Detection Section (Section 13 of requirements) */}
          <Card className="border-amber-200 dark:border-amber-900/50">
            <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-amber-950 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Stale Statement Detection
                </CardTitle>
                <Badge variant={comparison.staleStatements.length > 0 ? 'warning' : 'success'}>
                  {comparison.staleStatements.length} Stale Statements
                </Badge>
              </div>
              <CardDescription className="text-xs text-amber-900/70 dark:text-amber-300/70">
                Detects claims from v{releaseA.version} that became outdated or superseded by v{releaseB.version}.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {comparison.staleStatements.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  No stale statements detected between v{releaseA.version} and v{releaseB.version}.
                </p>
              ) : (
                comparison.staleStatements.map((stale, idx) => (
                  <div key={idx} className="py-3 space-y-2 first:pt-0 last:pb-0 text-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="font-semibold text-slate-500">Previous Statement (v{stale.previousVersion}):</span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                          &quot;{stale.statement}&quot;
                        </p>
                      </div>
                      <Badge variant="warning">STALE</Badge>
                    </div>
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-lg space-y-1">
                      <span className="font-semibold text-amber-900 dark:text-amber-300">Why statement is stale:</span>
                      <p className="text-slate-700 dark:text-slate-300">{stale.reason}</p>
                    </div>
                    {stale.newEvidenceIds && stale.newEvidenceIds.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-slate-500">
                        <span>New evidence IDs:</span>
                        {stale.newEvidenceIds.map((id) => (
                          <span
                            key={id}
                            className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold text-indigo-600"
                          >
                            [{id}]
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Added & Removed Differences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Added Items */}
            <Card className="border-emerald-200 dark:border-emerald-900/50">
              <CardHeader className="pb-3 bg-emerald-50/30 dark:bg-emerald-950/20">
                <CardTitle className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-emerald-600" />
                  Added in v{releaseB.version} ({comparison.added.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.added.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No items added.</p>
                ) : (
                  comparison.added.map((item, idx) => (
                    <div key={idx} className="py-2.5 text-xs space-y-1 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          + {item.field}
                        </span>
                        {item.itemId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            [{item.itemId}]
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 pl-3">{item.text}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Removed Items */}
            <Card className="border-rose-200 dark:border-rose-900/50">
              <CardHeader className="pb-3 bg-rose-50/30 dark:bg-rose-950/20">
                <CardTitle className="text-sm font-bold text-rose-950 dark:text-rose-200 flex items-center gap-2">
                  <MinusCircle className="h-4 w-4 text-rose-600" />
                  Removed or Deprecated from v{releaseA.version} ({comparison.removed.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {comparison.removed.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">No items removed.</p>
                ) : (
                  comparison.removed.map((item, idx) => (
                    <div key={idx} className="py-2.5 text-xs space-y-1 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-rose-700 dark:text-rose-400">
                          - {item.field}
                        </span>
                        {item.itemId && (
                          <span className="font-mono text-[10px] text-slate-400">
                            [{item.itemId}]
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 pl-3 line-through text-slate-400">
                        {item.text}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* QA Evolution Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                QA Evidence Comparison
              </CardTitle>
              <CardDescription className="text-xs">
                Comparison of test execution metrics between releases
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                <span className="font-bold text-slate-900 dark:text-white">v{releaseA.version} QA Items:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  {comparison.qaChanges.summaryA.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl space-y-2 border border-indigo-100 dark:border-indigo-900">
                <span className="font-bold text-indigo-950 dark:text-indigo-200">v{releaseB.version} QA Items:</span>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-300">
                  {comparison.qaChanges.summaryB.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
