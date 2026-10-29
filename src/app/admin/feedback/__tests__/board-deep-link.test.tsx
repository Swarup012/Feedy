/**
 * Board page deep link (?post=<id>):
 *  - opens the post once the list settles, from the loaded list when present
 *  - fetches it individually (org-scoped GET /api/posts/:id) when not in list
 *  - never re-opens after the user closes it
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const h = vi.hoisted(() => ({
  getPost: vi.fn(),
  posts: [] as any[],
}));

vi.mock("next/navigation", () => ({ useParams: () => ({ slug: "roadmap" }) }));
vi.mock("@/components/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children?: any }) => <>{children}</>,
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/services/boardService", () => ({ boardService: {} }));
vi.mock("@/services/postService", () => ({
  postService: { getPost: h.getPost, getPostsByBoard: vi.fn() },
}));
vi.mock("@/hooks/useFeedbackData", () => ({
  useBoards: () => ({ boards: [], isLoading: false, refresh: vi.fn() }),
  useBoard: () => ({
    board: { id: "b1", slug: "roadmap", name: "Roadmap" },
    isLoading: false,
  }),
  useBoardPosts: () => ({
    posts: h.posts,
    isLoading: false,
    refresh: vi.fn(),
    mutate: vi.fn(),
  }),
}));
vi.mock("@/components/feedback/LeftSidebar", () => ({ LeftSidebar: () => null }));
vi.mock("@/components/feedback/PostsList", () => ({ PostsList: () => null }));
vi.mock("@/components/feedback/PostDetails", () => ({
  PostDetails: ({
    post,
    onPostDeleted,
  }: {
    post: any;
    onPostDeleted: (id: string) => void;
  }) => (
    <div>
      <span data-testid="open-post-id">{post?.id ?? "none"}</span>
      {post && <button onClick={() => onPostDeleted(post.id)}>close</button>}
    </div>
  ),
}));
vi.mock("@/components/feedback/CreatePostDialog", () => ({
  CreatePostDialog: () => null,
}));
vi.mock("@/components/UpgradeDialog", () => ({ UpgradeDialog: () => null }));
vi.mock("@/services/usageService", () => ({
  default: { canCreatePost: vi.fn().mockResolvedValue({ allowed: true }) },
}));

import BoardPage from "@/app/admin/feedback/boards/[slug]/page";

const basePost = {
  board_id: "b1",
  status: "open",
  upvotes: 0,
  comment_count: 0,
  is_pinned: false,
  is_archived: false,
  author_id: null,
  created_at: "2026-01-01T00:00:00Z",
};
const P1 = { ...basePost, id: "p1", title: "One" };
const P2 = { ...basePost, id: "p2", title: "Two" };

beforeEach(() => {
  h.getPost.mockReset();
  h.posts = [];
  window.history.replaceState({}, "", "/admin/feedback/boards/roadmap");
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("board page — ?post deep link", () => {
  it("opens the post from the query when it is in the loaded list", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin/feedback/boards/roadmap?post=p2",
    );
    h.posts = [P1, P2];

    render(<BoardPage />);

    await waitFor(() =>
      expect(screen.getByTestId("open-post-id").textContent).toBe("p2"),
    );
    expect(h.getPost).not.toHaveBeenCalled();
  });

  it("fetches it individually when it is not in the loaded list", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin/feedback/boards/roadmap?post=p9",
    );
    h.posts = [P1]; // p9 absent (filtered out / paged away)
    h.getPost.mockResolvedValue({
      success: true,
      data: { post: { ...basePost, id: "p9", title: "Deep" } },
    });

    render(<BoardPage />);

    await waitFor(() => expect(h.getPost).toHaveBeenCalledWith("p9"));
    await waitFor(() =>
      expect(screen.getByTestId("open-post-id").textContent).toBe("p9"),
    );
  });

  it("does not re-open the post after the user closes it", async () => {
    window.history.replaceState(
      {},
      "",
      "/admin/feedback/boards/roadmap?post=p2",
    );
    h.posts = [P1, P2];

    render(<BoardPage />);
    await waitFor(() =>
      expect(screen.getByTestId("open-post-id").textContent).toBe("p2"),
    );

    fireEvent.click(screen.getByText("close"));
    await waitFor(() =>
      expect(screen.getByTestId("open-post-id").textContent).toBe("none"),
    );

    // list state changed (post removed) → deep-link effect re-ran; the
    // once-guard must keep it closed and never re-fetch
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByTestId("open-post-id").textContent).toBe("none");
    expect(h.getPost).not.toHaveBeenCalled();
  });
});
