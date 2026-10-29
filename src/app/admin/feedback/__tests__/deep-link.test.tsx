/**
 * Deep link on the /admin/feedback redirector:
 *  - resolvable ?post=<id> → route to that post's board, param carried along
 *  - unresolvable (404 / other org / error) → default routing, silently
 *  - no ?post → default routing, post service never called
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";

const h = vi.hoisted(() => {
  // stable identities — real useRouter()/useToast() return stable objects
  const replace = vi.fn();
  const push = vi.fn();
  return {
    replace,
    push,
    getAllBoards: vi.fn(),
    getPost: vi.fn(),
    router: { replace, push },
    toast: { toast: vi.fn() },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => h.router,
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => h.toast }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));
vi.mock("@/services/boardService", () => ({
  boardService: { getAllBoards: h.getAllBoards },
}));
vi.mock("@/services/postService", () => ({
  postService: { getPost: h.getPost },
}));

import FeedbackPage from "@/app/admin/feedback/page";

const BOARDS = {
  data: { boards: [{ slug: "roadmap" }, { slug: "changelog" }] },
};

beforeEach(() => {
  h.replace.mockReset();
  h.getAllBoards.mockReset();
  h.getPost.mockReset();
  localStorage.clear();
  window.history.replaceState({}, "", "/admin/feedback");
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("admin feedback redirector — ?post deep link", () => {
  it("resolvable post → routes to its board with ?post kept", async () => {
    window.history.replaceState({}, "", "/admin/feedback?post=p1");
    h.getPost.mockResolvedValue({
      success: true,
      data: { post: { id: "p1", board: { slug: "bugs" } } },
    });

    render(<FeedbackPage />);

    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith(
        "/admin/feedback/boards/bugs?post=p1",
      ),
    );
    expect(h.getPost).toHaveBeenCalledWith("p1");
    expect(h.replace).toHaveBeenCalledTimes(1);
  });

  it("unresolvable post → falls back to default routing, silently", async () => {
    window.history.replaceState({}, "", "/admin/feedback?post=ghost");
    h.getPost.mockRejectedValue(new Error("Post not found"));
    h.getAllBoards.mockResolvedValue(BOARDS);

    render(<FeedbackPage />);

    // default route: first board, WITHOUT the dead ?post param, no error UI
    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith("/admin/feedback/boards/roadmap"),
    );
    expect(h.replace).toHaveBeenCalledTimes(1);
  });

  it("no ?post → default routing, post service untouched", async () => {
    localStorage.setItem("lastVisitedBoard", "changelog");
    h.getAllBoards.mockResolvedValue(BOARDS);

    render(<FeedbackPage />);

    await waitFor(() =>
      expect(h.replace).toHaveBeenCalledWith(
        "/admin/feedback/boards/changelog",
      ),
    );
    expect(h.getPost).not.toHaveBeenCalled();
  });
});
