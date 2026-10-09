import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ── Mocks ───────────────────────────────────────────────────────────────────

const apiGet = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api', () => ({
  default: { get: apiGet },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import AddToRoadmapModal from '@/components/roadmap/AddToRoadmapModal';
import { FirstBoardWelcomeDialog } from '@/components/feedback/FirstBoardWelcomeDialog';
import RoadmapTimeline from '@/components/roadmap/RoadmapTimeline';

beforeEach(() => apiGet.mockReset());
afterEach(() => cleanup());

// ── AddToRoadmapModal ───────────────────────────────────────────────────────

describe('AddToRoadmapModal (was indigo, now primary)', () => {
  it('Done button + linked state use primary tokens; no indigo anywhere', async () => {
    apiGet.mockImplementation((url: string) => {
      if (url === '/api/roadmaps') {
        return Promise.resolve({
          data: { data: { roadmaps: [{ id: 'r1', name: 'Q1', slug: 'q1', is_default: true, item_count: 2 }] } },
        });
      }
      // /api/roadmap/all?postId=… — post already linked to r1
      return Promise.resolve({ data: { data: { items: [{ id: 'i1', roadmap_id: 'r1' }] } } });
    });

    render(
      <AddToRoadmapModal isOpen onClose={() => {}} postId="p1" postTitle="Fast search" organizationId="org-1" />,
    );

    const done = await screen.findByRole('button', { name: 'Done' });
    expect(done.className).toContain('bg-primary');
    expect(done.className).toContain('text-primary-foreground');
    expect(done.className).not.toContain('indigo');

    // linked row: border-primary + bg-primary/10
    const linkedRow = screen.getByText('Q1').closest('button')!;
    expect(linkedRow.className).toContain('border-primary');
    expect(linkedRow.className).toContain('bg-primary/10');

    // no indigo left anywhere in the rendered tree
    expect(document.body.innerHTML).not.toContain('indigo');
  });
});

// ── FirstBoardWelcomeDialog (was blue→purple gradient, now primary) ─────────

describe('FirstBoardWelcomeDialog (was gradient, now primary)', () => {
  it('CTA button has no gradient and falls back to Button default (bg-primary)', () => {
    render(<FirstBoardWelcomeDialog open onOpenChange={() => {}} />);

    const cta = screen.getByRole('button', { name: /Create Your First Board/ });
    expect(cta.className).not.toContain('gradient');
    expect(cta.className).not.toContain('from-blue');
    expect(cta.className).toContain('bg-primary');
    expect(cta.className).toContain('text-primary-foreground');
  });
});

// ── Quarter-header chips (was bg-blue-600, now bg-primary) ─────────────────

describe('quarter-header chips use bg-primary', () => {
  it('RoadmapTimeline renders the quarter chip with primary tokens, not blue-600', () => {
    render(
      <RoadmapTimeline
        items={{ 'Q4 2026': [] }}
        onVote={() => {}}
        onRemoveVote={() => {}}
        user={null}
      />,
    );

    const chip = screen.getByText('Q4 2026');
    expect(chip.className).toContain('bg-primary');
    expect(chip.className).toContain('text-primary-foreground');
    expect(chip.className).not.toContain('blue-600');
  });

  it('the two roadmap pages (inline TimelineView copies) have no bg-blue-600 left; "blue" category preset untouched', () => {
    const pages = [
      path.join(process.cwd(), 'src', 'app', '(public)', 'roadmap', 'page.tsx'),
      path.join(process.cwd(), 'src', 'app', '(public)', 'roadmap', '[boardSlug]', 'page.tsx'),
    ];

    for (const file of pages) {
      const source = fs.readFileSync(file, 'utf8');
      expect(source, file).not.toContain('bg-blue-600');
      // chip now primary
      expect(source, file).toContain('bg-primary text-primary-foreground px-4 py-2');
      // customer-chosen category preset stays blue
      expect(source, file).toContain("blue: 'bg-blue-50 border-blue-300 text-blue-700'");
    }
  });
});
