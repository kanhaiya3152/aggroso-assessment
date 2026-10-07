'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  XCircle, 
  FileCheck2, 
  ShieldAlert, 
  Info, 
  Edit3, 
  ThumbsUp, 
  ThumbsDown, 
  Layers, 
  FileText,
  Search,
  ExternalLink,
  Save,
  Check,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { 
  Release, 
  Analysis, 
  Review, 
  ImpactLevel, 
  SeverityLevel 
} from '@/types';

interface ReleaseDetailViewProps {
  initialRelease: Release;
  initialAnalysis: Analysis | null;
  initialReview: Review | null;
}

export function ReleaseDetailView({
  initialRelease,
  initialAnalysis,
  initialReview,
}: ReleaseDetailViewProps) {
  const router = useRouter();
  const [release, setRelease] = React.useState<Release>(initialRelease);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(initialAnalysis);
  const [review, setReview] = React.useState<Review | null>(initialReview);

  // Loading and error states
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null);

  // Evidence Inspector Modal State
  const [inspectEvidenceId, setInspectEvidenceId] = React.useState<string | null>(null);

  // Human Review Editing Modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editTechnicalBrief, setEditTechnicalBrief] = React.useState('');
  const [editStakeholderBrief, setEditStakeholderBrief] = React.useState('');
  const [reviewNotes, setReviewNotes] = React.useState('');

  // Active brief tab in viewer
  const [activeBriefTab, setActiveBriefTab] = React.useState<'technical' | 'stakeholder' | 'final'>('technical');

  // Initialize edit fields when analysis is loaded
  React.useEffect(() => {
    if (review) {
      setEditTechnicalBrief(review.technicalBrief);
      setEditStakeholderBrief(review.stakeholderBrief);
      setReviewNotes(review.reviewNotes || '');
    } else if (analysis) {
      setEditTechnicalBrief(analysis.technicalBrief);
      setEditStakeholderBrief(analysis.stakeholderBrief);
    }
  }, [analysis, review]);

  // Lookup release item text by ID
  const getEvidenceItem = (id: string) => {
    const pkg = release.releasePackage;
    const allItems = [
      ...pkg.completedFeatures,
      ...pkg.bugFixes,
      ...pkg.changedBehaviour,
      ...pkg.qaSummary,
      ...pkg.knownLimitations,
      ...pkg.migrationNotes,
      ...pkg.affectedUserGroups,
    ];
    return allItems.find((item) => item.id.toUpperCase() === id.toUpperCase());
  };

  // Trigger AI Analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/releases/${release._id}/analyze`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze release');
      }

      setAnalysis(data.data);
      setRelease((prev) => ({ ...prev, status: 'analysis_complete' }));
      setActionSuccess('Release analyzed successfully by AI reasoning workflow!');
      router.refresh();
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed. Please check Gemini API key configuration.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit Human Review (approve / reject / edit)
  const handleReviewAction = async (action: 'approve' | 'reject' | 'edit') => {
    setIsReviewing(true);
    setActionSuccess(null);

    try {
      const payload = {
        action,
        technicalBrief: editTechnicalBrief,
        stakeholderBrief: editStakeholderBrief,
        reviewNotes,
        editedFields: ['technicalBrief', 'stakeholderBrief'],
      };

      const res = await fetch(`/api/releases/${release._id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Review submission failed');
      }

      setReview(data.data);
      setRelease((prev) => ({ ...prev, status: data.data.status }));
      setIsEditModalOpen(false);

      if (action === 'approve') {
        setActionSuccess('Release successfully approved by human reviewer!');
      } else if (action === 'reject') {
        setActionSuccess('Release rejected by human reviewer.');
      } else {
        setActionSuccess('Briefs updated. Status set to Needs Review.');
      }

      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Review action failed');
    } finally {
      setIsReviewing(false);
    }
  };

  // Helper renderers
  const renderImpactBadge = (impact: ImpactLevel) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">High Impact</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="default">Low Impact</Badge>;
      default:
        return <Badge variant="secondary">No Direct Impact</Badge>;
    }
  };

  const renderSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High Severity</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium Severity</Badge>;
      default:
        return <Badge variant="default">Low Severity</Badge>;
    }
  };

  const currentTechnicalBrief = review?.technicalBrief || analysis?.technicalBrief || '';
  const currentStakeholderBrief = review?.stakeholderBrief || analysis?.stakeholderBrief || '';
  const inspectedItem = inspectEvidenceId ? getEvidenceItem(inspectEvidenceId) : null;

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {actionSuccess && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{actionSuccess}</AlertDescription>
        </Alert>
      )}

      {analysisError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Analysis Notice</AlertTitle>
          <AlertDescription>
            {analysisError}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">
              v{release.version}
            </h1>
            <Badge
              variant={
                release.status === 'approved'
                  ? 'success'
                  : release.status === 'rejected'
                  ? 'destructive'
                  : release.status === 'needs_review'
                  ? 'warning'
                  : 'secondary'
              }
              className="text-xs uppercase font-bold"
            >
              {release.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Created on {new Date(release.createdAt).toLocaleString()} &bull; Immutable Version History
          </p>
        </div>

        {/* AI & Review Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Analyze with AI Button */}
          <Button
            onClick={handleRunAnalysis}
            isLoading={isAnalyzing}
            variant={analysis ? 'outline' : 'default'}
            size="sm"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {analysis ? 'Re-analyze Release' : 'Analyze Release'}
          </Button>

          {/* Edit Briefs Button */}
          {analysis && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Briefs
            </Button>
          )}

          {/* Human Approve Button */}
          {analysis && release.status !== 'approved' && (
            <Button
              onClick={() => handleReviewAction('approve')}
              isLoading={isReviewing}
              variant="success"
              size="sm"
              className="gap-1.5"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve Release
            </Button>
          )}

          {/* Human Reject Button */}
          {analysis && release.status !== 'rejected' && (
            <Button
              onClick={() => handleReviewAction('reject')}
              isLoading={isReviewing}
              variant="destructive"
              size="sm"
              className="gap-1.5"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject Release
            </Button>
          )}

          <Link
            href={`/compare?releaseA=${release._id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            Compare
          </Link>
        </div>
      </div>

      {/* Safety Notice: AI Never Automatically Approves */}
      <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <Info className="h-4 w-4 text-indigo-600 shrink-0" />
        <span>
          <strong>AI Safety Rule:</strong> AI provides reasoning and draft briefs, but <em>never</em> automatically approves releases. Final status requires explicit human review and sign-off.
        </span>
      </div>

      {/* Deterministic Validation Panel */}
      <Card className="border-l-4 border-l-indigo-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              Deterministic Required-Field Validation
            </CardTitle>
            {release.validationResult.isComplete ? (
              <Badge variant="success">All Required Fields Present</Badge>
            ) : (
              <Badge variant="warning">Incomplete Release Info</Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Evaluated by deterministic code before AI reasoning. Validates 8 core release sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!release.validationResult.isComplete && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg text-xs space-y-1 text-amber-900 dark:text-amber-200">
              <span className="font-semibold">Missing required fields:</span>
              <ul className="list-disc pl-5">
                {release.validationResult.missingFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Package Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2 text-center text-xs">
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.completedFeatures.length}
              </div>
              <div className="text-[11px] text-slate-500">Features</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.bugFixes.length}
              </div>
              <div className="text-[11px] text-slate-500">Bug Fixes</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.changedBehaviour.length}
              </div>
              <div className="text-[11px] text-slate-500">Behaviour</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.qaSummary.length}
              </div>
              <div className="text-[11px] text-slate-500">QA Items</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.knownLimitations.length}
              </div>
              <div className="text-[11px] text-slate-500">Limitations</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.migrationNotes.length}
              </div>
              <div className="text-[11px] text-slate-500">Migrations</div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="font-bold text-slate-900 dark:text-white">
                {release.releasePackage.affectedUserGroups.length}
              </div>
              <div className="text-[11px] text-slate-500">User Groups</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Section */}
      {!analysis ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            Release Analysis Not Performed Yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Click &quot;Analyze Release&quot; to trigger the AI reasoning workflow to classify impact, detect unsupported QA claims, identify risks, and generate briefs.
          </p>
          <div className="mt-6">
            <Button
              onClick={handleRunAnalysis}
              isLoading={isAnalyzing}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Start AI Analysis Workflow
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Analysis Readiness Metric Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  analysis.readiness === 'ready'
                    ? 'bg-emerald-100 text-emerald-700'
                    : analysis.readiness === 'needs_review'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">AI Readiness</div>
                <div className="text-lg font-bold capitalize text-slate-900 dark:text-white">
                  {analysis.readiness.replace('_', ' ')}
                </div>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Identified Risks</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {analysis.risks.length} Risk{analysis.risks.length !== 1 ? 's' : ''} Flagged
                </div>
              </div>
            </Card>

            <Card className="p-5 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Unsupported Claims</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">
                  {analysis.unsupportedClaims.length} Claim{analysis.unsupportedClaims.length !== 1 ? 's' : ''} Unsubstantiated
                </div>
              </div>
            </Card>
          </div>

          {/* Section: Unsupported Claim Detection (Critical Feature) */}
          <Card className="border-rose-200 dark:border-rose-900/50 shadow-sm">
            <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-rose-950 dark:text-rose-200 flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Unsupported Claim Detection
                </CardTitle>
                <Badge variant={analysis.unsupportedClaims.length > 0 ? 'destructive' : 'success'}>
                  {analysis.unsupportedClaims.length} Flagged
                </Badge>
              </div>
              <CardDescription className="text-xs text-rose-900/70 dark:text-rose-300/70">
                Flags statements that overpromise or contradict supplied QA evidence (e.g. claiming complete testing when tests failed).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {analysis.unsupportedClaims.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  No unsupported claims detected. Release statements align with supplied QA evidence.
                </p>
              ) : (
                analysis.unsupportedClaims.map((item, idx) => (
                  <div key={idx} className="py-4 space-y-2 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold text-slate-500">Claim:</span>
                        <p className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                          &quot;{item.claim}&quot;
                        </p>
                      </div>
                      {renderSeverityBadge(item.severity)}
                    </div>
                    <div className="p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-lg text-xs space-y-1 text-slate-800 dark:text-slate-200">
                      <span className="font-semibold text-rose-900 dark:text-rose-300">Why evidence is insufficient:</span>
                      <p>{item.reason}</p>
                    </div>
                    {item.evidence && item.evidence.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                        <span>Related evidence:</span>
                        {item.evidence.map((ev) => (
                          <button
                            key={ev}
                            onClick={() => setInspectEvidenceId(ev)}
                            className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                          >
                            [{ev}]
                            <Search className="h-2.5 w-2.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Section: User Impact Classification */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                User Impact Classification
              </CardTitle>
              <CardDescription className="text-xs">
                Classification of release changes by degree of direct disruption or value to end-users.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
              {analysis.impactAnalysis.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No user impact classifications available.</p>
              ) : (
                analysis.impactAnalysis.map((item, idx) => (
                  <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 first:pt-0 last:pb-0">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {item.changeId && (
                          <button
                            onClick={() => setInspectEvidenceId(item.changeId)}
                            className="font-mono text-xs font-bold text-indigo-600 hover:underline"
                          >
                            [{item.changeId}]
                          </button>
                        )}
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.change}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {item.reason}
                      </p>
                    </div>
                    <div className="shrink-0">{renderImpactBadge(item.impact)}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Section: Known Risks & Limitations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                  Identified Risks
                </CardTitle>
                <CardDescription className="text-xs">
                  Risks synthesized from failed tests, behavior shifts, and migration notes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.risks.length === 0 ? (
                  <p className="text-xs text-slate-500">No active risks identified.</p>
                ) : (
                  analysis.risks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {risk.risk}
                        </span>
                        {renderSeverityBadge(risk.severity)}
                      </div>
                      {risk.evidence && risk.evidence.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                          <span>Evidence:</span>
                          {risk.evidence.map((ev) => (
                            <button
                              key={ev}
                              onClick={() => setInspectEvidenceId(ev)}
                              className="font-mono text-indigo-600 font-semibold hover:underline"
                            >
                              [{ev}]
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-5 w-5 text-slate-600" />
                  Missing Contextual Gaps (AI Identified)
                </CardTitle>
                <CardDescription className="text-xs">
                  Contextual ambiguities in release notes (distinguished from required fields).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.missingInformation.length === 0 ? (
                  <p className="text-xs text-slate-500">No contextual gaps identified.</p>
                ) : (
                  analysis.missingInformation.map((gap, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">{gap.field}</span>
                        {renderSeverityBadge(gap.severity)}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{gap.reason}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Section: Generated Release Briefs (Technical vs Non-technical Stakeholder) */}
          <Card className="border-indigo-200 dark:border-indigo-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Release Communication Briefs
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Targeted briefs with evidence citations. Edit, approve, or reject to produce the final brief.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsEditModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Content
                  </Button>
                </div>
              </div>

              {/* Brief Tabs */}
              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => setActiveBriefTab('technical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeBriefTab === 'technical'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Technical Release Brief (Engineers / QA)
                </button>
                <button
                  onClick={() => setActiveBriefTab('stakeholder')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeBriefTab === 'stakeholder'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Stakeholder Brief (Customers / Business)
                </button>
                <button
                  onClick={() => setActiveBriefTab('final')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeBriefTab === 'final'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  Final Reviewed Brief
                </button>
              </div>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Technical Brief Tab */}
              {activeBriefTab === 'technical' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
                    <span>Audience: Developers, QA Engineers, Engineering Managers</span>
                    {review?.editedFields.includes('technicalBrief') && (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Edit3 className="h-3 w-3" /> Modified by human reviewer
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {currentTechnicalBrief || 'No technical brief generated.'}
                  </div>
                </div>
              )}

              {/* Stakeholder Brief Tab */}
              {activeBriefTab === 'stakeholder' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
                    <span>Audience: Customers, Product Managers, Non-technical Users</span>
                    {review?.editedFields.includes('stakeholderBrief') && (
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Edit3 className="h-3 w-3" /> Modified by human reviewer
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {currentStakeholderBrief || 'No stakeholder brief generated.'}
                  </div>
                </div>
              )}

              {/* Final Reviewed Brief Tab */}
              {activeBriefTab === 'final' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-xs text-slate-500 border-b pb-2">
                    <span>Executive Summary &amp; Review Status</span>
                    <Badge
                      variant={release.status === 'approved' ? 'success' : 'secondary'}
                      className="capitalize"
                    >
                      Status: {release.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900/60 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Final Release Brief &bull; v{release.version}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="font-semibold text-slate-500">Human Review Status:</span>
                        <p className="capitalize font-bold text-slate-800 dark:text-slate-200">
                          {release.status.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-500">Reviewed Date:</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {review?.reviewedAt
                            ? new Date(review.reviewedAt).toLocaleString()
                            : 'Pending human sign-off'}
                        </p>
                      </div>
                    </div>

                    {review?.reviewNotes && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-xs">
                        <span className="font-bold text-indigo-900 dark:text-indigo-200">Reviewer Notes:</span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-300">{review.reviewNotes}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Technical Summary
                      </h4>
                      <p className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-300">
                        {currentTechnicalBrief}
                      </p>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Stakeholder Customer Summary
                      </h4>
                      <p className="whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-300">
                        {currentStakeholderBrief}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evidence Inspector Modal */}
      <Modal
        isOpen={Boolean(inspectEvidenceId)}
        onClose={() => setInspectEvidenceId(null)}
        title={`Evidence Inspector: ${inspectEvidenceId}`}
        description="Inspect the original release package item referenced by this citation."
      >
        {inspectedItem ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono font-bold text-indigo-600">ID: {inspectedItem.id}</span>
                <span>Original Release Item</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                {inspectedItem.text}
              </p>
            </div>
            <p className="text-xs text-slate-500">
              This statement serves as verifiable ground truth evidence for the AI analysis claim.
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Item not found in current release package.</p>
        )}
      </Modal>

      {/* Human Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Human-in-the-Loop: Edit Release Briefs"
        description="Modify AI-generated summaries and add reviewer notes. AI never overwrites human edits."
        className="max-w-3xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Technical Brief (Engineers &amp; QA)
            </label>
            <Textarea
              rows={6}
              value={editTechnicalBrief}
              onChange={(e) => setEditTechnicalBrief(e.target.value)}
              placeholder="Technical brief content..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Stakeholder / Customer Brief
            </label>
            <Textarea
              rows={6}
              value={editStakeholderBrief}
              onChange={(e) => setEditStakeholderBrief(e.target.value)}
              placeholder="Non-technical customer brief content..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Reviewer Notes (Optional)
            </label>
            <Textarea
              rows={2}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Reason for modifications or approval remarks..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              isLoading={isReviewing}
              onClick={() => handleReviewAction('edit')}
              className="gap-1.5"
            >
              <Save className="h-4 w-4" />
              Save Edits
            </Button>
            <Button
              type="button"
              variant="success"
              size="sm"
              isLoading={isReviewing}
              onClick={() => handleReviewAction('approve')}
              className="gap-1.5"
            >
              <ThumbsUp className="h-4 w-4" />
              Save &amp; Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
