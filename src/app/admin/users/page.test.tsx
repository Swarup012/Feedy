import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// /admin/users stats panel regression:
//  - detail request failure → "-" for every stat + retry line
//  - successful response with real zeros → "0"
//  - null post total never renders "null posts"
// ============================================================

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  getById: vi.fn(),
  getPosts: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("@/components/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/context/OrganizationContext", () => ({
  useOrganization: () => ({ organization: { id: "org-1" } }),
}));

vi.mock("@/services/orgEndUsersService", () => ({
  default: {
    getList: mocks.getList,
    getById: mocks.getById,
    getPosts: mocks.getPosts,
    delete: mocks.deleteUser,
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: () => () => null,
}));

import UsersPage from "./page";

const USER = {
  id: "u1",
  name: "Test User",
  email: "test@example.com",
  external_user_id: null,
  identity_type: "verified",
  custom_fields: {},
  created_at: "2026-01-01T00:00:00Z",
  last_seen_at: "2026-01-02T00:00:00Z",
  updated_at: "2026-01-02T00:00:00Z",
};

function statValue(label: string) {
  return screen.getByText(label).previousElementSibling?.textContent;
}

async function selectUser() {
  render(<UsersPage />);
  fireEvent.click(await screen.findByText("Test User"));
  await screen.findByText("Posts by Test User");
  await waitFor(() => expect(mocks.getById).toHaveBeenCalled());
}

beforeEach(() => {
  mocks.getList.mockReset();
  mocks.getById.mockReset();
  mocks.getPosts.mockReset();
  mocks.getList.mockResolvedValue({
    success: true,
    data: { users: [USER], pagination: { page: 1, limit: 50, total: 1, pages: 1 } },
  });
  mocks.getPosts.mockResolvedValue({
    success: true,
    data: { posts: [], pagination: { page: 1, limit: 50, total: null, pages: 0 } },
  });
});

afterEach(() => cleanup());

describe("/admin/users stats panel", () => {
  it("shows '-' and an error line with retry when the detail request fails", async () => {
    mocks.getById.mockResolvedValue({ success: false, data: { user: null } });

    await selectUser();

    await waitFor(() => expect(screen.getByText(/Couldn't load stats/)).toBeTruthy());
    expect(statValue("Posts")).toBe("-");
    expect(statValue("Upvotes")).toBe("-");
    expect(statValue("Comments")).toBe("-");
    expect(screen.queryByText(/null posts/)).toBeNull();
  });

  it("shows real numbers including 0 when the detail request succeeds", async () => {
    mocks.getById.mockResolvedValue({
      success: true,
      data: {
        user: { ...USER, posts_count: 0, upvotes_given_count: 0, comments_count: 0 },
      },
    });

    await selectUser();

    await waitFor(() => expect(statValue("Posts")).toBe("0"));
    expect(statValue("Upvotes")).toBe("0");
    expect(statValue("Comments")).toBe("0");
    expect(screen.queryByText(/Couldn't load stats/)).toBeNull();
  });

  it("retries the detail request and replaces '-' with real counts", async () => {
    mocks.getById
      .mockResolvedValueOnce({ success: false, data: { user: null } })
      .mockResolvedValueOnce({
        success: true,
        data: { user: { ...USER, posts_count: 2, upvotes_given_count: 3, comments_count: 4 } },
      });

    await selectUser();
    await screen.findByText(/Couldn't load stats/);

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => expect(statValue("Posts")).toBe("2"));
    expect(statValue("Upvotes")).toBe("3");
    expect(statValue("Comments")).toBe("4");
    expect(screen.queryByText(/Couldn't load stats/)).toBeNull();
  });
});
