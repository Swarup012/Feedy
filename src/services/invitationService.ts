/**
 * Invitation Service - Frontend
 * API calls for organization invitation management
 */

import api from '@/lib/api';

export interface Invitation {
  id: string;
  email: string;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  inviter?: {
    name: string;
    avatar_url?: string;
  };
}

export interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  inviter: {
    name: string;
  };
}

class InvitationService {
  /**
   * Create a new invitation
   */
  async createInvitation(organizationId: string, email: string, role: 'member' | 'admin' = 'member') {
    const response = await api.post(`/api/organizations/${organizationId}/invites`, {
      email,
      role,
    });
    return response.data;
  }

  /**
   * Verify an invitation token (public - no auth required)
   */
  async verifyToken(token: string): Promise<{ valid: boolean; invitation?: InvitationDetails; error?: string }> {
    try {
      const response = await api.get(`/api/invitations/verify/${token}`);
      return response.data;
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.data?.error || 'Invalid or expired invitation',
      };
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string) {
    const response = await api.post(`/api/invitations/accept/${token}`);
    return response.data;
  }

  /**
   * List invitations for an organization
   */
  async listInvitations(organizationId: string, status?: string): Promise<Invitation[]> {
    const params = status ? { status } : {};
    const response = await api.get(`/api/organizations/${organizationId}/invites`, { params });
    return response.data.invitations || [];
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(organizationId: string, invitationId: string) {
    const response = await api.delete(`/api/organizations/${organizationId}/invites/${invitationId}`);
    return response.data;
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(organizationId: string, invitationId: string) {
    const response = await api.post(`/api/organizations/${organizationId}/invites/${invitationId}/resend`);
    return response.data;
  }
}

export const invitationService = new InvitationService();
