import { describe, it, expect } from 'vitest';
import { formatMrr } from '@/lib/format-mrr';

describe('formatMrr', () => {
  it('formats with no decimals', () => {
    expect(formatMrr(4200, 'USD')).toBe('$4,200');
    expect(formatMrr(300.7, 'EUR')).toBe('€301');
  });

  it('zero is a formatted value, not empty', () => {
    expect(formatMrr(0, 'USD')).toBe('$0');
  });

  it('compact notation at or above 100k', () => {
    expect(formatMrr(123_400, 'USD')).toBe('$123.4K');
    expect(formatMrr(1_250_000, 'EUR')).toBe('€1.3M');
  });

  it('below 100k is never compact', () => {
    expect(formatMrr(99_999, 'USD')).toBe('$99,999');
  });

  it('respects the org currency', () => {
    expect(formatMrr(1500, 'JPY')).toBe('¥1,500');
    expect(formatMrr(1500, 'GBP')).toBe('£1,500');
  });

  it('negative values keep sign and compact threshold', () => {
    expect(formatMrr(-1500, 'USD')).toBe('-$1,500');
    expect(formatMrr(-150_000, 'USD')).toBe('-$150K');
  });

  it('null/undefined/NaN → em dash', () => {
    expect(formatMrr(null)).toBe('—');
    expect(formatMrr(undefined)).toBe('—');
    expect(formatMrr(NaN)).toBe('—');
  });

  it('invalid currency falls back to USD instead of throwing', () => {
    expect(formatMrr(1000, 'NOT_A_CODE')).toBe('$1,000');
  });
});
