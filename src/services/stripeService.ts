// src/services/stripeService.ts
import api from '@/lib/api';

export interface SubscriptionInfo {
  status: string;
  plan: string;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasActiveSubscription: boolean;
}

export interface Invoice {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export interface PricingPlan {
  name: string;
  price: number;
  features: {
    boards: number;
    posts_per_month: number;
    team_members: number;
    custom_branding: boolean;
    priority_support: boolean;
    advanced_analytics: boolean;
  };
}

const stripeService = {
  /**
   * Get current subscription status
   */
  async getSubscription(): Promise<{ success: boolean; data: SubscriptionInfo }> {
    const response = await api.get('/api/stripe/subscription');
    return response.data;
  },

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(
    priceId?: string
  ): Promise<{ success: boolean; data: { sessionId: string; url: string } }> {
    const successUrl = `${window.location.origin}/admin/profile?session_id={CHECKOUT_SESSION_ID}&success=true`;
    const cancelUrl = `${window.location.origin}/admin/profile?canceled=true`;

    const response = await api.post('/api/stripe/create-checkout-session', {
      priceId,
      successUrl,
      cancelUrl,
    });
    return response.data;
  },

  /**
   * Create customer portal session
   */
  async createPortalSession(): Promise<{ success: boolean; data: { url: string } }> {
    const returnUrl = `${window.location.origin}/admin/profile`;
    
    const response = await api.post('/api/stripe/create-portal-session', {
      returnUrl,
    });
    return response.data;
  },

  /**
   * Get pricing configuration
   */
  async getPricing(): Promise<{ success: boolean; data: { plans: Record<string, PricingPlan>; trial: { enabled: boolean; days: number } } }> {
    const response = await api.get('/api/stripe/pricing');
    return response.data;
  },

  /**
   * Get invoices/payment history
   */
  async getInvoices(limit = 10): Promise<{ success: boolean; data: { invoices: Invoice[] } }> {
    const response = await api.get(`/api/stripe/invoices?limit=${limit}`);
    return response.data;
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(immediately = false): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/stripe/cancel-subscription', {
      immediately,
    });
    return response.data;
  },
};

export default stripeService;
