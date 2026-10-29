/**
 * Currency formatting for revenue surfaces.
 *
 * No decimals; compact notation at or above 100k (e.g. "$123.4K").
 * Invalid currency codes fall back to USD so a bad org setting can never
 * throw inside render.
 */
export function formatMrr(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const compact = Math.abs(value) >= 100_000;
  const base = {
    style: 'currency' as const,
    currency,
    ...(compact
      ? { notation: 'compact' as const, maximumFractionDigits: 1 }
      : { maximumFractionDigits: 0 }),
  };
  try {
    return new Intl.NumberFormat('en-US', base).format(value);
  } catch {
    return new Intl.NumberFormat('en-US', { ...base, currency: 'USD' }).format(value);
  }
}
