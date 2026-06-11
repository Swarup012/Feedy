import { NextRequest, NextResponse } from 'next/server';
import { assignCluster } from '@/ai/flows/assign-cluster';

/**
 * POST /api/clusters/assign
 *
 * Called by the backend (fire-and-forget) after a post is created.
 * Runs the AI cluster assignment flow and updates posts.cluster_key
 * by calling back to the backend PATCH endpoint.
 *
 * Body: { post_id, board_id, title, description, existing_clusters }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { post_id, board_id, title, description, existing_clusters } = body;

    if (!post_id || !board_id || !title) {
      return NextResponse.json(
        { success: false, error: 'post_id, board_id, and title are required' },
        { status: 400 }
      );
    }

    // ── 1. Run AI cluster assignment ──────────────────────────────────────────
    let clusterKey: string;
    let isAiAssigned = true;

    try {
      const result = await assignCluster({
        title,
        description: description || '',
        existingClusters: existing_clusters || [],
      });
      clusterKey = result.cluster_key;
      console.log(
        `🤖 AI assigned cluster "${clusterKey}" to post ${post_id} (confidence: ${result.confidence})`
      );
    } catch (aiError) {
      // ── Fallback: rule-based cluster from title ───────────────────────────
      console.warn('⚠️ AI cluster assignment failed, using rule-based fallback:', aiError);
      clusterKey = ruleBasedClusterKey(title);
      isAiAssigned = false;
      console.log(`📏 Rule-based cluster "${clusterKey}" assigned to post ${post_id}`);
    }

    // ── 2. Persist cluster_key to the post via backend ────────────────────────
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const internalSecret = process.env.INTERNAL_API_SECRET || '';

    const updateResponse = await fetch(
      `${backendUrl}/api/clusters/assign-post`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': internalSecret,
        },
        body: JSON.stringify({ post_id, board_id, cluster_key: clusterKey }),
      }
    );

    if (!updateResponse.ok) {
      const err = await updateResponse.text();
      console.error(`❌ Failed to persist cluster_key to post ${post_id}:`, err);
      return NextResponse.json(
        { success: false, error: 'Failed to persist cluster key' },
        { status: 500 }
      );
    }

    // ── 3. Trigger label refresh (debounced, fire-and-forget) ─────────────────
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/api/clusters/refresh-label`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board_id, cluster_key: clusterKey }),
    }).catch((err) =>
      console.error('⚠️ Label refresh trigger failed (non-fatal):', err)
    );

    return NextResponse.json({
      success: true,
      cluster_key: clusterKey,
      is_ai_assigned: isAiAssigned,
    });
  } catch (error) {
    console.error('❌ /api/clusters/assign error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Rule-based fallback: converts post title to a snake_case cluster key.
 * "Can't login with Google" → "cant_login_with_google"
 * Capped at 4 meaningful words for readability.
 */
function ruleBasedClusterKey(title: string): string {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'is', 'it', 'this', 'that',
    'i', 'my', 'we', 'you', 'your', 'me',
  ]);

  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // strip punctuation
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w))
    .slice(0, 4);

  return words.length > 0 ? words.join('_') : 'uncategorized';
}
