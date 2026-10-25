import React from "react";
import { FileText, MessageSquare, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Decorative hero backdrop: a pixel-art city skyline along the bottom edge of
 * the marketing hero, plus a quiet stream of feedback signals (speech bubbles,
 * upvotes, feature docs, notification dots, connection nodes) drifting upward.
 *
 * Purely presentational — no state, no timers, no JS animation loop, nothing
 * to hydrate and nothing to clean up. Movement comes entirely from the
 * `heroSignal` keyframes in globals.css; each element carries its own duration
 * and (negative) delay so the signals never fall into lockstep. The global
 * reduced-motion rule in globals.css disables those animations, leaving the
 * signals as a faint static scattering.
 *
 * The layer is absolutely positioned inside the hero section (which is
 * `relative overflow-hidden`), painted at z-0 behind the hero content (z-10),
 * and marked `pointer-events-none` + `aria-hidden` so it can never intercept a
 * click or reach the accessibility tree.
 */

const SKYLINE_W = 1440;
const SKYLINE_H = 160;
const BASELINE = SKYLINE_H;

/* ---------------------------------------------------------------------------
   SKYLINE GEOMETRY

   Every building is a stack of axis-aligned blocks (x/w absolute, y/h measured
   up from the baseline). Blocks are unioned into a single silhouette path, so
   setbacks, cornices, notches, crowns and antennas all come from the same
   primitive instead of one repeated rectangle.

   Tones are deliberately uneven — pale blue-gray behind, muted navy in front —
   so the row reads with depth rather than as a flat cut-out.
--------------------------------------------------------------------------- */

type Block = { x: number; w: number; y: number; h: number };

/** Window grid: cell pitch (cw/ch) and window size (wx/wy) in viewBox units. */
type Win = { cw: number; ch: number; wx: number; wy: number };

type Building = { blocks: Block[]; tone: number; win?: Win };

const OFFICE: Win = { cw: 14, ch: 16, wx: 6, wy: 5 };
const SHOPS: Win = { cw: 16, ch: 18, wx: 7, wy: 5 };
const DENSE: Win = { cw: 11, ch: 13, wx: 4, wy: 4 };
const SLIM: Win = { cw: 10, ch: 14, wx: 4, wy: 5 };

const FACADES = [
  "fill-blue-900/[0.07] dark:fill-blue-400/[0.055]",
  "fill-slate-900/[0.085] dark:fill-slate-300/[0.065]",
  "fill-blue-800/[0.105] dark:fill-blue-400/[0.08]",
  "fill-indigo-900/[0.095] dark:fill-indigo-400/[0.075]",
];

const WIN_BASE = "fill-blue-500/[0.32] dark:fill-blue-400/[0.28]";
const WIN_LIGHT = "fill-blue-300/[0.5] dark:fill-blue-300/[0.4]";
const WIN_DARK = "fill-blue-700/[0.36] dark:fill-blue-600/[0.32]";

/**
 * Composition: tall towers at both frame edges, a mid-rise shoulder stepping
 * down from each, and a deliberately low centre band. The centre stays low so
 * the hero's benefit row always sits in clear air above the roofline at every
 * breakpoint; the two slim towers mark the gaps between the stat items. Gaps
 * of 4–24 units break the row up. Heights are measured up from the baseline.
 */
const BUILDINGS: Building[] = [
  // --- Left edge: the tallest cluster ------------------------------------
  // Stepped office with an overhanging cornice
  {
    tone: 1,
    win: OFFICE,
    blocks: [
      { x: 0, w: 76, y: 0, h: 76 },
      { x: 8, w: 60, y: 76, h: 18 },
      { x: 30, w: 16, y: 94, h: 16 },
    ],
  },
  // Art-deco skyscraper: three setbacks, crown, antenna
  {
    tone: 2,
    win: OFFICE,
    blocks: [
      { x: 84, w: 56, y: 0, h: 88 },
      { x: 90, w: 44, y: 88, h: 30 },
      { x: 97, w: 30, y: 118, h: 20 },
      { x: 104, w: 16, y: 138, h: 10 },
      { x: 110, w: 4, y: 148, h: 8 },
    ],
  },
  // Setback tower with a mast — steps the cluster down toward the centre
  {
    tone: 0,
    win: DENSE,
    blocks: [
      { x: 146, w: 38, y: 0, h: 72 },
      { x: 151, w: 28, y: 72, h: 18 },
      { x: 162, w: 6, y: 90, h: 10 },
    ],
  },

  // --- Left shoulder ------------------------------------------------------
  // Notched roof
  {
    tone: 0,
    win: DENSE,
    blocks: [
      { x: 206, w: 52, y: 0, h: 44 },
      { x: 206, w: 18, y: 44, h: 10 },
      { x: 240, w: 18, y: 44, h: 10 },
    ],
  },
  // Wide office, cornice band, two rooftop plant rooms
  {
    tone: 1,
    win: SHOPS,
    blocks: [
      { x: 270, w: 76, y: 0, h: 40 },
      { x: 266, w: 84, y: 40, h: 6 },
      { x: 284, w: 18, y: 46, h: 8 },
      { x: 318, w: 14, y: 46, h: 8 },
    ],
  },
  // Slim capped block closing the shoulder
  {
    tone: 3,
    win: SLIM,
    blocks: [
      { x: 356, w: 24, y: 0, h: 44 },
      { x: 360, w: 16, y: 44, h: 8 },
    ],
  },

  // --- Low centre band: keeps the benefit row in clear air ---------------
  // Long shopfront row with a cornice and a rooftop unit
  {
    tone: 1,
    win: SHOPS,
    blocks: [
      { x: 388, w: 104, y: 0, h: 24 },
      { x: 384, w: 110, y: 24, h: 6 },
      { x: 432, w: 22, y: 30, h: 4 },
    ],
  },
  // Two low blocks under the first benefit item
  {
    tone: 0,
    win: SHOPS,
    blocks: [
      { x: 501, w: 61, y: 0, h: 18 },
      { x: 498, w: 65, y: 18, h: 6 },
    ],
  },
  {
    tone: 3,
    win: DENSE,
    blocks: [
      { x: 570, w: 28, y: 0, h: 20 },
      { x: 567, w: 34, y: 20, h: 4 },
    ],
  },
  // Slim tower marking the gap between the first two items
  {
    tone: 2,
    win: SLIM,
    blocks: [
      { x: 604, w: 26, y: 0, h: 40 },
      { x: 608, w: 18, y: 40, h: 10 },
      { x: 612, w: 10, y: 50, h: 6 },
    ],
  },
  // Corniced low block
  {
    tone: 0,
    win: SLIM,
    blocks: [
      { x: 637, w: 23, y: 0, h: 28 },
      { x: 634, w: 29, y: 28, h: 6 },
    ],
  },
  // Long low row
  {
    tone: 1,
    win: SHOPS,
    blocks: [
      { x: 671, w: 65, y: 0, h: 18 },
      { x: 667, w: 73, y: 18, h: 6 },
    ],
  },
  // Small notched block
  {
    tone: 3,
    win: DENSE,
    blocks: [
      { x: 744, w: 30, y: 0, h: 18 },
      { x: 744, w: 12, y: 18, h: 6 },
      { x: 762, w: 12, y: 18, h: 6 },
    ],
  },
  // Narrow block before the second gap tower
  {
    tone: 1,
    win: SLIM,
    blocks: [
      { x: 781, w: 23, y: 0, h: 26 },
      { x: 778, w: 28, y: 26, h: 6 },
    ],
  },
  // Slim tower marking the gap between the second and third items
  {
    tone: 2,
    win: OFFICE,
    blocks: [
      { x: 810, w: 34, y: 0, h: 40 },
      { x: 815, w: 24, y: 40, h: 10 },
      { x: 820, w: 14, y: 50, h: 6 },
    ],
  },
  // Long low row under the third item
  {
    tone: 0,
    win: SHOPS,
    blocks: [
      { x: 851, w: 57, y: 0, h: 18 },
      { x: 848, w: 63, y: 18, h: 6 },
    ],
  },
  // Windowless service shaft
  { tone: 3, win: undefined, blocks: [{ x: 916, w: 17, y: 0, h: 24 }] },
  // Wide corniced block closing the band
  {
    tone: 1,
    win: OFFICE,
    blocks: [
      { x: 941, w: 61, y: 0, h: 26 },
      { x: 937, w: 69, y: 26, h: 6 },
    ],
  },
  // Crowned low block
  {
    tone: 2,
    win: DENSE,
    blocks: [
      { x: 1010, w: 30, y: 0, h: 28 },
      { x: 1015, w: 20, y: 28, h: 8 },
    ],
  },

  // --- Right shoulder: climbs again, different profile from the left ------
  {
    tone: 1,
    win: OFFICE,
    blocks: [
      { x: 1044, w: 72, y: 0, h: 44 },
      { x: 1050, w: 60, y: 44, h: 12 },
    ],
  },
  // Wide office with a cornice and a rooftop unit
  {
    tone: 3,
    win: SHOPS,
    blocks: [
      { x: 1128, w: 78, y: 0, h: 38 },
      { x: 1124, w: 86, y: 38, h: 6 },
      { x: 1144, w: 18, y: 44, h: 6 },
    ],
  },

  // --- Right edge ---------------------------------------------------------
  // Stepped office with a cornice and a rooftop unit
  {
    tone: 1,
    win: OFFICE,
    blocks: [
      { x: 1234, w: 54, y: 0, h: 76 },
      { x: 1230, w: 62, y: 76, h: 8 },
      { x: 1250, w: 18, y: 84, h: 12 },
    ],
  },
  // Tallest on the right: four setbacks, crown, spire
  {
    tone: 2,
    win: DENSE,
    blocks: [
      { x: 1296, w: 64, y: 0, h: 86 },
      { x: 1303, w: 50, y: 86, h: 26 },
      { x: 1310, w: 36, y: 112, h: 20 },
      { x: 1317, w: 22, y: 132, h: 12 },
      { x: 1326, w: 4, y: 144, h: 6 },
    ],
  },
  // Steps up toward the right edge
  {
    tone: 1,
    win: OFFICE,
    blocks: [
      { x: 1372, w: 64, y: 0, h: 56 },
      { x: 1368, w: 72, y: 56, h: 8 },
      { x: 1396, w: 44, y: 64, h: 14 },
    ],
  },
];

/* ---------------------------------------------------------------------------
   PATH BUILDING — all pure, deterministic, computed once at module load
--------------------------------------------------------------------------- */

const blockPath = (b: Block) =>
  `M${b.x} ${BASELINE - b.y - b.h}h${b.w}v${b.h}h${-b.w}z`;

/**
 * Lay one window grid inside a block, inset from its edges and centred.
 * Returns the window rectangles bucketed by tone: base, light accent, dark
 * accent. Small blocks (cornices, plant rooms, antennas) simply return null.
 */
function windowPaths(b: Block, w: Win, seed: number): [string, string, string] {
  const insetX = 5;
  const insetTop = 6;
  const insetBottom = 5;
  const innerW = b.w - insetX * 2;
  const innerH = b.h - insetTop - insetBottom;
  if (innerW < w.wx + 2 || innerH < w.wy + 2) return ["", "", ""];

  const cols = Math.max(1, Math.floor((innerW + (w.cw - w.wx)) / w.cw));
  const rows = Math.max(1, Math.floor((innerH + (w.ch - w.wy)) / w.ch));
  const usedW = cols * w.cw - (w.cw - w.wx);
  const usedH = rows * w.ch - (w.ch - w.wy);
  if (usedW > innerW || usedH > innerH) return ["", "", ""];

  const x0 = b.x + insetX + Math.floor((innerW - usedW) / 2);
  const y0 =
    BASELINE - b.y - b.h + insetTop + Math.floor((innerH - usedH) / 2);

  const tones: [string, string, string] = ["", "", ""];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * w.cw;
      const y = y0 + r * w.ch;
      const k = (c * 3 + r * 5 + seed) % 17;
      const i = k === 0 ? 1 : k === 7 ? 2 : 0;
      tones[i] += `M${x} ${y}h${w.wx}v${w.wy}h${-w.wx}z`;
    }
  }
  return tones;
}

/** Silhouette + window paths for one building, resolved once at module load. */
function buildPaths(bld: Building, index: number) {
  const silhouette = bld.blocks.map(blockPath).join("");
  const tones: [string, string, string] = ["", "", ""];

  if (bld.win) {
    bld.blocks.forEach((block, j) => {
      const [base, light, dark] = windowPaths(block, bld.win!, index * 7 + j);
      tones[0] += base;
      tones[1] += light;
      tones[2] += dark;
    });
  }

  return { silhouette, windows: tones };
}

const SKYLINE_PARTS = BUILDINGS.map(buildPaths);

type SignalKind = "msg" | "up" | "doc" | "dot" | "node";

type Signal = {
  k: SignalKind;
  left: string;
  bottom: string;
  dur: number;
  delay: number;
  dx: number;
  dy: number;
  size: number;
  op: number;
  show?: string;
};

/**
 * Signals are anchored low in the hero and concentrated near the outer edges.
 * `show` hides the optional ones on smaller viewports, thinning the density
 * from 11 elements on desktop to 8 on tablet and 5 on mobile.
 */
const SIGNALS: Signal[] = [
  // Always visible
  { k: "msg", left: "5%", bottom: "20%", dur: 9, delay: -1.2, dx: 14, dy: -118, size: 16, op: 0.17 },
  { k: "dot", left: "17%", bottom: "15%", dur: 7.5, delay: -4.5, dx: -10, dy: -92, size: 6, op: 0.2 },
  { k: "up", left: "84%", bottom: "22%", dur: 10, delay: -2.6, dx: -12, dy: -136, size: 16, op: 0.16 },
  { k: "doc", left: "93%", bottom: "17%", dur: 8, delay: -6.2, dx: 8, dy: -102, size: 14, op: 0.15 },
  { k: "node", left: "74%", bottom: "27%", dur: 11, delay: -3.4, dx: 10, dy: -146, size: 10, op: 0.2 },
  // Tablet and up
  { k: "up", left: "11%", bottom: "27%", dur: 10.5, delay: -7.4, dx: -14, dy: -140, size: 15, op: 0.16, show: "hidden sm:block" },
  { k: "msg", left: "88%", bottom: "30%", dur: 9.5, delay: -0.6, dx: -9, dy: -126, size: 15, op: 0.15, show: "hidden sm:block" },
  { k: "dot", left: "26%", bottom: "24%", dur: 12, delay: -5.5, dx: 12, dy: -150, size: 5, op: 0.22, show: "hidden sm:block" },
  // Desktop only
  { k: "doc", left: "31%", bottom: "19%", dur: 8.5, delay: -9, dx: -8, dy: -112, size: 13, op: 0.14, show: "hidden md:block" },
  { k: "msg", left: "69%", bottom: "21%", dur: 11.5, delay: -2.2, dx: 12, dy: -132, size: 14, op: 0.14, show: "hidden md:block" },
  { k: "dot", left: "62%", bottom: "16%", dur: 7, delay: -10, dx: -10, dy: -86, size: 6, op: 0.2, show: "hidden md:block" },
];

function signalShape(kind: SignalKind, size: number) {
  switch (kind) {
    case "msg":
      return <MessageSquare size={size} strokeWidth={2} />;
    case "up":
      return <ThumbsUp size={size} strokeWidth={2} />;
    case "doc":
      return <FileText size={size} strokeWidth={2} />;
    case "node":
      return (
        <span
          className="block border-[1.5px] border-blue-500/70 dark:border-blue-400/60"
          style={{ width: size, height: size }}
        />
      );
    case "dot":
    default:
      return (
        <span
          className="block rounded-full bg-blue-500/80 dark:bg-blue-400/70"
          style={{ width: size, height: size }}
        />
      );
  }
}

export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
    >
      {/* Pixel-art skyline. Proportional scaling keeps it short on mobile;
          `preserveAspectRatio` + `max-h` crop only the already-faded top on
          very wide screens, so the skyline never outgrows the hero. */}
      <svg
        viewBox={`0 0 ${SKYLINE_W} ${SKYLINE_H}`}
        preserveAspectRatio="xMidYMax slice"
        className="hero-skyline absolute inset-x-0 bottom-0 h-auto max-h-[160px] w-full"
        aria-hidden="true"
        focusable="false"
      >
        {SKYLINE_PARTS.map((part, i) => (
          <g key={i}>
            <path d={part.silhouette} className={FACADES[BUILDINGS[i].tone]} />
            {part.windows[0] && (
              <path d={part.windows[0]} className={WIN_BASE} />
            )}
            {part.windows[1] && (
              <path d={part.windows[1]} className={WIN_LIGHT} />
            )}
            {part.windows[2] && (
              <path d={part.windows[2]} className={WIN_DARK} />
            )}
          </g>
        ))}
      </svg>

      {/* Floating feedback signals */}
      {SIGNALS.map((s) => {
        const style = {
          left: s.left,
          bottom: s.bottom,
          opacity: s.op,
          animation: `heroSignal ${s.dur}s linear ${s.delay}s infinite`,
          ["--signal-dx" as string]: `${s.dx}px`,
          ["--signal-dy" as string]: `${s.dy}px`,
          ["--signal-op" as string]: String(s.op),
        } as React.CSSProperties;

        return (
          <span
            key={`${s.k}-${s.left}`}
            className={cn("absolute block", s.show)}
            style={style}
          >
            {signalShape(s.k, s.size)}
          </span>
        );
      })}
    </div>
  );
}
