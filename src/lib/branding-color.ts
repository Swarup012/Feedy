/**
 * Branding color helpers for the public portal.
 *
 * Org branding stores a #RRGGBB hex; the portal theme is driven by CSS vars
 * holding bare HSL triplets (e.g. "217 91% 60%") consumed as hsl(var(--primary)).
 */

/**
 * Convert a #RRGGBB hex color to a bare HSL triplet ("H S% L%") suitable for
 * hsl(var(--x)). Returns null for anything that isn't a valid 6-digit hex.
 */
export function hexToHslTriplet(hex: string): string | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }

  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Pick a foreground (text) color triplet for a brand background: white for
 * dark brand colors, near-black (#111) for light ones. Uses the YIQ
 * brightness formula (weighted NTSC luma) — its 128 boundary keeps the
 * default brand blue (#3b82f6) on white text, matching the existing theme.
 * Returns null when hex is invalid.
 */
export function contrastForeground(hex: string): string | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;

  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? '0 0% 7%' : '0 0% 100%';
}

type Rgb = [number, number, number];

const VOTE_IDLE_RGB: Record<'light' | 'dark', Rgb> = {
  light: [100, 116, 139], // --vote-idle: #64748B
  dark: [148, 163, 184], // --vote-idle: #94A3B8
};
const CARD_RGB: Record<'light' | 'dark', Rgb> = {
  light: [255, 255, 255], // --card: 0 0% 100%
  dark: [16, 20, 25], // --card: 214 23.4% 8.1%
};

function parseHexRgb(hex: string): Rgb | null {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

/** WCAG relative luminance for an sRGB colour. */
function luminance([r, g, b]: Rgb): number {
  const channel = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Theme vars for the idle vote arrow, per mode.
 *
 * The idle colour is `color-mix(in srgb, <brand> 55%, <vote-idle> 45%)`.
 * CSS cannot branch on contrast, so the same sRGB mix is measured here and
 * any mode below 3:1 against the card background falls back to the neutral
 * `hsl(var(--vote-idle))` instead.
 */
export function voteIdleStyles(hex: string): Record<string, string> {
  const brand = parseHexRgb(hex);
  if (!brand) return {};

  const styles: Record<string, string> = {};
  for (const mode of ['light', 'dark'] as const) {
    const slate = VOTE_IDLE_RGB[mode];
    const mixed = brand.map((value, i) =>
      Math.round(value * 0.55 + slate[i] * 0.45),
    ) as Rgb;
    styles[`--vote-arrow-idle-${mode}`] =
      contrastRatio(mixed, CARD_RGB[mode]) >= 3
        ? 'color-mix(in srgb, hsl(var(--primary)) 55%, hsl(var(--vote-idle)) 45%)'
        : 'hsl(var(--vote-idle))';
  }
  return styles;
}
