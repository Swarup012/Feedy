# Design: Feedy (Faddy)

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: owner statement hero (landing); feature pages each take their own shape (see .hallmark/log.json)
- Theme: brand (kept: Faddy cobalt, Switzer + Inter, read from src/app/globals.css)
- Axes: cool-paper/grotesk/brand-blue · posture: Restrained, one declared accent band per page where the theme's `--color-band-field` carries it

## Tokens
`src/app/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(98.6% 0.005 250);  --color-paper-2: oklch(96.2% 0.008 252);  --color-paper-3: oklch(93% 0.011 252);
  --color-ink: oklch(21% 0.028 262);  --color-ink-2: oklch(36% 0.022 260);  --color-muted: oklch(50% 0.018 258);  --color-rule: oklch(90% 0.009 252);
  --color-accent: oklch(56% 0.206 263);  --color-accent-ink: oklch(98.6% 0.005 250);  --color-focus: oklch(56% 0.206 263);
  --font-display: "Switzer", ui-sans-serif, system-ui, sans-serif;  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;  --font-outlier: "Source Code Pro", ui-monospace, monospace;
  --radius-card: 8px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: 0 1px 2px oklch(21% 0.028 262 / 0.06);
}
```
The spacing scale, the type scale, the easings and the durations are the scaffold's and live in `tokens.css`. Dark mode re-derives on `html.dark`.

## Controls
- Primary: accent fill (`--color-accent`), `--color-accent-ink` text · `--radius-input` · 48px height
- Secondary: outlined (`--color-rule-2`), ink text · same radius and height
- One filled primary per page; nav actions quieter than the hero's.

## Motion
- Character: still; modern-minimal keeps reveals off; the only motion is control state (color, 1px lift) at `--dur-micro`/`--dur-short`. Everything ends at once under reduced motion.

## Chrome
- Nav: floating pill (shared `marketing-chrome.tsx`, kept). Footer: `LandingFooter` (kept). Feature pages own the space between.

## Exports
`tokens.css` in this project (CSS custom properties). Tailwind, DTCG or shadcn blocks are added here on request, per export-formats.md.
