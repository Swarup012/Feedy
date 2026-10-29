/**
 * RevenuePanel states: loading (skeleton), failed (neutral), locked
 * (upgrade prompt, no numbers), empty (setup link), data (tiles + bars +
 * top posts + single action). The panel fetches GET /api/dashboard/revenue
 * in its own effect, separately from expert-stats.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  RevenuePanel,
  coverageLabel,
  topPostMeta,
} from '@/components/admin/RevenuePanel';

const h = vi.hoisted(() => ({
  get: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  default: { get: h.get },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: h.push }),
}));
vi.mock('@/components/UpgradeDialog', () => ({
  UpgradeDialog: () => null,
}));

const Panel = RevenuePanel;

const DATA_PAYLOAD = {
  totalMrr: 16313.35,
  accountsWithMrr: 6,
  coverage: { customersWithMrr: 8, customersTotal: 9 },
  byPlan: { gold: 12008.5, silver: 300.3 },
  mrrWithHighSeverity: 5001.37,
  topPostsByMrr: [
    {
      postId: 'p2',
      title: 'Checkout breaks on Safari',
      mrr: 7007.13,
      customerCount: 1,
      customersWithMrr: 1,
    },
  ],
  currency: 'EUR',
};

function renderPanel() {
  return render(<Panel />);
}

beforeEach(() => {
  h.get.mockReset();
  h.push.mockReset();
});

describe('RevenuePanel', () => {
  it('loading → skeleton, no revenue numbers yet', async () => {
    h.get.mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = renderPanel();
    await waitFor(() => expect(h.get).toHaveBeenCalledWith('/api/dashboard/revenue'));
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Known MRR')).toBeNull();
    expect(screen.queryByText("Couldn't load")).toBeNull();
  });

  it('failed → neutral "Couldn\'t load", never a green/empty-looking state', async () => {
    h.get.mockRejectedValue(new Error('boom'));
    renderPanel();
    await waitFor(() => expect(screen.getByText("Couldn't load")).toBeTruthy());
    expect(screen.queryByText('No revenue data yet')).toBeNull();
    expect(screen.queryByText('Known MRR')).toBeNull();
  });

  it('locked → upgrade prompt, no numbers', async () => {
    h.get.mockResolvedValue({ data: { data: { locked: true } } });
    renderPanel();
    await waitFor(() => expect(screen.getByText('Revenue insights')).toBeTruthy());
    expect(screen.getByRole('button', { name: /upgrade/i })).toBeTruthy();
    expect(screen.queryByText(/\$\d/)).toBeNull();
    expect(screen.queryByText(/€\d/)).toBeNull();
  });

  it('no revenue data → explanation + link to the settings section', async () => {
    h.get.mockResolvedValue({
      data: {
        data: {
          totalMrr: 0,
          coverage: { customersWithMrr: 0, customersTotal: 120 },
          byPlan: {},
          topPostsByMrr: [],
          currency: 'USD',
        },
      },
    });
    renderPanel();
    await waitFor(() => expect(screen.getByText('No revenue data yet')).toBeTruthy());
    const link = screen.getByRole('button', { name: /set up revenue data/i });
    link.click();
    expect(h.push).toHaveBeenCalledWith('/admin/organization?tab=general#revenue-data');
  });

  it('data → four tiles, plan bars, top posts, exactly one action button', async () => {
    h.get.mockResolvedValue({ data: { data: DATA_PAYLOAD } });
    renderPanel();

    await waitFor(() => expect(screen.getByText('Known MRR')).toBeTruthy());
    // Known MRR tile (EUR, no decimals)
    expect(screen.getByText('€16,313')).toBeTruthy();
    // ARR tile = Known MRR × 12 (compact above 100k)
    expect(screen.getByText('ARR')).toBeTruthy();
    expect(screen.getByText('€195.8K')).toBeTruthy();
    expect(screen.getByText('Known MRR × 12')).toBeTruthy();
    // High-severity tile
    expect(screen.getByText('MRR with open high-severity feedback')).toBeTruthy();
    expect(screen.getByText('€5,001')).toBeTruthy();
    // Coverage
    expect(screen.getByText('8 of 9')).toBeTruthy();
    // Plan bars
    expect(screen.getByText('gold')).toBeTruthy();
    expect(screen.getByText('silver')).toBeTruthy();
    // Top post row + meta
    expect(screen.getByText('Checkout breaks on Safari')).toBeTruthy();
    expect(screen.getByText('€7,007/mo · 1 of 1 customers')).toBeTruthy();

    // Exactly one primary action
    const actions = screen.getAllByRole('button').filter((b) => b.textContent?.includes('View feedback'));
    expect(actions).toHaveLength(1);

    // Top post row opens the post
    screen.getByText('Checkout breaks on Safari').click();
    expect(h.push).toHaveBeenCalledWith('/admin/feedback?post=p2');
  });

  it('data → Known MRR tooltip explains anonymous voters are excluded', async () => {
    h.get.mockResolvedValue({ data: { data: DATA_PAYLOAD } });
    renderPanel();
    const trigger = await screen.findByText('Known MRR');
    fireEvent.pointerOver(trigger);
    fireEvent.focus(trigger);
    expect(
      await screen.findByText('Only customers with revenue data. Anonymous voters are not included.')
    ).toBeTruthy();
  });
});

describe('RevenuePanel helpers', () => {
  it('coverageLabel', () => {
    expect(coverageLabel({ customersWithMrr: 38, customersTotal: 120 })).toBe('38 of 120');
    expect(coverageLabel(undefined)).toBe('—');
  });

  it('topPostMeta formats "$X/mo · n of m customers"', () => {
    expect(
      topPostMeta({ mrr: 4200, customerCount: 7, customersWithMrr: 3 }, 'USD')
    ).toBe('$4,200/mo · 3 of 7 customers');
  });
});
