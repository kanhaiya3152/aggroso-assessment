import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Log } from '@/lib/db/models/Log';

// GET /api/logs — fetch application logs
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200);
    const releaseId = searchParams.get('releaseId');
    const event = searchParams.get('event');

    const query: Record<string, unknown> = {};
    if (releaseId) query.releaseId = releaseId;
    if (event) query.event = event;

    const logs = await Log.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (err) {
    console.error('[GET /api/logs]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
  }
}
