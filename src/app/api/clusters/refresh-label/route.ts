import { NextRequest, NextResponse } from 'next/server';
import { labelCluster } from '@/ai/flows/label-cluster';

/**
 * POST /api/clusters/refresh-label
 *
 * Generates (or regenerates) an AI label + summary for a cluster.
 * Uses Redis-backed debounce on the backend side — this endpoint is
 * idempotent and safe to call multiple times.
 *
 * Body: { board_id, cluster_key }
 *
 * Flow:
 *  1. Check debounce via backend (backend manages Redis key)
 *  2. Fetch up to 5 sample posts for this cluster from backend
 *  3. Run labelCluster Genkit flow (Gemini Flash)
 *  4. Persist result to cluster_labels table via backend PATCH
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { board_id, cluster_key } = body;

    if (!board_id || !cluster_key) {
      return NextResponse.json(
        { success: false, error: 'board_id and cluster_key are required' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const internalSecret = process.env.INTERNAL_API_SECRET || '';

    const headers = {
      'Content-Type': 'application/json',
      'x-internal-secret': internalSecret,
    };

    // ── 1. Check debounce — backend will return 204 if already queued ─────────
    const debounceRes = await fetch(
      `${backendUrl}/api/clusters/check-debounce`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ board_id, cluster_key }),
      }
    );

    if (debounceRes.status === 204) {
      // Already scheduled — skip this run
      console.log(`⏭️  Label refresh debounced for cluster "${cluster_key}" on board ${board_id}`);
      return NextResponse.json({ success: true, debounced: true });
    }

    // ── 2. Fetch sample posts ─────────────────────────────────────────────────
    const sampleRes = await fetch(
      `${backendUrl}/api/clusters/sample-posts?board_id=${board_id}&cluster_key=${encodeURIComponent(cluster_key)}&limit=5`,
      { headers }
    );

    if (!sampleRes.ok) {
      console.error('❌ Failed to fetch sample posts for label refresh');
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sample posts' },
        { status: 500 }
      );
    }

    const json = await sampleRes.json();
    const posts = json.data?.posts;

    if (!posts || posts.length === 0) {
      console.warn(`⚠️ No posts found for cluster "${cluster_key}" — skipping label refresh`);
      return NextResponse.json({ success: true, skipped: true, reason: 'no_posts' });
    }

    // ── 3. Generate AI label + summary ───────────────────────────────────────
    let label: string;
    let summary: string;
    let severity_level: string;

    try {
      const result = await labelCluster({
        cluster_key,
        sample_posts: posts.map((p: { title: string; description?: string }) => ({
          title: p.title,
          description: p.description || undefined,
        })),
      });
      label = result.label;
      summary = result.summary;
      severity_level = result.severity_level;
      console.log(`🤖 AI label generated for cluster "${cluster_key}": "${label}" (Severity: ${severity_level})`);
    } catch (aiError) {
      console.error('❌ AI label generation failed:', aiError);
      return NextResponse.json(
        { success: false, error: 'AI label generation failed' },
        { status: 500 }
      );
    }

    // ── 4. Persist to cluster_labels table ────────────────────────────────────
    const persistRes = await fetch(`${backendUrl}/api/clusters/upsert-label`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ board_id, cluster_key, label, summary, severity_level }),
    });

    if (!persistRes.ok) {
      const err = await persistRes.text();
      console.error('❌ Failed to persist cluster label:', err);
      return NextResponse.json(
        { success: false, error: 'Failed to persist cluster label' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, label, summary, severity_level });
  } catch (error) {
    console.error('❌ /api/clusters/refresh-label error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
