import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  buildBriefingCaption,
  highSeverityCountLabel,
  approvalRateLabel,
  formatGeneratedAt,
} from './ExpertView';

// ExpertView pulls in the axios client → Supabase client at import time.
const apiGet = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api', () => ({ default: { get: apiGet } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({ organization: null }),
}));

import { ExpertView } from './ExpertView';

describe('highSeverityCountLabel', () => {
  it('renders "5+" once the API cap of 5 is reached', () => {
    expect(highSeverityCountLabel(5)).toBe('5+');
    expect(highSeverityCountLabel(7)).toBe('5+');
  });

  it('renders the exact count below the cap', () => {
    expect(highSeverityCountLabel(0)).toBe('0');
    expect(highSeverityCountLabel(4)).toBe('4');
  });
});

describe('approvalRateLabel', () => {
  it('renders an em dash when there are no decisions yet', () => {
    expect(approvalRateLabel(null)).toBe('—');
  });

  it('renders the percentage otherwise', () => {
    expect(approvalRateLabel(100)).toBe('100%');
    expect(approvalRateLabel(0)).toBe('0%');
  });
});

describe('formatGeneratedAt', () => {
  it('formats in UTC, never local time', () => {
    expect(formatGeneratedAt('2026-10-14T09:00:00.000Z')).toBe('Oct 14, 09:00 UTC');
  });

  it('returns null for missing or invalid input', () => {
    expect(formatGeneratedAt(undefined)).toBeNull();
    expect(formatGeneratedAt(null)).toBeNull();
    expect(formatGeneratedAt('not-a-date')).toBeNull();
  });
});

describe('buildBriefingCaption', () => {
  it('joins range and generated parts', () => {
    expect(buildBriefingCaption('7d', '2026-10-14T09:00:00.000Z')).toBe(
      'Last 7 days · updated daily · Generated Oct 14, 09:00 UTC'
    );
  });

  it('omits the range part when the briefing range is missing or not 7d', () => {
    expect(buildBriefingCaption(undefined, '2026-10-14T09:00:00.000Z')).toBe(
      'Generated Oct 14, 09:00 UTC'
    );
    expect(buildBriefingCaption('30d', '2026-10-14T09:00:00.000Z')).toBe(
      'Generated Oct 14, 09:00 UTC'
    );
  });

  it('omits the generated part when generated_at is missing', () => {
    expect(buildBriefingCaption('7d', undefined)).toBe('Last 7 days · updated daily');
    expect(buildBriefingCaption('7d', null)).toBe('Last 7 days · updated daily');
  });

  it('returns an empty caption when both parts are missing', () => {
    expect(buildBriefingCaption(undefined, undefined)).toBe('');
    expect(buildBriefingCaption('30d', 'not-a-date')).toBe('');
  });
});

const ZERO_STATS = {
  range: '30d',
  topSeverePosts: [],
  classificationTrends: [],
  autopilot: {
    ingested: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    approvalRate: null,
    byPlatform: {},
    byStatus: {},
  },
  customersToWatch: [],
  cached: false,
};

describe('controlled mode (range owned by the page header)', () => {
  it('hides the internal pills toolbar so the header owns range selection', async () => {
    apiGet.mockReset();
    apiGet.mockResolvedValueOnce({ data: { data: ZERO_STATS } });
    render(<ExpertView range="7d" onRangeChange={vi.fn()} />);

    await screen.findByText('All clear');
    expect(screen.queryByRole('button', { name: '7d' })).toBeNull();
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(apiGet.mock.calls[0][1].params.range).toBe('7d');
  });
});

describe('stats === null (request failed, nothing loaded)', () => {
  it('shows neutral "Couldn\'t load" states instead of good-news states', async () => {
    apiGet.mockReset();
    apiGet.mockRejectedValueOnce(new Error('network down'));
    render(<ExpertView />);

    await screen.findByText(/showing last known data/);

    // 4 summary cards: "—" value + "Couldn't load" sub
    expect(screen.getAllByText('—')).toHaveLength(4);
    expect(screen.getAllByText("Couldn't load")).toHaveLength(4);
    // 3 panels (Needs attention, Autopilot pipeline, Customers to watch)
    expect(screen.getAllByText("Couldn't load data")).toHaveLength(3);

    expect(screen.queryByText('All clear')).toBeNull();
    expect(screen.queryByText('Queue is clear')).toBeNull();
    expect(screen.queryByText('No customers to watch')).toBeNull();
  });

  it('keeps good-news states when stats loaded successfully with zeros', async () => {
    apiGet.mockReset();
    apiGet.mockResolvedValueOnce({ data: { data: ZERO_STATS } });
    render(<ExpertView />);

    await screen.findByText('All clear');
    expect(screen.getByText('Queue is clear')).toBeTruthy();
    expect(screen.getByText('No customers to watch')).toBeTruthy();
    expect(screen.queryByText("Couldn't load")).toBeNull();
    expect(screen.queryByText("Couldn't load data")).toBeNull();
    expect(screen.queryByText(/showing last known data/)).toBeNull();
  });
});
