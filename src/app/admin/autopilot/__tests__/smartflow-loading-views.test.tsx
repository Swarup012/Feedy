/**
 * Smartflow (/admin/autopilot) first-paint behavior:
 *  - while the integration/connection check is in flight, a skeleton is shown
 *    (never the main view, never the connect-apps view)
 *  - after resolve: connected orgs see the main view, unconnected orgs see the
 *    connect-apps view
 *  - a failed check shows an error + retry, not the connect-apps empty state
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

const h = vi.hoisted(() => ({
  getStatus: {
    intercom: vi.fn(),
    discord: vi.fn(),
    slack: vi.fn(),
    github: vi.fn(),
  },
  listSuggestions: vi.fn(),
  getAllBoards: vi.fn(),
  apiGet: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children?: any }) => <span>{children}</span>,
}));
vi.mock("@/components/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children?: any }) => <>{children}</>,
}));
vi.mock("@/components/PaidFeatureGate", () => ({
  PaidFeatureGate: ({ children }: { children?: any }) => <>{children}</>,
}));
vi.mock("@/context/OrganizationContext", () => ({
  useOrganization: () => ({
    organization: { id: "org1", subscription_plan: "pro" },
    loading: false,
  }),
}));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: h.toast }) }));
vi.mock("@/lib/api", () => ({
  default: { get: h.apiGet, post: vi.fn() },
  isPlanUpgradeRequired: () => false,
}));
vi.mock("@/services/boardService", () => ({
  boardService: { getAllBoards: h.getAllBoards },
}));
vi.mock("@/services/autopilotService", () => ({
  autopilotService: {
    listSuggestions: h.listSuggestions,
    approve: vi.fn(),
    reject: vi.fn(),
    ingest: vi.fn(),
  },
}));
vi.mock("@/services/intercomService", () => ({
  intercomService: { getStatus: h.getStatus.intercom, startConnect: vi.fn() },
}));
vi.mock("@/services/discordService", () => ({
  discordService: { getStatus: h.getStatus.discord, startConnect: vi.fn() },
}));
vi.mock("@/services/slackService", () => ({
  slackService: { getStatus: h.getStatus.slack, startConnect: vi.fn() },
}));
vi.mock("@/services/githubService", () => ({
  githubService: { getStatus: h.getStatus.github, startConnect: vi.fn() },
}));

import AutopilotPage from "@/app/admin/autopilot/page";

const SUGGESTION = {
  id: "s1",
  organization_id: "org1",
  source_text: "please add csv export",
  suggested_title: "Add CSV export",
  suggested_body: null,
  possible_duplicate_post_id: null,
  status: "pending",
  created_at: "2026-10-01T10:00:00Z",
  reviewed_by: null,
  reviewed_at: null,
};

const INACTIVE = { data: { status: "disconnected" } };
const ACTIVE = { data: { status: "active" } };

function allInactive() {
  h.getStatus.intercom.mockResolvedValue(INACTIVE);
  h.getStatus.discord.mockResolvedValue(INACTIVE);
  h.getStatus.slack.mockResolvedValue(INACTIVE);
  h.getStatus.github.mockResolvedValue(INACTIVE);
}

beforeEach(() => {
  Object.values(h.getStatus).forEach((fn) => fn.mockReset());
  h.listSuggestions.mockReset();
  h.getAllBoards.mockReset();
  h.apiGet.mockReset();
  h.listSuggestions.mockResolvedValue({
    success: true,
    data: { suggestions: [] },
  });
  h.getAllBoards.mockResolvedValue({ data: { boards: [] } });
  h.apiGet.mockResolvedValue({ data: { users: [] } });
});

describe("Smartflow page — loading views", () => {
  it("renders the skeleton — not the main or connect-apps view — while the connection check is pending", () => {
    allInactive();
    const pending = new Promise(() => {});
    h.getStatus.intercom.mockReturnValue(pending);
    h.getStatus.discord.mockReturnValue(pending);
    h.getStatus.slack.mockReturnValue(pending);
    h.getStatus.github.mockReturnValue(pending);

    render(<AutopilotPage />);

    expect(screen.getByTestId("smartflow-loading")).toBeTruthy();
    expect(screen.queryByText("Get Started with Smartflow")).toBeNull();
    expect(screen.queryByText("Submit Feedback")).toBeNull();
  });

  it("shows the main view after resolve when an integration is connected and suggestions exist", async () => {
    h.getStatus.intercom.mockResolvedValue(ACTIVE);
    h.getStatus.discord.mockResolvedValue(INACTIVE);
    h.getStatus.slack.mockResolvedValue(INACTIVE);
    h.getStatus.github.mockResolvedValue(INACTIVE);
    h.listSuggestions.mockResolvedValue({
      success: true,
      data: { suggestions: [SUGGESTION] },
    });

    render(<AutopilotPage />);

    await waitFor(() =>
      expect(screen.getByText("Submit Feedback")).toBeTruthy(),
    );
    expect(screen.queryByText("Get Started with Smartflow")).toBeNull();
    expect(screen.queryByTestId("smartflow-loading")).toBeNull();
    expect(screen.getByText("Add CSV export")).toBeTruthy();
  });

  it("shows the connect-apps view after resolve when nothing is connected", async () => {
    allInactive();

    render(<AutopilotPage />);

    await waitFor(() =>
      expect(screen.getByText("Get Started with Smartflow")).toBeTruthy(),
    );
    expect(screen.queryByText("Submit Feedback")).toBeNull();
    expect(screen.queryByTestId("smartflow-loading")).toBeNull();
  });

  it("shows an error with retry — not the connect-apps view — when every status check fails", async () => {
    h.getStatus.intercom.mockRejectedValue(new Error("network"));
    h.getStatus.discord.mockRejectedValue(new Error("network"));
    h.getStatus.slack.mockRejectedValue(new Error("network"));
    h.getStatus.github.mockRejectedValue(new Error("network"));

    render(<AutopilotPage />);

    await waitFor(() =>
      expect(screen.getByText(/load Smartflow/i)).toBeTruthy(),
    );
    expect(screen.queryByText("Get Started with Smartflow")).toBeNull();

    h.getStatus.intercom.mockResolvedValue(ACTIVE);
    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() =>
      expect(screen.getByText("Submit Feedback")).toBeTruthy(),
    );
  });
});
