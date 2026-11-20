import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const getPublicBoards = vi.hoisted(() => vi.fn());
const getPublicBoardPosts = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/services/boardService', () => ({
  boardService: { getPublicBoards },
}));

vi.mock('@/services/postService', () => ({
  postService: { getPublicBoardPosts },
}));

vi.mock('./components/submit-feedback', () => ({
  SubmitFeedback: () => <button>Create Post</button>,
}));

import FeedbackPageClient from './feedback-client';

beforeEach(() => {
  getPublicBoards.mockResolvedValue({
    data: { boards: [{ id: '1', name: 'Testing', slug: 'testing' }] },
  });
  getPublicBoardPosts.mockResolvedValue({ data: { posts: [] } });
});

afterEach(() => cleanup());

describe('feedback filters disclosure', () => {
  it('is collapsed by default and reports/updates its active filter count', async () => {
    render(<FeedbackPageClient isCustomHost={false} />);

    const toggle = await screen.findByRole('button', { name: 'Filters' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('feedback-filters');
    expect(document.getElementById('feedback-filters')?.className).toContain('hidden');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: /Testing/ }));
    fireEvent.click(document.getElementById('status-open') as HTMLElement);

    await waitFor(() => {
      const updated = screen.getByRole('button', { name: 'Filters · 2' });
      expect(updated.getAttribute('aria-expanded')).toBe('true');
    });
  });
});
