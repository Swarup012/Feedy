import api from '@/lib/api';

interface CustomDomain {
  id: string;
  domain: string;
  verification_token: string;
  is_verified: boolean;
  ssl_status: string;
  status: string;
  created_at: string;
  verified_at?: string;
  dns_records?: DNSRecord[];
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  description: string;
}

class CustomDomainService {
  /**
   * Add a new custom domain
   */
  async addDomain(domain: string): Promise<CustomDomain> {
    const response = await api.post('/api/custom-domains', { domain });
    return response.data.data;
  }

  /**
   * Get organization's custom domain
   */
  async getDomain(): Promise<CustomDomain | null> {
    try {
      const response = await api.get('/api/custom-domains');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Verify domain ownership
   */
  async verifyDomain(domainId: string): Promise<CustomDomain> {
    const response = await api.post(`/api/custom-domains/${domainId}/verify`);
    return response.data.data;
  }

  /**
   * Get DNS verification status
   */
  async getDNSStatus(domainId: string): Promise<any> {
    const response = await api.get(`/api/custom-domains/${domainId}/dns-status`);
    return response.data.data;
  }

  /**
   * Delete custom domain
   */
  async deleteDomain(domainId: string): Promise<void> {
    await api.delete(`/api/custom-domains/${domainId}`);
  }
}

export default new CustomDomainService();
