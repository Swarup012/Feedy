import { describe, it, expect, vi } from 'vitest';
import api from '@/lib/api';
import { zapierConnection } from '@/services/zapierConnection';

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), delete: vi.fn() },
}));

describe('Zapier connection management', () => {
  it('loads only the Zapier count and disconnects through the same org-scoped endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { activeConnections: 3 } } });
    vi.mocked(api.delete).mockResolvedValue({ data: { success: true } });

    expect(await zapierConnection.getActiveCount('org-1')).toBe(3);
    await zapierConnection.disconnect('org-1');

    expect(api.get).toHaveBeenCalledWith('/api/orgs/org-1/integrations/zapier');
    expect(api.delete).toHaveBeenCalledWith('/api/orgs/org-1/integrations/zapier');
  });
});
