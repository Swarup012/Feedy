import api from '@/lib/api';

export interface CustomDomain {
  id: string;
  domain: string;
  verification_token: string;
  is_verified: boolean;
  hostname_status: string; // pending | active | failed (Cloudflare)
  cert_status: string; // pending | active | failed (Cloudflare edge cert)
  error_message?: string | null;
  cloudflare_hostname_id?: string | null;
  created_at: string;
  verified_at?: string;
  dns_records?: DNSInstruction[];
}

/** DNS setup instructions: both name forms for the customer's DNS UI. */
export interface DNSInstruction {
  type: string;
  name: string; // relative name ("feedback") — what a zone editor expects
  full_name: string; // full record name ("feedback.acme.com") — what the checker looks up
  value: string;
  ttl: number;
  description: string;
}

/** details payload of the verify 400 responses (DNS incomplete / CF pending). */
export interface VerifyIncompleteDetails {
  txtValid?: boolean;
  cnameValid?: boolean;
  allValid?: boolean;
  hostname_status?: string;
  cert_status?: string;
  message?: string;
}

class CustomDomainService {
  /**
   * Add a custom domain (DB row only — Cloudflare is touched on verify).
   */
  async addDomain(domain: string): Promise<CustomDomain> {
    const response = await api.post('/api/custom-domains', { domain });
    return response.data.data;
  }

  /**
   * Get organization's custom domain.
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
   * Verify domain ownership — the ONLY endpoint that refreshes Cloudflare
   * state (hostname_status / cert_status / is_verified). GET never does.
   * 200 = fully verified; 400 = still pending (details carry validation
   * hints + CF statuses); 429 = cooldown; 403/502/503 = generic server text.
   */
  async verifyDomain(domainId: string): Promise<CustomDomain> {
    const response = await api.post(`/api/custom-domains/${domainId}/verify`);
    return response.data.data;
  }

  /**
   * Delete custom domain (also removes the Cloudflare hostname server-side).
   */
  async deleteDomain(domainId: string): Promise<void> {
    await api.delete(`/api/custom-domains/${domainId}`);
  }
}

export default new CustomDomainService();
