import { describe, it, expect } from 'vitest';
import { hexToHslTriplet, contrastForeground, voteIdleStyles } from '@/lib/branding-color';

describe('hexToHslTriplet', () => {
  it('black → 0 0% 0%', () => {
    expect(hexToHslTriplet('#000000')).toBe('0 0% 0%');
  });

  it('white → 0 0% 100%', () => {
    expect(hexToHslTriplet('#ffffff')).toBe('0 0% 100%');
  });

  it('yellow → 60 100% 50%', () => {
    expect(hexToHslTriplet('#ffff00')).toBe('60 100% 50%');
  });

  it('brand blue #3b82f6 → 217 91% 60% (matches the default --primary)', () => {
    expect(hexToHslTriplet('#3b82f6')).toBe('217 91% 60%');
  });

  it('accepts uppercase hex', () => {
    expect(hexToHslTriplet('#FF0000')).toBe('0 100% 50%');
  });

  it.each(['red', '#fff', '#12345', '#gggggg', '', ' #ff0000x '])(
    'invalid %o → null',
    (value) => {
      expect(hexToHslTriplet(value)).toBeNull();
    },
  );
});

describe('contrastForeground', () => {
  it('black background → white text', () => {
    expect(contrastForeground('#000000')).toBe('0 0% 100%');
  });

  it('white background → near-black text', () => {
    expect(contrastForeground('#ffffff')).toBe('0 0% 7%');
  });

  it('yellow background → near-black text', () => {
    expect(contrastForeground('#ffff00')).toBe('0 0% 7%');
  });

  it('brand blue #3b82f6 → white text (same as the default theme)', () => {
    expect(contrastForeground('#3b82f6')).toBe('0 0% 100%');
  });

  it.each(['red', '#fff', 'nope'])('invalid %o → null', (value) => {
    expect(contrastForeground(value)).toBeNull();
  });
});

describe('voteIdleStyles', () => {
  const mix =
    'color-mix(in srgb, hsl(var(--primary)) 55%, hsl(var(--vote-idle)) 45%)';

  it('keeps the brand mix when it clears 3:1 in both modes', () => {
    expect(voteIdleStyles('#E91E63')).toEqual({
      '--vote-arrow-idle-light': mix,
      '--vote-arrow-idle-dark': mix,
    });
    expect(voteIdleStyles('#0D9488')).toEqual({
      '--vote-arrow-idle-light': mix,
      '--vote-arrow-idle-dark': mix,
    });
  });

  it('falls back to slate in light mode for pale brands', () => {
    expect(voteIdleStyles('#FEF08A')).toEqual({
      '--vote-arrow-idle-light': 'hsl(var(--vote-idle))',
      '--vote-arrow-idle-dark': mix,
    });
  });

  it('falls back to slate in dark mode for very dark brands', () => {
    expect(voteIdleStyles('#111827')).toEqual({
      '--vote-arrow-idle-light': mix,
      '--vote-arrow-idle-dark': 'hsl(var(--vote-idle))',
    });
  });

  it('ignores invalid hex', () => {
    expect(voteIdleStyles('red')).toEqual({});
  });
});
