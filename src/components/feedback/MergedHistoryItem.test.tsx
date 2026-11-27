import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MergedHistoryItem } from './MergedHistoryItem';
import type { Post } from '@/services/postService';

describe('MergedHistoryItem', () => {
  it('renders saved request details in the expandable history item', () => {
    const item = { id:'slack-request-r1', description:'Connect button\n\nUse OAuth', source_platform:'slack', created_at:'2026-01-01T00:00:00Z' } as Post;
    render(<MergedHistoryItem item={item} />);
    expect(screen.getByText(/Connect button/).textContent).toContain('Use OAuth');
  });
});
