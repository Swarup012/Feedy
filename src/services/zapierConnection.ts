import api from '@/lib/api';

function connectionPath(orgId: string) {
  return `/api/orgs/${encodeURIComponent(orgId)}/integrations/zapier`;
}

export const zapierConnection = {
  async getActiveCount(orgId: string): Promise<number> {
    const response = await api.get<{ data: { activeConnections: number } }>(connectionPath(orgId));
    return response.data.data.activeConnections;
  },

  async disconnect(orgId: string): Promise<void> {
    await api.delete(connectionPath(orgId));
  },
};
