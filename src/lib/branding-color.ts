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
