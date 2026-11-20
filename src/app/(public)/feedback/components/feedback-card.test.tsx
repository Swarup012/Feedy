import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { FeedbackCard, formatVoteCount } from "./feedback-card";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/services/postService", () => ({
  getPostAuthorDisplayName: (post: any) =>
    post.author?.name ?? post.external_author?.name ?? "Anonymous",
  isWidgetPost: (post: any) => Boolean(post.org_end_user || post.external_author),
}));

const TWENTY_DAYS_AGO = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

function makePost(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    board_id: "b1",
    title: "Gold dark mode",
    description: "Need a premium dark mode",
    author_id: "u1",
    status: "open",
    upvotes: 13,
    comment_count: 4,
    is_pinned: false,
    is_archived: false,
    created_at: TWENTY_DAYS_AGO,
    updated_at: TWENTY_DAYS_AGO,
    author: { id: "u1", name: "Ada", email: "ada@example.com" },
    board: { id: "b1", name: "Feature Requests", slug: "feature-requests", color: "#ff0000", icon: "bulb" },
    ...overrides,
  } as any;
}

beforeEach(() => push.mockClear());
afterEach(() => cleanup());

describe("FeedbackCard layout", () => {
  it("renders title, description, status, board, comments, author and relative time", () => {
    render(<FeedbackCard feedback={makePost()} />);

    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe("Gold dark mode");
    expect(screen.getByText("Need a premium dark mode")).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByText("Feature Requests")).toBeTruthy();
    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText(/days ago/)).toBeTruthy();
  });

  it("wraps long titles and truncates the description to one line", () => {
    render(
      <FeedbackCard
        feedback={makePost({
          title: "A ".repeat(120).trim(),
          description: "x".repeat(500),
        })}
      />,
    );

    const heading = screen.getByRole("heading", { level: 3 });
    const description = screen.getByText("x".repeat(500));
    expect(heading.className).toContain("break-words");
    expect(description.className).toContain("truncate");
  });

  it("renders no description when it is empty", () => {
    const { container } = render(
      <FeedbackCard feedback={makePost({ description: undefined })} />,
    );
    expect(container.querySelector("p")).toBeNull();
  });

  it("shows 0 votes and compacts large counts with the full number in aria-label", () => {
    const { rerender } = render(<FeedbackCard feedback={makePost({ upvotes: 0 })} />);
    expect(screen.getByRole("button", { name: /Upvote, 0 votes/ }).textContent).toContain("0");

    rerender(<FeedbackCard feedback={makePost({ upvotes: 1234 })} />);
    const button = screen.getByRole("button", { name: /Upvote, 1234 votes/ });
    expect(button.textContent).toContain("1.2k");
  });
});

describe("formatVoteCount", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1k"],
    [1234, "1.2k"],
    [1_200_000, "1.2m"],
  ])("%i -> %s", (input, expected) => {
    expect(formatVoteCount(input)).toBe(expected);
  });
});

describe("FeedbackCard behaviour", () => {
  it("vote box is a real button with aria-label/pressed and does not open the post", async () => {
    const onUpvote = vi.fn().mockResolvedValue(undefined);
    render(<FeedbackCard feedback={makePost()} onUpvote={onUpvote} />);

    const button = screen.getByRole("button", { name: /Upvote, 13 votes/ });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.getAttribute("type")).toBe("button");

    fireEvent.click(button);
    await waitFor(() => expect(onUpvote).toHaveBeenCalledWith("p1"));
    expect(push).not.toHaveBeenCalled();
  });

  it("marks the vote box as pressed when voted", () => {
    render(<FeedbackCard feedback={makePost()} isUpvoted />);
    expect(screen.getByRole("button", { name: /Remove upvote, 13 votes/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("opens the post when the card is clicked", () => {
    render(<FeedbackCard feedback={makePost()} />);
    fireEvent.click(screen.getByRole("heading", { level: 3 }));
    expect(push).toHaveBeenCalledWith("/feedback/p1");
  });

  it("does not open the post when Enter is pressed on the vote button", () => {
    render(<FeedbackCard feedback={makePost()} onUpvote={vi.fn()} />);
    fireEvent.keyDown(screen.getByRole("button", { name: /Upvote, 13 votes/ }), {
      key: "Enter",
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("opens the post from the keyboard on the card itself", () => {
    const { container } = render(<FeedbackCard feedback={makePost()} />);
    fireEvent.keyDown(container.firstElementChild!, { key: "Enter" });
    expect(push).toHaveBeenCalledWith("/feedback/p1");
  });
});

describe("branding + token safety", () => {
  const source = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/(public)/feedback/components/feedback-card.tsx"),
    "utf8",
  );

  it("uses no hex/rgb/hsl literals or inline colour styles", () => {
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).not.toMatch(/(?:rgb|hsl)\s*\(/);
    expect(source).not.toMatch(/style=\{\{/);
  });

  it("keeps default neutral, brand on hover/focus, and a brand-tinted voted state", () => {
    for (const primary of ["0 100% 50%", "174 100% 30%", null]) {
      const style = primary ? ({ "--primary": primary } as any) : undefined;
      const { container, rerender, unmount } = render(
        <div style={style}>
          <FeedbackCard feedback={makePost()} />
        </div>,
      );

      if (primary) {
        expect(
          (container.firstElementChild as HTMLElement).style.getPropertyValue("--primary"),
        ).toBe(primary);
      }

      const unvoted = screen.getByRole("button", { name: /Upvote, 13 votes/ });
      const unvotedButtonClasses = unvoted.className.split(/\s+/);
      const unvotedArrowClasses =
        unvoted.querySelector("svg")?.getAttribute("class")?.split(/\s+/) ?? [];

      expect(unvotedButtonClasses).toEqual(
        expect.arrayContaining([
          "border-border",
          "bg-card",
          "text-foreground",
          "hover:border-primary",
          "focus-visible:border-primary",
        ]),
      );
      expect(unvotedButtonClasses).not.toContain("border-primary");
      expect(unvotedButtonClasses).not.toContain("bg-primary");
      expect(unvotedButtonClasses).not.toContain("text-primary");
      expect(unvotedArrowClasses).not.toContain("text-primary");
      expect(unvotedArrowClasses).not.toContain("text-foreground");
      expect(unvotedArrowClasses).toEqual(
        expect.arrayContaining([
          "text-vote-arrow-light",
          "dark:text-vote-arrow-dark",
          "group-hover:text-primary",
          "group-focus-visible:text-primary",
        ]),
      );

      rerender(
        <div style={style}>
          <FeedbackCard feedback={makePost()} isUpvoted />
        </div>,
      );
      const voted = screen.getByRole("button", { name: /Remove upvote, 13 votes/ });
      const votedButtonClasses = voted.className.split(/\s+/);
      expect(voted.getAttribute("aria-pressed")).toBe("true");
      expect(votedButtonClasses).toEqual(
        expect.arrayContaining([
          "border-primary",
          "bg-primary/10",
          "text-primary",
          "hover:bg-primary/15",
        ]),
      );
      expect(votedButtonClasses).not.toContain("bg-primary");

      unmount();
    }
  });
});
