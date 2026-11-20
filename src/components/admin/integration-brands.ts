export const INTEGRATION_BRAND_COLORS = {
  discord: '#5865F2',
  intercom: '#1F8DED',
  slack: '#E01E5A',
  github: '#24292F',
  zapier: '#FF4F00',
} as const;

export type IntegrationProvider = keyof typeof INTEGRATION_BRAND_COLORS;

// Intercom hasn't fully approved the integration yet. Flip to false to hide
// the notice everywhere.
export const INTERCOM_UNDER_REVIEW = true;
