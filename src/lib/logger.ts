import { Log } from '@/lib/db/models/Log';
import connectDB from '@/lib/db/mongoose';

type LogEvent =
  | 'RELEASE_CREATED'
  | 'RELEASE_UPDATED'
  | 'AI_ANALYSIS_STARTED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'AI_ANALYSIS_FAILED'
  | 'BRIEF_GENERATED'
  | 'BRIEF_EDITED'
  | 'BRIEF_APPROVED'
  | 'BRIEF_REJECTED'
  | 'RELEASE_COMPARED';

interface LogOptions {
  event: LogEvent;
  releaseId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Structured application logger.
 * Never logs secrets, API keys, or sensitive credentials.
 */
export async function createLog(options: LogOptions): Promise<void> {
  try {
    await connectDB();
    await Log.create({
      event: options.event,
      releaseId: options.releaseId,
      metadata: {
        ...options.metadata,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    // Log failures should never crash the application
    console.error('[Logger] Failed to write log:', {
      event: options.event,
      releaseId: options.releaseId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}

/**
 * Console-only logger for server-side events (no DB required).
 */
export function logInfo(event: string, metadata: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      level: 'info',
      event,
      timestamp: new Date().toISOString(),
      ...metadata,
    })
  );
}

export function logError(event: string, error: unknown, metadata: Record<string, unknown> = {}): void {
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      ...metadata,
    })
  );
}
