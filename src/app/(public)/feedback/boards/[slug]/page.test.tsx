import { render, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================
// Portal board page → CreatePostDialog contract.
//
// Regression: the page used to pass `boards` + `defaultBoardId` while
// CreatePostDialog requires `boardSlug` — the dialog then posted to
// /api/boards/undefined/posts → "Board 'undefined' not found".
// The page must pass boardSlug={slug} and nothing stale.
// Also: no client-side usage/limit pre-check — the visitor's own org plan
// must never block posting on the visited org's board.
// ============================================================

const ctx = vi.hoisted(() => ({
  dialogProps: null as Record<string, unknown> | null,
  canCreatePost: vi.fn(async () => ({ allowed: true })),
}));

// Stable references — the page's effects depend on these arrays; fresh
// [] literals each render would loop set-state → render → effect forever.
const BOARDS = [
  { id: 'board-B-pub', name: 'Feedback', slug: 'feedback', is_private: false },
];
const BOARD = { id: 'board-B-pub', name: 'Feedback', slug: 'feedback', is_private: false };
const POSTS: unknown[] = [];

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'feedback' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'visitor@example.com' },
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useBoardRealtime', () => ({
  useBoardRealtime: () => {},
}));

vi.mock('@/hooks/useFeedbackData', () => ({
  usePublicBoards: () => ({
    boards: BOARDS,
    isLoading: false,
  }),
  usePublicBoard: () => ({
    board: BOARD,
    isLoading: false,
  }),
  usePublicBoardPosts: () => ({
    posts: POSTS,
    isLoading: false,
    refresh: vi.fn(),
    mutate: vi.fn(),
  }),
}));

vi.mock('@/services/usageService', () => ({
  default: { canCreatePost: ctx.canCreatePost, getUsage: vi.fn() },
}));

vi.mock('@/lib/returnUrl', () => ({
  saveReturnUrl: vi.fn(),
}));

vi.mock('@/components/feedback/LeftSidebar', () => ({
  LeftSidebar: () => null,
}));
vi.mock('@/components/feedback/PostsList', () => ({
  PostsList: () => null,
}));
vi.mock('@/components/feedback/PostDetails', () => ({
  PostDetails: () => null,
}));

vi.mock('@/components/feedback/CreatePostDialog', () => ({
  CreatePostDialog: (props: Record<string, unknown>) => {
    ctx.dialogProps = props;
    return null;
  },
}));

import PublicBoardPage from '@/app/(public)/feedback/boards/[slug]/page';

beforeEach(() => {
  ctx.dialogProps = null;
  ctx.canCreatePost.mockClear();
});

afterEach(() => cleanup());

describe('portal board page → CreatePostDialog', () => {
  it('passes boardSlug={slug} and no stale boards/defaultBoardId props', async () => {
    render(<PublicBoardPage />);

    await waitFor(() => expect(ctx.dialogProps).not.toBeNull());
    const props = ctx.dialogProps as Record<string, unknown>;

    expect(props.boardSlug).toBe('feedback');
    expect(props).not.toHaveProperty('boards');
    expect(props).not.toHaveProperty('defaultBoardId');
  });

  it('does not pre-check the VISITOR org usage (server enforces the visited org limit)', async () => {
    render(<PublicBoardPage />);
    await waitFor(() => expect(ctx.dialogProps).not.toBeNull());

    expect(ctx.canCreatePost).not.toHaveBeenCalled();
  });
});
