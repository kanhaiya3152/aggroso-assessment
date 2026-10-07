'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';

interface FormState {
  version: string;
  completedFeatures: string[];
  bugFixes: string[];
  changedBehaviour: string[];
  qaSummary: string[];
  knownLimitations: string[];
  migrationNotes: string[];
  affectedUserGroups: string[];
}

const SAMPLE_RELEASE: FormState = {
  version: '2.5.0',
  completedFeatures: [
    'Added CSV export functionality',
    'Added dark mode theme option',
    'Added user profile editing',
  ],
  bugFixes: [
    'Fixed login session timeout bug',
    'Fixed incorrect analytics dashboard calculation',
  ],
  changedBehaviour: [
    'Session timeout changed from 60 days to 30 days',
  ],
  qaSummary: [
    '120 tests executed',
    '115 passed',
    '5 failed',
    'CSV export tests failed',
  ],
  knownLimitations: [
    'CSV export supports files up to 50MB only',
  ],
  migrationNotes: [
    'Database migration v12 required prior to deployment',
  ],
  affectedUserGroups: [
    'All active web users',
    'Enterprise customers with custom timeouts',
  ],
};

const EMPTY_STATE: FormState = {
  version: '',
  completedFeatures: [''],
  bugFixes: [''],
  changedBehaviour: [''],
  qaSummary: [''],
  knownLimitations: [''],
  migrationNotes: [''],
  affectedUserGroups: [''],
};

export function ReleaseCreateForm() {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(EMPTY_STATE);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // List field updater
  const updateListField = (field: keyof Omit<FormState, 'version'>, index: number, value: string) => {
    setForm((prev) => {
      const copy = [...prev[field]];
      copy[index] = value;
      return { ...prev, [field]: copy };
    });
  };

  const addListItem = (field: keyof Omit<FormState, 'version'>) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeListItem = (field: keyof Omit<FormState, 'version'>, index: number) => {
    setForm((prev) => {
      const copy = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: copy.length > 0 ? copy : [''] };
    });
  };

  const handlePreFill = () => {
    setForm(SAMPLE_RELEASE);
    setValidationErrors([]);
    setError(null);
  };

  const handleReset = () => {
    setForm(EMPTY_STATE);
    setValidationErrors([]);
    setError(null);
  };

  // Client-side deterministic validation before submit
  const performValidation = (): { isComplete: boolean; missingFields: string[] } => {
    const missing: string[] = [];

    if (!form.version.trim()) missing.push('Release Version');
    if (form.completedFeatures.filter((s) => s.trim()).length === 0)
      missing.push('Completed Features');
    if (form.bugFixes.filter((s) => s.trim()).length === 0)
      missing.push('Bug Fixes');
    if (form.changedBehaviour.filter((s) => s.trim()).length === 0)
      missing.push('Changed Behaviour');
    if (form.qaSummary.filter((s) => s.trim()).length === 0)
      missing.push('QA Summary');
    if (form.knownLimitations.filter((s) => s.trim()).length === 0)
      missing.push('Known Limitations');
    if (form.migrationNotes.filter((s) => s.trim()).length === 0)
      missing.push('Migration / Configuration Notes');
    if (form.affectedUserGroups.filter((s) => s.trim()).length === 0)
      missing.push('Affected User Groups');

    return {
      isComplete: missing.length === 0,
      missingFields: missing,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clientValidation = performValidation();
    if (!form.version.trim()) {
      setError('Please provide a release version (e.g., 2.5.0)');
      return;
    }

    if (!clientValidation.isComplete) {
      setValidationErrors(clientValidation.missingFields);
      // We still allow user to continue where appropriate, but release will indicate incomplete
    } else {
      setValidationErrors([]);
    }

    setIsSubmitting(true);

    try {
      const payload = {
        version: form.version.trim(),
        releasePackage: {
          completedFeatures: form.completedFeatures.map((s) => s.trim()).filter(Boolean),
          bugFixes: form.bugFixes.map((s) => s.trim()).filter(Boolean),
          changedBehaviour: form.changedBehaviour.map((s) => s.trim()).filter(Boolean),
          qaSummary: form.qaSummary.map((s) => s.trim()).filter(Boolean),
          knownLimitations: form.knownLimitations.map((s) => s.trim()).filter(Boolean),
          migrationNotes: form.migrationNotes.map((s) => s.trim()).filter(Boolean),
          affectedUserGroups: form.affectedUserGroups.map((s) => s.trim()).filter(Boolean),
        },
      };

      const res = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create release');
      }

      // Automatically redirect to the release analysis page
      router.push(`/releases/${data.data._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Action banner with prefill button for evaluator convenience */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/30">
        <div className="flex items-center gap-2 text-sm text-indigo-950 dark:text-indigo-200">
          <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0" />
          <span>
            Testing the assessment? Pre-fill with sample assessment data (v2.5.0 with failed QA and timeout changes).
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handlePreFill}
            className="text-xs bg-indigo-700 hover:bg-indigo-800 text-white"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Pre-fill Sample Package
          </Button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Deterministic Missing Fields Warning */}
      {validationErrors.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Deterministic Check: Incomplete Release Information</AlertTitle>
          <AlertDescription className="space-y-2 mt-1">
            <p>
              The following required release package fields are currently empty:
            </p>
            <ul className="list-disc pl-5 font-medium">
              {validationErrors.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
              You can still submit this package, but it will be flagged with incomplete information during review.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>1. Release Version</CardTitle>
          <CardDescription>
            Specify the semantic version identifier for this software package (e.g. 2.5.0). Versions are immutable once created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Input
              placeholder="e.g. 2.5.0"
              value={form.version}
              onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Completed Features */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>2. Completed Features</CardTitle>
            <CardDescription>
              New user-facing capabilities or functionality added in this release.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('completedFeatures')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Feature
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.completedFeatures.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                FEATURE-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. Added CSV export functionality"
                value={item}
                onChange={(e) => updateListField('completedFeatures', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('completedFeatures', idx)}
                disabled={form.completedFeatures.length === 1 && !item}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bug Fixes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>3. Bug Fixes</CardTitle>
            <CardDescription>
              Defects, crashes, or incorrect calculations fixed in this release.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('bugFixes')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Bug Fix
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.bugFixes.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                BUG-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. Fixed login timeout"
                value={item}
                onChange={(e) => updateListField('bugFixes', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('bugFixes', idx)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Changed Behaviour */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>4. Changed Behaviour</CardTitle>
            <CardDescription>
              Modifications to existing behaviors, workflows, or defaults that could affect active users.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('changedBehaviour')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Behaviour Change
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.changedBehaviour.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                BEHAVIOR-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. Session timeout changed from 60 days to 30 days"
                value={item}
                onChange={(e) => updateListField('changedBehaviour', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('changedBehaviour', idx)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* QA Summary */}
      <Card className="border-indigo-100 dark:border-indigo-950">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-indigo-950 dark:text-indigo-200">5. QA Summary &amp; Evidence</CardTitle>
            <CardDescription>
              Test execution counts, passed/failed metrics, and test evidence used to verify claims.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('qaSummary')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add QA Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.qaSummary.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                QA-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. 120 tests executed, 115 passed, 5 failed"
                value={item}
                onChange={(e) => updateListField('qaSummary', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('qaSummary', idx)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Known Limitations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>6. Known Limitations</CardTitle>
            <CardDescription>
              Boundaries, quotas, or unsupported scenarios in this release (e.g. file size limits).
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('knownLimitations')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Limitation
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.knownLimitations.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                LIMITATION-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. CSV export supports files up to 50MB"
                value={item}
                onChange={(e) => updateListField('knownLimitations', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('knownLimitations', idx)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Migration / Configuration Notes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>7. Migration / Configuration Notes</CardTitle>
            <CardDescription>
              Required database migrations, environment variable updates, or operational steps.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('migrationNotes')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Migration Note
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.migrationNotes.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                MIGRATION-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. Database migration v12 required"
                value={item}
                onChange={(e) => updateListField('migrationNotes', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('migrationNotes', idx)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Affected User Groups */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>8. Affected User Groups</CardTitle>
            <CardDescription>
              Cohorts, customer tiers, or roles impacted by this release package.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addListItem('affectedUserGroups')}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add User Group
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.affectedUserGroups.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400 w-24 shrink-0">
                USERGROUP-{String(idx + 1).padStart(3, '0')}
              </span>
              <Input
                placeholder="e.g. All users, Enterprise customers"
                value={item}
                onChange={(e) => updateListField('affectedUserGroups', idx, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeListItem('affectedUserGroups', idx)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Submit footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Ready for Review</h4>
          <p className="text-xs text-slate-500">
            Saves release package with deterministic ID generation and opens the Readiness Analysis view.
          </p>
        </div>
        <Button
          type="submit"
          size="lg"
          isLoading={isSubmitting}
          className="w-full sm:w-auto font-semibold gap-2"
        >
          <span>Create &amp; Analyze Release</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
