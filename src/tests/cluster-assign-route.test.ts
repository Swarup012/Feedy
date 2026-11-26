import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const assign = vi.hoisted(() => vi.fn());
vi.mock('@/ai/flows/assign-cluster', () => ({ assignCluster: assign }));
import { POST } from '../app/api/clusters/assign/route';

const body = { post_id: 'post-a', board_id: 'board-a', title: 'Title' };
function request(secret?: string, data = body) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret !== undefined) headers['x-internal-secret'] = secret;
  return new NextRequest('http://localhost/api/clusters/assign', { method: 'POST', headers, body: JSON.stringify(data) });
}
describe('cluster assignment internal route', () => {
  beforeEach(() => { process.env.INTERNAL_API_SECRET = 'test-secret'; assign.mockReset().mockResolvedValue({cluster_key:'group', confidence:1}); });
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.INTERNAL_API_SECRET; });
  it.each([undefined, 'wrong'])('rejects missing or wrong secret', async (secret) => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request(secret))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled(); expect(assign).not.toHaveBeenCalled();
  });
  it('rejects a post and board from different organizations before AI', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {status:404})); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request('test-secret'))).status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1); expect(assign).not.toHaveBeenCalled();
  });
  it('assigns a validated post and board', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {status:200})); vi.stubGlobal('fetch', fetchMock);
    expect((await POST(request('test-secret'))).status).toBe(200);
    expect(assign).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1].headers['x-internal-secret']).toBe('test-secret');
    expect(fetchMock.mock.calls[1][0]).toContain('/api/clusters/assign-post');
  });
  it('fails closed when the secret is not configured', async () => {
    delete process.env.INTERNAL_API_SECRET;
    expect((await POST(request('test-secret'))).status).toBe(401);
  });
});
