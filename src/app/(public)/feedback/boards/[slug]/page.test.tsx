import { render, waitFor, cleanup, fireEvent, screen } from '@testing-library/react';
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
  // Mutable so tests can switch between a signed-in visitor (default — the
  // existing CreatePostDialog contract tests) and a guest.
  authUser: { id: 'user-1', email: 'visitor@example.com' } as {
    id: string;
    email: string;
  } | null,
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
    user: ctx.authUser,
    isAuthenticated: ctx.authUser !== null,
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
  // Renders the guest-reachable create affordance so tests can drive
  // onCreatePost (the real component is out of scope for these tests).
  PostsList: ({ onCreatePost }: { onCreatePost?: () => void }) => (
    <button onClick={onCreatePost}>Mock Create Post</button>
  ),
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
import { CustomHostProvider } from '@/context/CustomHostContext';

beforeEach(() => {
  ctx.dialogProps = null;
  ctx.canCreatePost.mockClear();
  ctx.authUser = { id: 'user-1', email: 'visitor@example.com' };
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

// ============================================================
// Guest create-post paths (Stage 3b-2 step 2).
//
// First-party guest -> auth modal (login/signup in-app).
// Custom-host guest -> absolute https://faddy.site/login — /login does not
// exist on a custom hostname (middleware allowlist 404s it).
// ============================================================

describe('guest create-post (custom host vs first-party)', () => {
  beforeEach(() => {
    ctx.authUser = null;
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        hostname: 'feedback.acm.com',
        href: '',
        pathname: '/',
        search: '',
      },
    });
  });

  it('first-party guest: opens the auth modal, no navigation', async () => {
    render(<PublicBoardPage />);

    fireEvent.click(screen.getByText('Mock Create Post'));

    expect(await screen.findByText('Join the Conversation')).toBeTruthy();
    expect(window.location.href).toBe('');
  });

  it('custom-host guest: redirects to https://faddy.site/login, no modal', async () => {
    render(
      <CustomHostProvider value={true}>
        <PublicBoardPage />
      </CustomHostProvider>,
    );

    fireEvent.click(screen.getByText('Mock Create Post'));

    expect(window.location.href).toBe('https://faddy.site/login');
    expect(screen.queryByText('Join the Conversation')).toBeNull();
  });
});
