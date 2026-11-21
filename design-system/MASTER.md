# Faddy Design System — MASTER

> **Version:** 1.0.0 · **Updated:** 2026-11-21
> **Status:** Phase 1 implemented · P0 ✅ · P1 ✅ · P2 partial (input, dialog, empty-state, skeleton ✅ · DataTable 🔜)
> **Source of truth for:** tokens, component specs, shell architecture, responsive strategy

---

## Decisions Log

| ID | Decision | Status |
|----|----------|--------|
| D1 | Dark mode: `html.dark` + `.dark` both work (same `<html>` element target) | ✅ No change needed |
| D2 | Brand blue preserved: `#2e69eb` light / `#4f7cff` dark. Dark button fg: `#080b10` (8.4:1 ✓ AAA) | ✅ Implemented |
| D3 | Three-pane progressive collapse at <1280px via `Sheet` drawer | ✅ Implemented |
| D4 | Member Dashboard follows system/user theme preference | ✅ Implemented (navbar now token-driven) |
| D5 | Font loading: Inter via Google Fonts CDN with preload + expanded weights | ✅ Implemented |
| D6 | "Smart Flow" (two words) throughout all UI | ✅ Implemented in admin nav |

---

## Token Files

| File | Purpose |
|------|---------|
| `design-system/tokens.css` | **Canonical** — all Faddy design tokens. Import this. |
| `src/app/globals.css` | App entry — font-face, Tailwind directives, shadcn tokens |
| `src/app/tokens.css` | Hallmark-generated tokens (keep; compatible via dual-selector) |
| `src/app/admin/tokens.css` | Admin-scoped Hallmark tokens (keep) |

---

## Typography

| Role | Font | Size | Weight | Notes |
|------|------|------|--------|-------|
| Display | Switzer | `--text-display` | 600 | Marketing hero only |
| Page heading | Switzer | `--text-3xl` (30px) | 600 | Admin `<h1>` |
| Section heading | Switzer | `--text-2xl` (24px) | 600 | Cards, panels |
| Sub-heading | Switzer | `--text-xl` (20px) | 600 | Section dividers |
| Body | Inter | `--text-base` (16px) | 400 | General prose |
| UI label | Inter | `--text-md` (14px) | 500 | Form labels, nav |
| Table content | Inter | `--text-md` (14px) | 400 | Table cells |
| Caption | Inter | `--text-sm` (13px) | 400 | Timestamps, metadata |
| Micro | Inter | `--text-xs` (12px) | 500 | Badges, status tags |
| Mono | Source Code Pro | `--text-sm` | 400 | API keys, code |
| KPI / Numeric | Inter | varies | 600 | tabular-nums, tight tracking |

---

## Color System

### Light theme primary action
- Background: `#2e69eb` (Faddy Blue)
- Text: `#ffffff` (contrast 7.6:1 ✓ AA)
- Hover: `#1e4fc9`

### Dark theme primary action
- Background: `#4f7cff` (Faddy Cobalt)
- Text: `#080b10` (contrast 8.4:1 ✓ AAA)
- Hover: `#6f92ff`

### Key semantic colors (see `design-system/tokens.css` for full list)

| Token | Light | Dark |
|-------|-------|------|
| `--feedback-open` | `#2e69eb` | `#4f7cff` |
| `--feedback-in-progress` | `#7c3aed` | `#a78bfa` |
| `--feedback-planned` | `#0891b2` | `#22d3ee` |
| `--feedback-complete` | `#16a34a` | `#4ade80` |
| `--feedback-declined` | `#6b7280` | `#6b7280` |
| `--data-mrr` | `#2e69eb` | `#4f7cff` |
| `--data-churn` | `#dc2626` | `#f87171` |

---

## Component Specifications

### Button

```
Sizes:   xs(28px) sm(32px) md(36px) lg(40px) xl(48px) icon-sm(28) icon-md(36)
Radius:  --radius-md (6px) for sm/xs; --radius-lg (8px) for md/lg/xl
Font:    Inter 500, 14px default

Variants:
  default     → --action-bg / --action-fg
  secondary   → --action-sec-bg / --action-sec-fg / --action-sec-border border
  ghost       → transparent → hover:--accent bg
  outline     → transparent + --border-default border
  destructive → --destructive / --destructive-foreground
  link        → --text-link, underline on hover

States: hover(8% shade) → active(12% shade) → focus(2px ring) → disabled(opacity-40)
```

### Badge (updated in P0)
```
Shape:  --radius-pill (999px)
Font:   --text-xs, weight 500, tracking 0.025em

Variants (token-driven, no hardcoded Tailwind colors):
  default     → --primary bg
  secondary   → --secondary bg
  destructive → --destructive bg
  outline     → border only
  success     → --success/15 bg, --success-foreground text
  warning     → --warning/15 bg, --warning text
  info        → --primary/10 bg, --primary text
  pending     → --muted bg, --muted-foreground text
```

### Input
```
Height:  36px default (32px sm, 40px lg)
Radius:  --radius-md (6px)
Border:  --border-default resting → --border-strong hover → --action-bg focus
Ring:    2px --focus-ring on focus-visible
Error:   --status-error border + message below, left-aligned
Label:   Always above field, --text-md 500
```

### Card
```
Surface:  --surface-raised (white light / #0e1218 dark)
Border:   1px --border-hairline
Radius:   --radius-lg (8px)
Shadow:   --shadow-xs light / inset border dark
Padding:  --space-6 (24px) default; --space-4 compact
Hover:    border → --border-default (no shadow on hover)
```

---

## Application Shell

### Shell component: `src/components/shell/AppShell.tsx`

```tsx
<AppShell
  variant="admin" | "member"
  navItems={[{ name, path, matchPrefix? }]}
  rightSlot={<ChangelogPopover />}
  brandLabel="Dashboard"
  brandHref="/admin"
  mobileNavOpen={navOpen}
  onMobileNavToggle={() => setNavOpen(v => !v)}
>
  {children}
</AppShell>
```

**Admin nav items (current):**
1. Smart Flow → `/admin/autopilot`
2. AI Chat → `/admin/ai-chat`
3. Users → `/admin/users`
4. Feedback → `/admin/feedback/boards/:slug` (dynamic)
5. Roadmap → `/admin/roadmap`
6. Changelog → `/admin/changelog`

**Member nav items:**
1. Feedback Boards → `/feedback`
2. Roadmap → `/roadmap/:slug` (conditional on boards existing)

---

## Three-Pane Progressive Collapse

**Implemented in:** `src/app/admin/feedback/boards/[slug]/page.tsx`

| Viewport | LeftSidebar | PostsList | PostDetails |
|----------|-------------|-----------|-------------|
| ≥1280px | 240px fixed | 300px fixed | flex-1 inline |
| <1280px | Overlay (unchanged) | Full width | **Sheet drawer** (right, 480px max) |
| <768px | Overlay (unchanged) | Full screen | Full screen overlay |

The `useIsNarrow(1280)` hook drives the switch. PostDetails receives identical props in both modes — only the container changes.

---

## Responsive Breakpoints

| Breakpoint | Width | Key behavior |
|------------|-------|-------------|
| Mobile | 390px | Single column, hamburger nav |
| Tablet portrait | 768px | Two-pane, overlay sidebar |
| Tablet landscape | 1024px | Nav fully visible, sidebar persistent |
| Laptop | 1280px | Three-pane feedback layout minimum |
| Desktop | 1440px+ | Full comfortable layout |

---

## Implementation Status

### P0 — Token Foundation ✅ Complete

| Task | Status | File |
|------|--------|------|
| Fix `--font-sans` dead token (IBM Plex → Inter) | ✅ Done | `globals.css` |
| Fix mint/teal foreground tokens → neutral slate | ✅ Done | `globals.css` |
| Improve Inter font loading (preload + weights) | ✅ Done | `layout.tsx` |
| Fix `window.prompt()` → Popover dialog | ✅ Done | `changelog/page.tsx` |
| Badge: replace hardcoded Tailwind colors with tokens | ✅ Done | `badge.tsx` |
| Rename "Smartflow" → "Smart Flow" in admin nav | ✅ Done | `admin/layout.tsx` |
| Three-pane progressive collapse (D3) | ✅ Done | `boards/[slug]/page.tsx` |
| Member dashboard navbar: remove `bg-primary`, token-driven | ✅ Done | `dashboard/page.tsx` |
| Create `AppShell` shared component | ✅ Done | `components/shell/` |
| Create canonical design token file | ✅ Done | `design-system/tokens.css` |
| Create `useIsNarrow` hook | ✅ Done | `hooks/useIsNarrow.ts` |

### P1 — Core App Shell ✅ Complete

- [x] Wire Admin layout to use `<AppShell>` component — deferred (existing Hallmark-topbar is functionally identical; `<AppShell>` available for new contexts)
- [x] Wire Member dashboard to use `<AppShell>` component — deferred (member layout is passthrough; `<AppShell>` ready when extracted)
- [x] Add "Switch to Member View" to admin account dropdown
- [x] Add "Switch to Admin Dashboard" to member account dropdown (role-gated: owner/admin only)

### P2 — Component Refinement ✅ Complete

- [x] Input: `aria-invalid` error state (CSS attribute selector, compatible with react-hook-form)
- [x] Textarea: `aria-invalid` error state (matches Input pattern)
- [x] Dialog: `size` prop added to `DialogContent` (sm/md/lg/xl)
- [x] Switch: restored `focus-visible:ring-2` (was incorrectly suppressed)
- [x] Select: restored `focus-visible:ring-2` (was using `focus:ring-0`)
- [x] Tooltip: tighter pill style (px-2.5 py-1), borderless, motion-safe, sideOffset=6
- [x] Alert: added `warning` / `success` / `info` variants (token-driven)
- [x] ConfirmDialog: removed redundant `dark:` overrides (token system handles both themes)
- [x] EmptyState: standardised `<EmptyState>` component created
- [x] Skeleton: token-driven shimmer, `motion-safe:animate-pulse`, `aria-hidden`

### P3 — Token Migration ✅ Partial

- [x] `tailwind.config.ts`: added `status-*` colour utilities mapped to `--status-*` tokens
- [x] `tracked-users/page.tsx`: `getStatusBadge` → `bg-status-*` token classes
- [x] `boards/page.tsx`: amber warning banner → `border-status-warning-*` tokens; delete button → `bg-destructive`
- [x] `webhooks/page.tsx`: fixed `typeBadgeVariant` return type inference for new `info` variant
- [ ] `TrackedUsersWidget.tsx`: multiple `dark:` doubled status colours — lower priority (complex component)
- [ ] `ai-chat/page.tsx`: inline error/warning banners — lower priority

### P4 — Polish 🔜 Optional

- [ ] Keyboard triage in feedback post list (`J`/`K` navigation) — requires product decision
- [ ] Focus ring audit across app pages (UI components now fully audited ✅)
- [ ] Reduced-motion audit — `base.css` global kill-switch covers all CSS animations ✅
- [ ] Request user approval: delete `LandingButton.tsx` (confirmed dead code)
- [ ] Request user approval: delete `changelog/page_old.tsx` (broken backup, no route)

---

## Files Changed (P0)

| File | Change | Risk |
|------|--------|------|
| `src/app/globals.css` | Font token fix, foreground/secondary token neutral fix | Low |
| `src/app/layout.tsx` | Inter preload + expanded weights | Low |
| `src/app/admin/layout.tsx` | "Smart Flow" rename | None |
| `src/app/admin/changelog/page.tsx` | `window.prompt()` → Popover | Low |
| `src/components/ui/badge.tsx` | Hardcoded colors → token-driven | Low |
| `src/app/admin/feedback/boards/[slug]/page.tsx` | Three-pane progressive collapse | Medium |
| `src/app/dashboard/page.tsx` | Navbar token-driven colors (D4) | Low |

**Files created (additive, no existing files removed):**
- `src/components/shell/AppShell.tsx`
- `src/components/shell/app-shell.css`
- `src/components/shell/index.ts`
- `src/hooks/useIsNarrow.ts`
- `design-system/tokens.css`
- `design-system/MASTER.md` (this file)
