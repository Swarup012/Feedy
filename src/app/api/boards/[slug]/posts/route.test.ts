import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

// The proxy's own 401s must carry a `message` key too — the toasts read
// error.response.data.message (CreatePostDialog.tsx) and otherwise show
// axios boilerplate ("Request failed with status code 401").

import { GET, POST } from '@/app/api/boards/[slug]/posts/route';

const params = { params: Promise.resolve({ slug: 'feedback' }) };

describe('boards/[slug]/posts proxy own-401 body', () => {
  it('GET 401 includes both error and message keys', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/boards/feedback/posts'),
      params
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Not authenticated');
    expect(body.message).toBe('Not authenticated');
  });

  it('POST 401 includes both error and message keys', async () => {
    const response = await POST(
      new NextRequest('http://localhost:3000/api/boards/feedback/posts', {
        method: 'POST',
        body: JSON.stringify({ title: 'x' }),
      }),
      params
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Not authenticated');
    expect(body.message).toBe('Not authenticated');
  });
});
