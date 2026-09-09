/**
 * Shared container classNames for admin pages.
 *
 * Usage:
 *   import { WIDE_CONTAINER, NARROW_CONTAINER } from '@/lib/layout-constants';
 *   <div className={WIDE_CONTAINER}>...</div>
 */

/** Wide tier — data-heavy pages (Autopilot, Dashboard, Roadmap, etc.) */
export const WIDE_CONTAINER =
  'max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8';

/** Narrow tier — reading-focused pages (Changelog, Billing) */
export const NARROW_CONTAINER = 'max-w-3xl mx-auto px-4';
