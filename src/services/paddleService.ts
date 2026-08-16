// src/services/paddleService.ts
import api from '@/lib/api';

export interface SubscriptionInfo {
  status: string;
  plan: string;
  billingCycle?: 'monthly' | 'yearly';
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasActiveSubscription: boolean;
  billingProvider: 'paddle';
  subscriptionId?: string;
  planId?: string;
}

export interface Invoice {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  status: string;
  invoiceUrl: string | null;
  receiptUrl: string | null;
  hasInvoice?: boolean;
}

export interface PricingPlan {
  name: string;
  price: number;
  features: {
    boards: number;
    posts_per_month: number;
    team_members: number;
    custom_branding: boolean;
    advanced_analytics: boolean;
  };
}

const paddleService = {
  /**
   * Get current Paddle subscription status
   */
  async getSubscription(): Promise<{ success: boolean; data: SubscriptionInfo }> {
    const response = await api.get('/api/paddle/subscription');
    return response.data;
  },

  /**
   * Create Paddle checkout session for subscription
   */
  async createCheckoutSession(
    options?: {
      plan?: 'starter' | 'pro';
      billingCycle?: 'monthly' | 'yearly';
      skipTrial?: boolean;
    }
  ): Promise<{ success: boolean; data: { url: string; transactionId?: string } }> {
    const response = await api.post('/api/paddle/create-checkout-session', {
      plan: options?.plan || 'starter',
      billingCycle: options?.billingCycle || 'monthly',
      skipTrial: options?.skipTrial || false,
    });
    return response.data;
  },

  /**
   * Update existing subscription plan (upgrade/downgrade)
   */
  async updateSubscriptionPlan(
    newPlan: 'starter' | 'pro',
    billingCycle: 'monthly' | 'yearly'
  ): Promise<{ success: boolean; data: { newPlan: string; billingCycle: string; message: string } }> {
    const response = await api.post('/api/paddle/subscription/update-plan', {
      newPlan,
      billingCycle,
    });
    return response.data;
  },

  /**
   * Cancel Paddle subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/api/paddle/subscription/cancel');
    return response.data;
  },

  /**
   * Get pricing configuration
   */
  async getPricing(): Promise<{ success: boolean; data: { plans: Record<string, PricingPlan>; trial: { enabled: boolean; days: number } } }> {
    const response = await api.get('/api/paddle/pricing');
    return response.data;
  },

  /**
   * Get invoices/payment history from Paddle
   */
  async getInvoices(limit = 1): Promise<{ success: boolean; data: { invoices: Invoice[] } }> {
    const response = await api.get(`/api/paddle/invoices?limit=${limit}`);
    return response.data;
  },
};

export default paddleService;
