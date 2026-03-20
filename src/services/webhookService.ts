// src/services/webhookService.ts
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type WebhookType = 'custom' | 'discord' | 'slack';

export type WebhookEvent =
  | 'post.created'
  | 'post.updated'
  | 'post.status_changed'
  | 'post.deleted'
  | 'comment.created'
  | 'vote.created'
  | 'board.created'
  | 'changelog.published';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  type: WebhookType;
  events: WebhookEvent[];
  board_ids: string[] | null;
  description: string | null;
  is_active: boolean;
  is_verified: boolean;
  secret_key?: string; // Only returned on create/regenerate
  total_deliveries: number;
  failed_deliveries: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  event_type: string;
  event_id: string | null;
  attempt_number: number;
  max_attempts: number;
  request_url: string;
  request_headers?: Record<string, string>;
  request_body?: any;
  response_status: number | null;
  response_body?: string;
  response_time_ms: number | null;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  error_message: string | null;
  created_at: string;
  delivered_at: string | null;
  next_retry_at: string | null;
}

export interface WebhookEventLog {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  triggered_by: string | null;
  board_id: string | null;
  webhooks_triggered: number;
  created_at: string;
}

export interface CreateWebhookPayload {
  name: string;
  url: string;
  type: WebhookType;
  events: WebhookEvent[];
  board_ids?: string[] | null;
  description?: string | null;
}

export interface UpdateWebhookPayload {
  name?: string;
  url?: string;
  type?: WebhookType;
  events?: WebhookEvent[];
  board_ids?: string[] | null;
  description?: string | null;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────

export const webhookService = {
  /**
   * List all webhooks for current organization
   */
  async listWebhooks(): Promise<Webhook[]> {
    const res = await api.get('/api/webhooks');
    return res.data.data.webhooks;
  },

  /**
   * Get a single webhook by ID
   */
  async getWebhook(id: string): Promise<Webhook> {
    const res = await api.get(`/api/webhooks/${id}`);
    return res.data.data.webhook;
  },

  /**
   * Create a new webhook. Returns webhook including secret_key (show once).
   */
  async createWebhook(payload: CreateWebhookPayload): Promise<Webhook> {
    const res = await api.post('/api/webhooks', payload);
    return res.data.data.webhook;
  },

  /**
   * Update an existing webhook
   */
  async updateWebhook(id: string, payload: UpdateWebhookPayload): Promise<Webhook> {
    const res = await api.put(`/api/webhooks/${id}`, payload);
    return res.data.data.webhook;
  },

  /**
   * Delete a webhook
   */
  async deleteWebhook(id: string): Promise<void> {
    await api.delete(`/api/webhooks/${id}`);
  },

  /**
   * Send a test delivery to the webhook URL
   */
  async testWebhook(id: string): Promise<{ success: boolean; response_status: number | null; error_message: string | null }> {
    const res = await api.post(`/api/webhooks/${id}/test`);
    return res.data.data;
  },

  /**
   * Regenerate the signing secret. Returns new secret (show once).
   */
  async regenerateSecret(id: string): Promise<{ webhook_id: string; webhook_name: string; new_secret: string }> {
    const res = await api.post(`/api/webhooks/${id}/regenerate-key`);
    return res.data.data;
  },

  /**
   * Get delivery logs for a webhook (paginated)
   */
  async listDeliveries(
    webhookId: string,
    options?: { page?: number; limit?: number; status?: string }
  ): Promise<{ deliveries: WebhookDelivery[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.status) params.set('status', options.status);
    const res = await api.get(`/api/webhooks/${webhookId}/deliveries?${params.toString()}`);
    return res.data.data;
  },

  /**
   * Get full details of a single delivery
   */
  async getDelivery(webhookId: string, deliveryId: string): Promise<WebhookDelivery> {
    const res = await api.get(`/api/webhooks/${webhookId}/deliveries/${deliveryId}`);
    return res.data.data.delivery;
  },

  /**
   * Retry a failed delivery
   */
  async retryDelivery(webhookId: string, deliveryId: string): Promise<{ success: boolean }> {
    const res = await api.post(`/api/webhooks/${webhookId}/deliveries/${deliveryId}/retry`);
    return res.data.data;
  },

  /**
   * Get supported event types from API
   */
  async listEventTypes(): Promise<{ value: string; label: string; category: string }[]> {
    const res = await api.get('/api/webhooks/events');
    return res.data.data.events;
  },

  /**
   * Get fired event audit log
   */
  async listEventLog(options?: { page?: number; limit?: number; event_type?: string }): Promise<{
    events: WebhookEventLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.event_type) params.set('event_type', options.event_type);
    const res = await api.get(`/api/webhooks/event-log?${params.toString()}`);
    return res.data.data;
  },
};

export default webhookService;
