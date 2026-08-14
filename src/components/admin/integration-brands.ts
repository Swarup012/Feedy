export const INTEGRATION_BRAND_COLORS = {
  discord: '#5865F2',
  intercom: '#1F8DED',
  slack: '#E01E5A',
  github: '#24292F',
} as const;

export type IntegrationProvider = keyof typeof INTEGRATION_BRAND_COLORS;
