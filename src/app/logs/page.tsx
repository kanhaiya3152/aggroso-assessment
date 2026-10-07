import connectDB from '@/lib/db/mongoose';
import { Log } from '@/lib/db/models/Log';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollText, ShieldCheck, Clock, Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getEventBadge(event: string) {
  switch (event) {
    case 'RELEASE_CREATED':
      return <Badge variant="default">RELEASE_CREATED</Badge>;
    case 'AI_ANALYSIS_STARTED':
      return <Badge variant="secondary">AI_ANALYSIS_STARTED</Badge>;
    case 'AI_ANALYSIS_COMPLETED':
      return <Badge variant="success">AI_ANALYSIS_COMPLETED</Badge>;
    case 'AI_ANALYSIS_FAILED':
      return <Badge variant="destructive">AI_ANALYSIS_FAILED</Badge>;
    case 'BRIEF_GENERATED':
      return <Badge variant="default">BRIEF_GENERATED</Badge>;
    case 'BRIEF_EDITED':
      return <Badge variant="warning">BRIEF_EDITED</Badge>;
    case 'BRIEF_APPROVED':
      return <Badge variant="success">BRIEF_APPROVED</Badge>;
    case 'BRIEF_REJECTED':
      return <Badge variant="destructive">BRIEF_REJECTED</Badge>;
    case 'RELEASE_COMPARED':
      return <Badge variant="secondary">RELEASE_COMPARED</Badge>;
    default:
      return <Badge variant="outline">{event}</Badge>;
  }
}

export default async function LogsPage() {
  let logs: Array<{
    _id: string;
    event: string;
    releaseId?: string;
    metadata: Record<string, unknown>;
    createdAt: string | Date;
  }> = [];

  try {
    await connectDB();
    const rawLogs = await Log.find().sort({ createdAt: -1 }).limit(100).lean();
    logs = JSON.parse(JSON.stringify(rawLogs));
  } catch (err) {
    console.error('Failed to load logs:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            System &amp; AI Workflow Logs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Immutable audit trail of release lifecycle events, AI reasoning steps, and human approvals.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Sanitized: Secrets &amp; credentials stripped</span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-4 w-4 text-indigo-600" />
              Event Stream ({logs.length} entries)
            </CardTitle>
            <span className="text-xs text-slate-400">Showing last 100 entries</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              <ScrollText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No events recorded yet. Actions like creating a release or analyzing will generate logs.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {getEventBadge(log.event)}
                      {log.releaseId && (
                        <span className="font-mono text-xs text-slate-500">
                          Release: {log.releaseId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2.5">
                      <pre className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-[11px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto border border-slate-100 dark:border-slate-800">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
