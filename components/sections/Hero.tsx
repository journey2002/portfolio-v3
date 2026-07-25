"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  Reorder,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Eye,
  Frame as FrameIcon,
  GripVertical,
  Hand,
  Image as ImageIcon,
  Lock,
  MessageSquareDashed,
  Minus,
  MousePointer2,
  PenTool,
  Plus,
  RotateCcw,
  Type as TypeIcon,
} from "lucide-react";
import { Balancer } from "react-wrap-balancer";
import MagneticButton from "@/components/ui/MagneticButton";
import MouseParallax from "@/components/ui/MouseParallax";
import AccentSwitcher from "@/components/ui/AccentSwitcher";
import { useAccent, ACCENT_PRIMARY } from "@/components/ui/AccentProvider";
import SplitText from "@/components/ui/SplitText";
import DotGrid from "@/components/ui/DotGrid";
import { useIntro } from "@/components/ui/IntroProvider";
import { usePointer } from "@/components/ui/PointerProvider";
import { useMarqueeSlowOnHover } from "@/components/ui/useMarqueeSlowOnHover";

const EASE = [0.16, 1, 0.3, 1] as const;

// Smallest / largest font scale any resize handle can reach (--hs bounds).
const SCALE_MIN = 0.4;
const SCALE_MAX = 1.5;

// Widest the artboard frame can be dragged (px). The default is a narrower,
// centred artboard (≈64rem, set on --fw below); dragging a corner expands it out
// to this max, which still leaves gutters for the layers + inspector panels.
const FRAME_MAX_W = 1376;

// Narrowest the frame can be dragged (px). Below ~56rem two things fall apart:
// the content column collapses (the actions grid wraps word-by-word once the
// xl padding eats the width), and the frame edge retreats past the artwork
// cards tucked under it — chair's right edge sits 28rem from centre, so a
// narrower frame slices the cards mid-body with the glass seam and leaves the
// corner handles floating on top of them.
const FRAME_MIN_W = 896;

const MARQUEE_TAGS = [
  "UX/UI Designer",
  "Digital Artist",
  "Based in Thailand",
  "TNI Graduate",
  "Taking New Projects",
];

// The artboard's reorderable "layers". Each id maps to a real block of the hero
// content (rendered in `layerOrder` sequence) so dragging a row in the panel
// physically restacks the matching block — e.g. dragging `statement` to the top
// lifts the "Designing experiences." headline above everything else. `canvas.bg`
// is the locked background and lives outside the order (always bottom-most).
type LayerId = "presence" | "statement" | "actions";

const LAYER_META: Record<LayerId, { type: string; label: string }> = {
  presence: { type: "◇", label: "presence" },
  statement: { type: "T", label: "statement" },
  actions: { type: "◇", label: "actions" },
};

const DEFAULT_LAYER_ORDER: LayerId[] = ["presence", "statement", "actions"];

// Copies of the tag set inside each of the marquee's two halves. The strip is a
// single animated element holding two identical halves and sliding -50%, so the
// wrap is pixel-seamless; each half must be wide enough to cover the container,
// hence three copies. Speed is held constant by scaling the duration to match.
const MARQUEE_REPEAT = 3;

// 8 selection handles (4 corners + 4 edge midpoints) with their resize cursors
// and the behaviour each one drives:
//   • "h"      edge left/right  → resize the box WIDTH (text re-wraps, font fixed)
//   • "v"      edge top/bottom  → resize the box HEIGHT via leading (font fixed)
//   • "corner" four corners     → scale the box AND the text together
const RESIZE_HANDLES = [
  { x: 0, y: 0, cursor: "nwse-resize", role: "corner" },
  { x: 50, y: 0, cursor: "ns-resize", role: "v" },
  { x: 100, y: 0, cursor: "nesw-resize", role: "corner" },
  { x: 100, y: 50, cursor: "ew-resize", role: "h" },
  { x: 100, y: 100, cursor: "nwse-resize", role: "corner" },
  { x: 50, y: 100, cursor: "ns-resize", role: "v" },
  { x: 0, y: 100, cursor: "nesw-resize", role: "corner" },
  { x: 0, y: 50, cursor: "ew-resize", role: "h" },
] as const;

type HandleRole = (typeof RESIZE_HANDLES)[number]["role"];

// The 4 corners of the big "Frame 01" artboard. Dragging one resizes the whole
// frame in 2D (width via --fw, height via --fh), so the big box is expandable
// in its own right — not just responsive to the headline inside it.
const FRAME_CORNERS = [
  { x: 0, y: 0, cursor: "nwse-resize" },
  { x: 100, y: 0, cursor: "nesw-resize" },
  { x: 100, y: 100, cursor: "nwse-resize" },
  { x: 0, y: 100, cursor: "nesw-resize" },
] as const;

// The custom cursor hides the OS pointer on these handles (they carry
// `data-cursor`) and instead draws its own resize glyph, swivelled to the axis
// the handle resizes along. This maps the old OS cursor name → that rotation.
const RESIZE_ANGLE: Record<string, number> = {
  "ew-resize": 0,
  "ns-resize": 90,
  "nwse-resize": 45,
  "nesw-resize": -45,
};

// Floating artwork "reference" cards TUCKED UNDER the artboard's side edges —
// like prints slipped under a sheet of paper on the desk. Each renders a vivid
// PLACEHOLDER for now; drop a real file path into `src` to swap it in (object-cover
// keeps the 3:4 crop, no other change needed). Positions are anchored to the
// ARTBOARD: the 64rem frame's edge sits at 32rem from centre, so e.g.
// `calc(50% - 36rem)` with a 10rem card leaves ~60% of it hidden beneath the
// frame's frosted glass (panel-weak + backdrop-blur) and ~40% peeking out; the
// `max(…)` floor keeps a slice on-screen below ~1200px. Hovering the artboard
// "opens the folder": every card springs OUT along its `pop` vector — an X-fan
// toward the four open viewport corners, aimed to clear the side panels and
// status bar so they land in empty canvas, not back under the UI (see
// GalleryCard + the note on `pop`). Colours are
// deliberately NOT the site accent — the art is meant to be its own burst of
// colour against the mono canvas, so it stays vivid whatever accent the
// visitor picks.
type GalleryItem = {
  id: string;
  /** Real artwork path later (e.g. "/art/idol.png"); undefined → colour placeholder. */
  src?: string;
  /** Filename-style chip — reads as a pinned asset in the design tool. */
  label: string;
  /** Placeholder duotone: gradient start → end, plus a soft top-light bloom. */
  from: string;
  to: string;
  glow: string;
  /**
   * Absolute position + responsive width (rotation is applied separately).
   * Rendered inside a md+ wrapper: the base tier is the TABLET anchor
   * (768-1023, fully on-canvas), the lg: tier the original desktop anchor
   * (edge-clamped `max(…)` floors that tuck under the frame).
   */
  className: string;
  /**
   * Phone-only mini variant (position + width) for the `md:hidden` wrapper —
   * omit to keep the card off phones entirely.
   */
  mobileClassName?: string;
  /**
   * Extra classes layered on ONLY when the side panels are actually rendered
   * (enabled && xl). Used by chair to pull its right anchor back off the
   * Inspector; a plain `xl:` in `className` can't express this because the
   * panels also depend on `enabled`, not width alone.
   */
  panelClassName?: string;
  rotate: number;
  /** Mouse-parallax travel — larger = nearer/faster, for depth layering. */
  strength: number;
  /** Entrance stagger (s). */
  delay: number;
  /**
   * Float-bob phase (s), NEGATIVE so the card starts mid-cycle instead of
   * sitting still until its first frame comes round. Spread across the 5s
   * keyframe so the four never rise and fall together.
   */
  floatDelay: number;
  /**
   * Slide (px) + swivel (deg) when the artboard is hovered. Each vector aims its
   * card at the nearest OPEN viewport corner — clear of the Layers/Inspector
   * panels (mid-height gutters) and the status bar (bottom) — so the fan-out
   * reveals into empty canvas instead of sliding back under the UI chrome.
   */
  pop: { x: number; y: number; rotate: number };
  /**
   * Pop stagger (s) — the cards uncover ONE BY ONE (1→2→3→4), not as a slab.
   * The tuck-back runs this in reverse (see POP_DELAY_MAX).
   */
  popDelay: number;
  /** Filename-chip corner — must sit on the card's VISIBLE (outer) half. */
  chipClass: string;
  /**
   * CSS `transform-origin` (e.g. "69% 73%") pointing at a subject inside the
   * image. When set, hovering the card slowly pushes `scale` in on that
   * point — a punch-in rather than a static crop. Omit for cards that should
   * just sit still.
   */
  zoomOrigin?: string;
  /** Hover zoom amount (CSS scale). Only used alongside `zoomOrigin`. */
  zoomScale?: number;
};

const GALLERY: GalleryItem[] = [
  {
    id: "idol",
    src: "/assets/posters/tube_ball_bounce.jpg",
    label: "tube_ball_bounce.mp4",
    from: "#38bdf8",
    to: "#4f46e5",
    glow: "rgba(255,255,255,0.55)",
    // top-20% (not 24%) levels this card's top edge with muse's on the opposite
    // side — they're the upper pair, so a 4% stagger just read as one of them
    // having slipped. It stays the taller card, so its lower edge still hangs
    // below muse's and the pair keeps its asymmetry without looking dropped.
    className:
      "left-3 top-[20%] w-24 lg:left-[max(-2rem,calc(50%_-_36rem))] lg:w-32 xl:w-40",
    // Phone minis: only the width — layout comes from the shelf wrapper's
    // centered flex row (see the phone-minis wrapper in the hero JSX).
    // Piled/scattered/edge-tucked absolute anchors were all tried and read as
    // clipping bugs or dropped stickers; a symmetric docked row is the one
    // arrangement that reads deliberate without the artboard frame.
    mobileClassName: "w-20",
    rotate: -8,
    strength: 30,
    delay: 0.3,
    floatDelay: -0.4,
    // Fans to the open top-LEFT corner — up-and-out, clearing the Layers panel
    // that sits mid-height in this gutter (the old x:-104,y:-8 slid it under it).
    pop: { x: -92, y: -56, rotate: -8 },
    popDelay: 0,
    chipClass: "bottom-2 left-2",
  },
  {
    id: "donut",
    src: "/assets/donut.png",
    label: "donut.png",
    from: "#fbcfe8",
    to: "#fb7185",
    glow: "rgba(255,255,255,0.6)",
    // Anchored to the centre (50% + offset), not bottom-%: the frame's height is
    // fixed and vertically centred, so a viewport-% anchor descends faster than
    // the frame's underside and slides the card out from under it on tall windows.
    // The +9.5rem drop levels it with chair on the opposite side so the two read
    // as a matched bottom pair, while still clearing the status bar at normal
    // window heights.
    className:
      "left-4 top-[calc(50%_+_8rem)] w-20 lg:left-[max(-1.5rem,calc(50%_-_34.5rem))] lg:top-[calc(50%_+_9.5rem)] lg:w-24 xl:w-28",
    // Middle of the shelf — one step larger, so the row reads as a featured
    // asset flanked by two supports rather than three identical tiles.
    mobileClassName: "w-24",
    rotate: 7,
    strength: 46,
    delay: 0.46,
    floatDelay: -3.1,
    // Fans to the open bottom-LEFT corner. This card is the most buried at rest
    // (fully under the frame on a 1280 canvas), so it travels the furthest —
    // dropping clear BELOW the Layers panel rather than sliding under it.
    pop: { x: -70, y: 94, rotate: 9 },
    popDelay: 0.11,
    chipClass: "bottom-2 left-2",
  },
  {
    id: "muse",
    src: "/assets/0047.jpg",
    label: "0047.jpg",
    from: "#e879f9",
    to: "#7c3aed",
    glow: "rgba(255,255,255,0.5)",
    className:
      "right-3 top-[20%] w-24 lg:right-[max(-2rem,calc(50%_-_35.5rem))] lg:w-28 xl:w-36",
    mobileClassName: "w-20",
    rotate: 9,
    strength: 34,
    delay: 0.38,
    floatDelay: -1.7,
    // Fans to the open top-RIGHT corner — lifts well above the Inspector panel
    // (which owns the mid-height of this gutter) so it never tucks behind it.
    pop: { x: 92, y: -56, rotate: 7 },
    popDelay: 0.22,
    chipClass: "bottom-2 right-2",
  },
  {
    id: "chair",
    src: "/assets/chair.png",
    label: "chair.png",
    from: "#fcd34d",
    to: "#6b7280",
    glow: "rgba(255,255,255,0.45)",
    // The exact mirror of donut, so the two read as a matched bottom pair:
    // same size, same 9.5rem drop below centre, same anchor magnitude flipped to
    // the right edge. Earlier this was a BIGGER card (w-36) held higher (8rem)
    // with a panel-only pull-back to dodge the Inspector — but the bulk kept it
    // veiled inside the frame on hover (the "mostly inside" bug). donut proves
    // the smaller/lower geometry fans cleanly out on either side: at rest it
    // tucks under the frame edge (and, like donut under the Layers panel, partly
    // behind the Inspector at narrow widths — the intended "reference tucked
    // under a panel" look); no width-specific pull-back needed.
    className:
      "right-4 top-[calc(50%_+_8rem)] w-20 lg:right-[max(-1.5rem,calc(50%_-_34.5rem))] lg:top-[calc(50%_+_9.5rem)] lg:w-24 xl:w-28",
    rotate: -7,
    strength: 24,
    delay: 0.54,
    floatDelay: -4.2,
    // Fans to the open bottom-RIGHT corner — donut's bottom-left vector flipped.
    // The mostly-diagonal drop clears the frame's right edge AND drops the card
    // BELOW the Inspector's lower corner (the smaller card now fits under it,
    // where the old w-36 couldn't), its tail tucking behind the bottom status
    // bar exactly as donut's does — an intentional edge tuck, not the awkward
    // mid-canvas hide the old near-vertical vector produced.
    pop: { x: 70, y: 94, rotate: -9 },
    popDelay: 0.33,
    chipClass: "bottom-2 right-2",
  },
];

// Longest pop stagger in the set — the pivot that mirrors the sequence for the
// tuck-back, so `MAX - popDelay` turns the fan-out order inside out (last card
// out is the first back under the glass) without hand-maintaining a second list.
const POP_DELAY_MAX = Math.max(...GALLERY.map((item) => item.popDelay));

/**
 * Hero, staged as a live design canvas instead of a conventional headline block.
 *
 * The intro copy sits inside a selected "artboard" frame — complete with a frame
 * tab, rulers, corner handles, a layers panel, an inspector reading the live
 * cursor coordinates, a parked collaborator cursor, and an app-style status bar.
 * The palette, aurora, grain and SplitText reveals are unchanged; only the
 * composition is rethought so it reads as a designer's workspace rather than a
 * generic hero. Name appears only as small workspace chrome, never as the focus.
 */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const pointer = usePointer();
  const enabled = !!pointer?.enabled;

  // Every entrance below animates only once `introDone` flips — on a first
  // visit that's the moment the intro's selection box starts opening, so the
  // hero rises while the overlay is still parting instead of playing unseen
  // behind it. When the intro is skipped it's true from mount (unchanged
  // behavior). Elements mirror their `initial` pose until released.
  const { introDone } = useIntro();

  // The headline is a resizable "text box". Its handles behave like a design
  // tool's: edge handles change the BOX (width → wrap reflow, or vertical leading)
  // at a fixed font size; corner handles scale the box AND the text together. The
  // outer "Frame 01" artboard tracks the box width so the big frame stays
  // responsive to the small text box inside it. Everything runs through CSS vars
  // set imperatively — --bw (box width), --lh (leading), --hs (font scale) on the
  // box and --fw (frame width) on the wrapper — so React never re-renders mid-drag.
  const headlineRef = useRef<HTMLDivElement>(null);
  const frameWrapRef = useRef<HTMLDivElement>(null);
  const frameBodyRef = useRef<HTMLDivElement>(null);

  const startResize = (e: React.PointerEvent, role: HandleRole) => {
    if (!enabled || !headlineRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const box = headlineRef.current;
    const frame = frameWrapRef.current;
    const rect = box.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Seed every start value from the rendered state so a drag never jumps.
    const startBW = rect.width;
    const startFW = frame ? frame.getBoundingClientRect().width : startBW;
    const gutter = startFW - startBW; // frame keeps this margin around the box
    const cs = getComputedStyle(box);
    const startHS = parseFloat(cs.getPropertyValue("--hs")) || 1;
    const startLH = parseFloat(cs.getPropertyValue("--lh")) || 0.94;

    // Longest-word width at the current font — the floor for the box so a single
    // word can never clip. Measured by briefly forcing the box to min-content.
    const prevWidth = box.style.width;
    box.style.width = "min-content";
    const minBW = box.getBoundingClientRect().width;
    box.style.width = prevWidth;

    // Signed offsets from centre — NOT absolute. The signed ratio keeps a resize
    // monotonic: dragging a handle inward shrinks the box smoothly to its floor
    // instead of flipping back to growth once the pointer crosses the centre.
    const startDX = e.clientX - cx || 1;
    const startDY = e.clientY - cy || 1;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const maxFW = Math.min(window.innerWidth - 48, FRAME_MAX_W); // cap to artboard max
    // Frame floor while it follows the box. `startFW` guards small viewports:
    // if the frame already sits below FRAME_MIN_W there, clamping to the bigger
    // number would snap it wider the moment a handle is grabbed.
    const minFW = Math.min(maxFW, startFW, FRAME_MIN_W);

    // Grow the box width and carry the frame along by the same delta (constant
    // gutter), clamped to the viewport and floored at the longest word. The box
    // may keep shrinking below the frame's floor — the frame just stops
    // following, so the text stays freely scalable without dragging the
    // artboard into the card-slicing zone (see FRAME_MIN_W).
    const applyWidth = (bw: number, floor: number) => {
      let fw = bw + gutter;
      if (fw > maxFW) {
        fw = maxFW;
        bw = fw - gutter;
      }
      if (bw < floor) {
        bw = floor;
        fw = bw + gutter;
      }
      fw = Math.min(maxFW, Math.max(fw, minFW));
      box.style.setProperty("--bw", `${bw.toFixed(1)}px`);
      frame?.style.setProperty("--fw", `${fw.toFixed(1)}px`);
    };

    const onMove = (ev: PointerEvent) => {
      if (role === "h") {
        // Edge L/R → box width. Above the longest word the headline just
        // re-wraps at a fixed font. Below it (a lone word can't wrap), the font
        // scales DOWN to fit so the box can keep shrinking instead of hitting a
        // wall — the only way a single word can "go lower".
        const r = (ev.clientX - cx) / startDX;
        let bw = startBW * r;
        const baseMin = minBW / startHS; // longest-word width at scale 1
        let hs = Math.min(startHS, bw / baseMin); // fill up to base, never above
        if (hs < SCALE_MIN) hs = SCALE_MIN;
        bw = Math.max(bw, baseMin * hs); // never let the word clip
        box.style.setProperty("--hs", hs.toFixed(3));
        applyWidth(bw, baseMin * hs);
      } else if (role === "v") {
        // Edge T/B → vertical leading only. The box grows taller, glyphs don't.
        const r = (ev.clientY - cy) / startDY;
        const lh = Math.max(0.85, Math.min(1.6, startLH * r));
        box.style.setProperty("--lh", lh.toFixed(3));
      } else {
        // Corner → scale text AND box together, preserving the wrap pattern.
        const r = Math.hypot(ev.clientX - cx, ev.clientY - cy) / startDist;
        const hs = Math.max(SCALE_MIN, Math.min(SCALE_MAX, startHS * r));
        const k = hs / startHS;
        box.style.setProperty("--hs", hs.toFixed(3));
        applyWidth(startBW * k, minBW * k);
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // A cancelled gesture (touch interruption, browser takeover) never fires
    // pointerup, so without this the move listener outlives the drag.
    window.addEventListener("pointercancel", onUp);
  };

  // The big "Frame 01" artboard is itself resizable: dragging a frame corner
  // scales its width (--fw) and height (--fh) from the centre, floored so it can
  // never shrink below the content it holds. Same signed-ratio model as above.
  const startFrameResize = (e: React.PointerEvent, hx: number, hy: number) => {
    if (!enabled || !frameWrapRef.current || !frameBodyRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const wrap = frameWrapRef.current;
    const body = frameBodyRef.current;
    const rect = body.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startW = rect.width;
    const startH = rect.height;

    // Floors: the frame can't go narrower than FRAME_MIN_W — or the headline
    // (+ breathing room) if that box has been scaled up past it — nor shorter
    // than its natural content height (measured with --fh removed). On
    // viewports too small for the floor, the current width IS the floor, so
    // grabbing a corner never snaps the frame wider than it already is.
    const maxW = Math.min(window.innerWidth - 48, FRAME_MAX_W);
    const minW = Math.min(
      maxW,
      startW,
      Math.max(
        FRAME_MIN_W,
        (headlineRef.current?.getBoundingClientRect().width ?? 264) + 96,
      ),
    );
    const prevMinH = body.style.minHeight;
    body.style.minHeight = "0px";
    const minH = body.getBoundingClientRect().height;
    body.style.minHeight = prevMinH;

    const startDX = e.clientX - cx || 1;
    const startDY = e.clientY - cy || 1;
    // Height cap leaves room for the ruler + frame tab above and the status
    // bar below — at the old viewport-40 cap the frame's bottom edge (and its
    // corner handles) buried themselves in the status bar.
    const maxH = Math.max(minH, window.innerHeight - 140);
    // A corner only drives the axes it actually sits on (hx/hy are 0 or 100,
    // 50 would mean "centred" → that axis is left alone). Corners use both.
    const liveW = hx !== 50;
    const liveH = hy !== 50;

    const onMove = (ev: PointerEvent) => {
      if (liveW) {
        const w = Math.max(
          minW,
          Math.min(maxW, startW * ((ev.clientX - cx) / startDX)),
        );
        wrap.style.setProperty("--fw", `${w.toFixed(1)}px`);
      }
      if (liveH) {
        const h = Math.max(
          minH,
          Math.min(maxH, startH * ((ev.clientY - cy) / startDY)),
        );
        body.style.setProperty("--fh", `${h.toFixed(1)}px`);
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // A cancelled gesture (touch interruption, browser takeover) never fires
    // pointerup, so without this the move listener outlives the drag.
    window.addEventListener("pointercancel", onUp);
  };

  // Hero exits as you scroll — UI chrome fades, the frame content lifts, the
  // background scales up like a canvas being zoomed past.
  //
  // Progress (0 → 1 across the hero's scroll-out) is read LIVE from the section's
  // own getBoundingClientRect every scroll frame, NOT from framer's `useScroll`.
  // useScroll caches the target's measured height on mount, and here that cache
  // reads stale (font + SplitText reflow, the resizable frame, the lazy sections
  // below) — leaving progress short of 1 at the true bottom. The status bar lives
  // at the section's very bottom edge, so it's the last thing to leave; any
  // shortfall stranded it on-screen at full opacity. A live rect read can't go
  // stale: `-top / height` is the exact scroll-out fraction on every frame.
  const heroProgress = useMotionValue(0);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let raf = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const p = rect.height > 0 ? -rect.top / rect.height : 0;
      heroProgress.set(Math.min(1, Math.max(0, p)));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [heroProgress]);

  // Centred layers — the framed content + the side panels — fade in place on a
  // gentle curve, fully gone by 90% of the hero's scroll-out.
  const exitOpacity = useTransform(heroProgress, [0, 0.9], [1, 0]);
  // Bottom-anchored chrome (status bar + scroll cue) sweeps the full height of the
  // viewport as the last thing to leave, so it fades earlier — fully clear by 70%,
  // before it reaches the upper viewport — so it can never ghost back in near the
  // end. Close enough to the content's curve to still read as a parallel exit.
  const chromeOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  // The scroll cue is a real link; once its chrome has faded it must also stop
  // being clickable/focusable, so visibility tracks the same curve.
  const cueVisibility = useTransform(chromeOpacity, (o) =>
    o < 0.02 ? "hidden" : "visible",
  );
  const contentY = useTransform(heroProgress, [0, 1], [0, -110]);
  const auroraScale = useTransform(heroProgress, [0, 1], [1, 1.4]);
  const auroraY = useTransform(heroProgress, [0, 1], [0, 160]);
  const gridY = useTransform(heroProgress, [0, 1], [0, 80]);

  const marqueeHoverRef = useMarqueeSlowOnHover<HTMLDivElement>();

  // Live layer order, shared by the layers panel (drag to reorder) and the frame
  // content (rendered in this sequence). Reordering one reorders the other.
  const [layerOrder, setLayerOrder] = useState<LayerId[]>(DEFAULT_LAYER_ORDER);
  const [selectedLayer, setSelectedLayer] = useState<LayerId>("statement");

  // Hovering the artboard "opens the folder": the artwork cards tucked under
  // its edges spring outward (see GalleryCard). framer's hover events only
  // fire for real pointers, so touch devices simply keep the resting tuck.
  const [frameHover, setFrameHover] = useState(false);

  // Back to the shipped layout: clear every drag-set CSS var (text box width /
  // scale / leading, frame width / height — removal falls back to the defaults
  // in the style attributes) and restore the layer stack. Lives here because
  // the vars are owned by this component's refs; the Layers panel just calls it.
  const resetPlayground = () => {
    const box = headlineRef.current;
    if (box) {
      box.style.removeProperty("--bw");
      box.style.removeProperty("--hs");
      box.style.removeProperty("--lh");
    }
    frameWrapRef.current?.style.removeProperty("--fw");
    frameBodyRef.current?.style.removeProperty("--fh");
    setLayerOrder(DEFAULT_LAYER_ORDER);
    setSelectedLayer("statement");
  };

  // The hero content blocks, keyed by layer id. Rendered through `layerOrder`
  // below so the panel's drag-to-reorder physically restacks them, with a
  // `layout` transition animating each block to its new slot.
  const blocks: Record<LayerId, React.ReactNode> = {
    presence: (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        className="flex flex-wrap items-center gap-3"
      >
        <span className="inline-flex items-center rounded-full border border-hairline bg-glass px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-muted backdrop-blur">
          Taking new projects
        </span>
        <span className="hidden text-[10px] uppercase tracking-[0.28em] text-ink-faint sm:inline">
          UX/UI &amp; Digital Art
        </span>
      </motion.div>
    ),
    statement: (
      // Headline = a resizable "text box". The words FLOW (not forced onto
      // separate lines) inside a width of var(--bw): the default `min-content`
      // keeps the longest word per line — i.e. the current two-line look — while
      // dragging an edge handle re-wraps them. Size (--hs) and leading (--lh)
      // ride the same container.
      <div
        ref={headlineRef}
        className="relative inline-block select-none"
        style={{
          // Sized against BOTH axes. The `8.5vw` term alone passes the 6rem
          // ceiling at ~1129px wide, so from there to 2560px the headline was a
          // flat 96px — the hero stopped responding to anything on every
          // desktop. `min(…, 10vh)` re-couples it to the axis that actually
          // varies between a 2K monitor and a laptop: on a 1300px-tall viewport
          // the vh term lands past the cap (unchanged 96px), on a ~720px laptop
          // it takes over at ~72px. vw still wins on phones/tablets, so those
          // tiers are untouched.
          fontSize: "calc(clamp(2.75rem, min(8.5vw, 10vh), 6rem) * var(--hs,1))",
          width: "var(--bw, min-content)",
          lineHeight: "var(--lh, 0.94)",
        }}
      >
        <h1 className="font-serif font-bold tracking-tight text-ink-strong">
          <SplitText
            text="Designing"
            as="span"
            active={introDone}
            delay={0.55}
            stagger={0.035}
            fromY={90}
            fromRotate={5}
          />{" "}
          <span className="inline-flex items-end">
            <SplitText
              text="experiences."
              as="span"
              className="pb-2"
              charClassName="bg-accent-gradient bg-clip-text text-transparent"
              active={introDone}
              delay={0.9}
              stagger={0.03}
              fromY={90}
              fromRotate={-4}
            />
            {/* Blinking text-insertion caret — scales with the text (em) */}
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              animate={introDone ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1.5 }}
              className="animate-caret-blink mb-[0.3em] ml-1 h-[0.72em] w-[3px] rounded-full bg-accent-gradient sm:w-1"
            />
          </span>
        </h1>

        {/* Selection bounding box + draggable resize handles (desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={
            introDone ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.02 }
          }
          transition={{ duration: 0.6, delay: 1.25, ease: EASE }}
          className="pointer-events-none absolute -inset-x-3 -inset-y-2 hidden md:block"
        >
          <span className="absolute inset-0 rounded-[2px] ring-1 ring-indigo-accent/55" />
          {/* Handles only exist for a fine pointer — on touch devices the drag
              handlers are inert (startResize bails on !enabled), so rendering
              them would just be dead controls. The ring stays: it's the
              design-canvas dressing, not an affordance. */}
          {enabled && RESIZE_HANDLES.map((h) => (
            <span
              key={`${h.x}-${h.y}`}
              onPointerDown={(e) => startResize(e, h.role)}
              data-cursor="resize"
              data-cursor-angle={RESIZE_ANGLE[h.cursor]}
              // 24px hit area around an 8px dot so the small handles are
              // easy to grab; the dot grows on hover to read as draggable.
              // No `cursor` here — it inherits `cursor: none` so the custom
              // resize glyph (driven by data-cursor) stands in for the OS one.
              className="pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center [&:hover>span]:scale-150"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              <span className="h-2 w-2 rounded-[1px] border border-indigo-accent bg-night transition-transform duration-150" />
            </span>
          ))}
        </motion.div>
      </div>
    ),
    actions: (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
        transition={{ duration: 0.9, delay: 1.45, ease: EASE }}
        className="grid grid-cols-1 items-end gap-8 sm:grid-cols-12 sm:gap-6"
      >
        <p className="text-base text-ink-muted sm:col-span-6 sm:text-lg">
          <Balancer>
            UX/UI designer and digital artist based in Bangkok. I care about
            how things work, then build{" "}
            <span className="text-ink">interfaces that get used, not just admired</span>.
          </Balancer>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:col-span-6 sm:justify-end">
          <MagneticButton
            href="#work"
            glow
            className="px-7 py-3.5 text-sm font-semibold text-white"
          >
            View my work
            {/* Down, not the site-wide up-right: this is an in-page scroll to
                #work, so ↓ is literally what happens — and it leaves ↗ meaning
                "go somewhere" everywhere else. Exits downward rather than
                spinning away, so the gesture keeps pointing the same way out. */}
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <ArrowDown
                className="absolute h-4 w-4 transition-all duration-300 group-hover:translate-y-1 group-hover:scale-50 group-hover:opacity-0"
                strokeWidth={2}
              />
              <Eye
                className="absolute h-4 w-4 scale-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                strokeWidth={2}
              />
            </span>
          </MagneticButton>
          <a
            href="#contact"
            className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink-strong"
          >
            Get in touch
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </a>
        </div>
      </motion.div>
    ),
  };

  return (
    <section
      id="top"
      ref={sectionRef}
      // Full-viewport at every width. svh, not dvh: dvh resizes live when the
      // iOS URL bar collapses, which would jolt the per-frame heroProgress read
      // (-rect.top / rect.height) mid-scroll. The asymmetric mobile padding
      // (pb much heavier than pt) lifts the flex-centred text block well above
      // viewport centre — the void under the nav pill reads worse than one
      // above the asset shelf, which fills the freed bottom band.
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-6 pb-48 pt-24 sm:px-10 md:py-[clamp(1.5rem,6vh,4rem)]"
    >
      {/* ── Background: dot grid (cursor glow + repel), aurora, accents, dust ──── */}
      <motion.div style={{ y: gridY }} className="absolute inset-0">
        <MouseParallax strength={16} className="absolute inset-0">
          <DotGrid className="-inset-16" size={620} gridSize={80} />
        </MouseParallax>
      </motion.div>

      <motion.div
        aria-hidden
        style={{ y: auroraY, scale: auroraScale }}
        className="pointer-events-none absolute inset-0"
      >
        <MouseParallax strength={42} className="absolute inset-0">
          {/* No blur filter: `--aurora`'s 8-stop gradient is already this
              smooth on its own (measured pixel-diff against a blurred render
              is imperceptible, <2% max channel delta), so `blur-3xl` here was
              only forcing a large-kernel GPU blur pass on a permanently
              animated 120vh layer for no visible gain. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={introDone ? { opacity: 0.5 } : { opacity: 0 }}
            transition={{ duration: 1.6, delay: 0.8, ease: "easeOut" }}
            className="bg-aurora animate-aurora-shift absolute left-1/2 top-1/2 h-[120vh] w-[120vh] -translate-x-1/2 -translate-y-1/2"
          />
        </MouseParallax>
      </motion.div>

      {/* Smoothed vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--vignette)]" />
      {/* Film grain */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      {/* ── Floating artwork cards — the digital-art half of the folio, tucked
             under the artboard's edges like prints under a sheet of paper.
             Hovering the frame pops them out ("folder open"). Non-interactive, and
             MUST render below the frame (no z → default, under the z-10 artboard)
             so the frosted panel veils the tucked halves. Fades out with the
             frame on scroll. Below md the phone wrapper underneath takes over. */}
      <motion.div
        aria-hidden
        style={{ opacity: exitOpacity }}
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        {GALLERY.map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            frameHovered={frameHover}
            enabled={enabled}
          />
        ))}
      </motion.div>

      {/* Phone minis — the three artworks docked as a centered "asset shelf"
          row floating above the status bar, so the design-canvas personality
          survives without the artboard frame. A flex row (cards are relative,
          not absolute — see GalleryCard's mini branch) because symmetric even
          spacing is what makes decor read deliberate at this size; absolute
          scatters/piles read as clipping bugs. Static by design — entrance
          slide + float bob run, hover pop never fires on touch. The compound
          media gate (phone width AND ≥680px of height) keeps the shelf off
          short/landscape viewports where the text stack needs the room; its
          bottom-20 also keeps card bottoms above the SectionMenu FABs' tops. */}
      <motion.div
        aria-hidden
        style={{ opacity: exitOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-20 hidden items-end justify-center gap-5 [@media(min-height:680px)_and_(max-width:767.98px)]:flex"
      >
        {GALLERY.filter((item) => item.mobileClassName).map((item) => (
          <GalleryCard
            key={item.id}
            item={item}
            frameHovered={false}
            enabled={false}
            mini
          />
        ))}
      </motion.div>

      {/* ── Decorative workspace chrome (non-interactive, fades on scroll) ──── */}
      {enabled && (
        <motion.div
          aria-hidden
          style={{ opacity: exitOpacity }}
          className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
        >
          <InspectorPanel />
        </motion.div>
      )}
      {/* Scroll cue is bottom-anchored — it sweeps up with the hero, so it rides
          the earlier `chromeOpacity` curve to clear before it re-enters view.
          Not aria-hidden (it holds a real link); the wrapper blocks pointer
          events across the viewport while the anchor re-enables its own. */}
      <motion.div
        style={{ opacity: chromeOpacity, visibility: cueVisibility }}
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
      >
        <ScrollCue />
      </motion.div>

      {/* ── Interactive layers panel (own wrapper so it isn't aria-hidden) ──── */}
      {/* The wrapper owns the scroll-driven opacity; the panel inside owns its
          entrance + the pointer events for dragging. */}
      {enabled && (
        <motion.div
          style={{ opacity: exitOpacity }}
          className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
        >
          <LayersPanel
            order={layerOrder}
            setOrder={setLayerOrder}
            selected={selectedLayer}
            onSelect={setSelectedLayer}
            onReset={resetPlayground}
          />
        </motion.div>
      )}

      {/* ── The artboard frame + its content (interactive) ─────────────────── */}
      {/* Width tracks the headline box via --fw (set while dragging a handle),
          so the big frame stays responsive to the small text box inside it.
          Default is a centred artboard (64rem, capped at the viewport on small
          screens); dragging a frame corner expands --fw out to FRAME_MAX_W. */}
      <motion.div
        ref={frameWrapRef}
        style={{ opacity: exitOpacity, width: "var(--fw, min(64rem, 100%))" }}
        className="relative z-10"
      >
        {/* Top ruler — sits above the frame, spanning its width */}
        <Ruler />

        {/* Frame tab (top-left), riding the top edge */}
        {/* Rides the frame's top edge, so it shares the Ruler's height gate —
            below ~700px it would sit level with the nav pill. */}
        <div className="absolute -top-6 left-0 right-0 hidden items-center [@media(min-width:768px)_and_(min-height:700px)]:flex">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-[color:var(--accent-soft)]"
          >
            <span className="h-2 w-2 rounded-[2px] bg-accent-gradient" />
            Frame&nbsp;01
            <span className="text-ink-faint">/</span>
            <span className="text-ink-muted">Hero</span>
          </motion.span>
        </div>

        {/* Frame body — min-height tracks --fh (set while dragging a frame
            corner); content is centred so it stays balanced as the box grows.
            At xl the extra horizontal padding keeps the headline/actions clear
            of the layers + inspector panels that float over the now-wide frame. */}
        <motion.div
          ref={frameBodyRef}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={
            introDone ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.985 }
          }
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          onHoverStart={() => setFrameHover(true)}
          onHoverEnd={() => setFrameHover(false)}
          style={{ minHeight: "var(--fh)" }}
          // On phones the artboard card is dropped entirely — the border+panel
          // just shrank the text column and added box-in-box chrome. Content
          // sits straight on the canvas (the section provides the gutter); the
          // framed "design file" card starts at sm. Its dressing (ruler, frame
          // tab, dimension caption) comes in later, at md AND ≥700px tall —
          // those hang outside the frame and need room the smaller tiers don't
          // have; see the gate on Ruler.
          className="relative flex flex-col justify-center sm:rounded-md sm:border sm:border-hairline sm:bg-panel-weak sm:px-12 sm:py-[clamp(1.25rem,5vh,3.5rem)] sm:backdrop-blur-[2px] lg:px-16 xl:px-48"
        >
          {/* Top sheen on the frame edge — no frame on phones, no sheen */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 hidden h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent sm:block"
          />

          {/* Corner selection handles around the frame — drag to resize it.
              Fine-pointer only: on touch the drags are inert, so no handles. */}
          {enabled && <FrameHandles onResize={startFrameResize} />}

          {/* Content blocks, rendered in live `layerOrder`. Each is wrapped in a
              `layout` motion.div so dragging the matching row in the layers panel
              animates the block to its new slot. `space-y` (not per-block margins)
              keeps the gaps identical no matter the order. */}
          <motion.div
            style={{ y: contentY }}
            className="space-y-8 sm:space-y-[clamp(1.5rem,3.5vh,2.5rem)]"
          >
            {layerOrder.map((id) => (
              <motion.div
                key={id}
                layout="position"
                transition={{ layout: { duration: 0.55, ease: EASE } }}
              >
                {blocks[id]}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dimension caption under the frame */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={introDone ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          // Same ~700px height gate as the ruler/tab above: below it this
          // caption lands on top of the ScrollCue no matter how tight the
          // margin gets, so it drops out instead.
          className="mt-[clamp(0.75rem,2.5vh,1.5rem)] hidden items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-faint [@media(min-width:768px)_and_(min-height:700px)]:flex"
        >
          <span className="h-px w-6 bg-hairline" />
          Worapat Settapak · Portfolio 2026
          <span className="h-px w-6 bg-hairline" />
        </motion.div>
      </motion.div>

      {/* ── App-style status bar ──────────────────────────────────────────── */}
      {/* Sits at the section's bottom edge and sweeps up with the hero. Split in
          two: the outer wrapper owns the scroll-driven opacity (the earlier
          `chromeOpacity` curve, so the bar clears before it re-enters view), the
          inner owns the entrance fade + slide. On a single element the controlled
          `style.opacity` would swallow the entrance's opacity keyframe, so the bar
          would slide in without fading. */}
      <motion.div
        style={{ opacity: chromeOpacity }}
        className="absolute inset-x-0 bottom-0 z-20"
      >
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE }}
        // Glass extends under the iOS home indicator (env = 0 elsewhere)
        // instead of the indicator overlaying the marquee.
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        className="border-t border-hairline bg-panel backdrop-blur"
       >
        <div className="flex h-10 items-center justify-between gap-4 pl-2 pr-3 sm:h-11">
          {/* Left — accent swatches + tool dock + zoom (sm+). On xl with a fine
              pointer the picker lives in the Inspect panel's Fill row instead,
              so it's hidden here to avoid two copies; every other context
              (touch, or below xl) keeps it in the status bar. */}
          <div className="flex shrink-0 items-center gap-2">
            <AccentSwitcher className={enabled ? "xl:hidden" : ""} />
            <div className="hidden items-center gap-1 sm:flex">
              <div className="flex items-center gap-0.5">
                {[
                  { Icon: MousePointer2, active: true },
                  { Icon: Hand },
                  { Icon: FrameIcon },
                  { Icon: PenTool },
                  { Icon: TypeIcon },
                  { Icon: MessageSquareDashed },
                ].map(({ Icon, active }, i) => (
                  <span
                    key={i}
                    className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
                      active
                        ? "bg-indigo-accent/20 text-[color:var(--accent-soft)]"
                        : "text-ink-faint"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                ))}
              </div>
              <span className="mx-1 h-4 w-px bg-hairline" />
              <div className="flex items-center gap-1 text-ink-subtle">
                <Minus className="h-3 w-3" strokeWidth={2} />
                <span className="w-10 text-center text-[11px] tabular-nums tracking-wide text-ink-muted">
                  100%
                </span>
                <Plus className="h-3 w-3" strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* Center — role marquee */}
          {/* Edges fade via a mask (alpha), not a dark gradient overlay, so the
              text dissolves into the real translucent status bar instead of into
              an opaque black bar at the ends. */}
          <div
            ref={marqueeHoverRef}
            className="relative flex flex-1 overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 3rem), transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, #000 3rem, #000 calc(100% - 3rem), transparent)",
            }}
          >
            {/* A single animated track sliding -50% of its own width. It holds two
                identical halves, so the half scrolling out is pixel-for-pixel the
                half scrolling in — the wrap is seamless with no reset. Duration
                scales with the content so the on-screen speed is unchanged. */}
            <div
              className="animate-marquee flex shrink-0 items-center [will-change:transform]"
              style={{ animationDuration: `${MARQUEE_REPEAT * 28}s` }}
            >
              <MarqueeHalf />
              <MarqueeHalf aria-hidden />
            </div>
          </div>

          {/* Right — live cursor coordinates + presence */}
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-ink-subtle">
            {/* Cursor coordinates only make sense with a cursor — without one
                they'd sit frozen at 000, so touch devices skip them. */}
            {enabled && (
              <span className="hidden items-center gap-1.5 tabular-nums sm:flex">
                <span className="text-ink-faint">X</span>
                <LiveCoord axis="x" />
                <span className="ml-1 text-ink-faint">Y</span>
                <LiveCoord axis="y" />
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-gradient" />
              Worapat
            </span>
          </div>
        </div>
       </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

/**
 * A single tucked artwork card. Layering is deliberate so nothing fights:
 *   • outer plain div  → absolute position + static rotation (a CSS `rotate`, kept
 *     off any motion element because framer would overwrite a Tailwind transform).
 *   • MouseParallax    → cursor-driven translate (its own depth via `strength`).
 *   • entrance motion  → fade in while sliding OUT from deeper under the frame
 *     (start pose is pushed inward along the pop vector), on the slow hero ease.
 *   • pop motion       → the "folder open" slide when the artboard is hovered.
 *     Its own element with a snappy spring, so the spring never fights the slow
 *     entrance tween and the two transforms simply compose.
 *   • inner card       → the perpetual `float-card` bob, phase-offset per card.
 * The art itself is a real <img> once `src` is set, else the colour placeholder.
 *
 * The card ALWAYS sits below the artboard — no z-index switching (lifting it above
 * the frame made the whole "Frame 01" surface visibly jump). The frame's frosted
 * backdrop-blur just veils whatever overlaps it, so the tucked half reads soft
 * while the sliver past the frame edge is already crisp. Hovering only slides the
 * card further out; the emerging portion clears the glass on its own, so it grows
 * clearer as it travels — no stacking flip.
 */
function GalleryCard({
  item,
  frameHovered,
  enabled,
  mini = false,
}: {
  item: GalleryItem;
  frameHovered: boolean;
  /**
   * Fine-pointer present → the side panels can render. Gates chair's
   * `panelClassName` pull-back; the `xl:` inside it self-limits to the widths
   * where the Inspector actually shows, so this only needs the `enabled` half.
   */
  enabled: boolean;
  /** Phone shelf variant: in-flow (flex row), half tilt, grounded color spill. */
  mini?: boolean;
}) {
  const { introDone } = useIntro();
  // Entrance start pose: pushed the OPPOSITE way to the pop — i.e. deeper under
  // the artboard — so on load each card slides out from beneath the glass.
  const inX = item.pop.x * -0.4;
  const inY = item.pop.y * -0.4;

  return (
    <div
      className={
        mini
          ? `relative ${item.mobileClassName}`
          : `absolute ${item.className}${
              enabled && item.panelClassName ? ` ${item.panelClassName}` : ""
            }`
      }
      // Half tilt on the shelf: the full scatter angles look tossed, the
      // docked row wants only a hint of hand-placement.
      style={{ rotate: `${mini ? item.rotate * 0.5 : item.rotate}deg` }}
    >
      {/* Colour spill onto the canvas under the shelf card — dark drop-shadows
          vanish on the near-black bg, so the card's own gradient is what
          grounds it. Sits outside the float-bob layer on purpose: light stays
          put while the card breathes. */}
      {mini && (
        <span
          aria-hidden
          className="absolute -bottom-3 inset-x-1 h-6 rounded-full opacity-40 blur-md"
          style={{ background: item.from }}
        />
      )}
      <MouseParallax strength={item.strength}>
        <motion.div
          initial={{ opacity: 0, x: inX, y: inY, scale: 0.96 }}
          animate={
            introDone
              ? { opacity: 1, x: 0, y: 0, scale: 1 }
              : { opacity: 0, x: inX, y: inY, scale: 0.96 }
          }
          transition={{ duration: 0.7, delay: item.delay, ease: EASE }}
        >
          <motion.div
            animate={
              frameHovered
                ? {
                    x: item.pop.x,
                    y: item.pop.y,
                    rotate: item.pop.rotate,
                    scale: 1.06,
                  }
                : { x: 0, y: 0, rotate: 0, scale: 1 }
            }
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24,
              // The fan opens 1→2→3→4 and unwinds 4→3→2→1 — last card out is
              // the first back under, like dealing cards then gathering the
              // pile from the top. Replaying the open order on the way in read
              // as a rewind of the wrong tape.
              delay: frameHovered ? item.popDelay : POP_DELAY_MAX - item.popDelay,
            }}
          >
            <div
              className="animate-float-card overflow-hidden rounded-2xl border border-white/[0.12] shadow-[0_28px_55px_-24px_rgba(0,0,0,0.75)]"
              style={{ animationDelay: `${item.floatDelay}s`, aspectRatio: "3 / 4" }}
            >
              {item.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.src}
                  alt=""
                  className="h-full w-full object-cover"
                  style={
                    item.zoomOrigin
                      ? {
                          transformOrigin: item.zoomOrigin,
                          transform: `scale(${
                            frameHovered ? item.zoomScale ?? 1.6 : 1
                          })`,
                          transition: "transform 1.4s cubic-bezier(0.16,1,0.3,1)",
                        }
                      : undefined
                  }
                />
              ) : (
                <PlaceholderArt
                  from={item.from}
                  to={item.to}
                  glow={item.glow}
                  label={item.label}
                  chipClass={item.chipClass}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      </MouseParallax>
    </div>
  );
}

/**
 * Colour placeholder for a gallery card until a real image is dropped in. A vivid
 * duotone with a soft top-light bloom, the shared structural grid, a centred image
 * glyph and a filename chip — so it reads unmistakably as a slot waiting for art,
 * in the same surface vocabulary as ProjectCover and the canvas background.
 */
function PlaceholderArt({
  from,
  to,
  glow,
  label,
  chipClass,
}: Pick<GalleryItem, "from" | "to" | "glow" | "label" | "chipClass">) {
  return (
    <div
      aria-hidden
      className="relative h-full w-full"
      style={{ backgroundImage: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(115% 75% at 28% 12%, ${glow}, transparent 58%)`,
        }}
      />
      <div className="grid-lines absolute inset-0 opacity-30" />
      <div className="absolute inset-0 grid place-items-center text-white/80">
        <ImageIcon className="h-6 w-6" strokeWidth={1.5} />
      </div>
      <span
        className={`absolute ${chipClass} rounded-[4px] bg-black/35 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-white/85 backdrop-blur-sm`}
      >
        {label}
      </span>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}

/**
 * One half of the marquee — the tag set repeated `MARQUEE_REPEAT` times so a
 * single half is wide enough to span the container. Two identical halves sit in
 * the animated track; when it slides -50% the second half lands exactly where the
 * first began, so the loop is seamless. The trailing `pr-8` matches the inter-tag
 * gap so the spacing stays even across the wrap.
 */
function MarqueeHalf(props: { "aria-hidden"?: boolean }) {
  return (
    <div
      {...props}
      className="flex shrink-0 items-center gap-8 pr-8"
    >
      {Array.from({ length: MARQUEE_REPEAT }).flatMap((_, r) =>
        MARQUEE_TAGS.map((tag, i) => (
          <span
            key={`${r}-${tag}-${i}`}
            className="flex shrink-0 items-center gap-8 text-[10px] uppercase tracking-[0.32em] text-ink-subtle"
          >
            {tag}
            <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
          </span>
        )),
      )}
    </div>
  );
}

/** Horizontal ruler with tick marks, mounted above the frame. */
function Ruler() {
  const { introDone } = useIntro();
  const pointer = usePointer();
  const fallback = useMotionValue(0);
  // Horizontal-only pan: the ticks glide left/right with the cursor's X
  // (nx ∈ -0.5..0.5), ignoring vertical movement entirely — a camera-pan feel.
  // Opposite sign so the strip drifts against the cursor (looking around a fixed
  // window). The tick layers slide *under* the wrapper's fixed edge-fade mask.
  //
  // Fed from the RAW pointer value with its own soft, under-damped spring. A
  // low natural frequency (gentle stiffness + heavier mass) makes the strip
  // trail the cursor with a slight, pleasant lag instead of snapping to it 1:1,
  // while ζ ≈ 0.62 keeps it smooth with just a faint overshoot as it catches up.
  const targetX = useTransform(pointer?.nx ?? fallback, (v) => v * -56);
  const panX = useSpring(targetX, { stiffness: 100, damping: 11, mass: 0.8 });

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={introDone ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      // Gated on BOTH axes, and deliberately not on `sm:`.
      // Height: it hangs 3.2rem above the frame, so under ~700px the frame's
      // centred position puts that strip behind the nav pill (top 76px).
      // Width: below `md` the section is still on the MOBILE padding tier
      // (pb-48/pt-24, sized for the phone asset shelf), which leaves no room
      // above the frame either — at 684x742 this collided with the nav by 27px
      // even before the height clamps went in. Purely decorative, so on a short
      // or narrow window it drops out rather than colliding.
      className="absolute -top-[3.2rem] left-0 right-0 hidden h-3 overflow-hidden [@media(min-width:768px)_and_(min-height:700px)]:block"
      style={{
        maskImage:
          "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      {/* Inner pan layer — overhangs both edges (-left/-right-8) so the slide
          never reveals a gap, and is translated by the cursor's smoothed X. */}
      <motion.div className="absolute inset-0" style={{ x: panX }}>
        {/* minor ticks every 8px, taller ticks every 80px (matches the grid) */}
        <div
          className="absolute -left-8 -right-8 bottom-0 h-1.5 opacity-50"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgb(var(--ink-faint) / 0.45) 0 1px, transparent 1px 8px)",
          }}
        />
        <div
          className="absolute -left-8 -right-8 bottom-0 h-3 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgb(var(--ink-faint) / 0.6) 0 1px, transparent 1px 80px)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/** Corner handles riding the frame border — drag any one to resize the frame. */
function FrameHandles({
  onResize,
}: {
  onResize: (e: React.PointerEvent, x: number, y: number) => void;
}) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
      {FRAME_CORNERS.map(({ x, y, cursor }) => (
        <span
          key={`${x}-${y}`}
          onPointerDown={(e) => onResize(e, x, y)}
          data-cursor="resize"
          data-cursor-angle={RESIZE_ANGLE[cursor]}
          // 24px hit area around the small square so the corner is easy to grab;
          // the square grows on hover to read as draggable (matches the headline).
          // `cursor` omitted so it inherits `none` and the custom glyph takes over.
          className="pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center [&:hover>span]:scale-150"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <span className="h-2.5 w-2.5 rounded-[2px] border border-ink-faint bg-surface transition-transform duration-150" />
        </span>
      ))}
    </span>
  );
}

/**
 * Interactive Figma-style layers panel. Drag a row to reorder it and the matching
 * hero block restacks to the same slot — both the panel and the content render
 * from the shared `order`. `canvas.bg` is the locked background: it lives outside
 * the reorderable group and is always pinned to the bottom.
 */
function LayersPanel({
  order,
  setOrder,
  selected,
  onSelect,
  onReset,
}: {
  order: LayerId[];
  setOrder: (order: LayerId[]) => void;
  selected: LayerId;
  onSelect: (id: LayerId) => void;
  onReset: () => void;
}) {
  const { introDone } = useIntro();
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={introDone ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }}
      transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
      className="pointer-events-auto absolute left-6 top-1/2 hidden w-44 -translate-y-1/2 select-none rounded-lg border border-hairline bg-panel p-2.5 backdrop-blur xl:block"
    >
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.25em] text-ink-subtle">
        Layers
        <span className="text-ink-faint">{order.length + 1}</span>
      </div>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={setOrder}
        as="ul"
        className="space-y-0.5 text-xs"
      >
        {order.map((id) => {
          const meta = LAYER_META[id];
          const isSelected = selected === id;
          return (
            <Reorder.Item
              key={id}
              value={id}
              onPointerDown={() => onSelect(id)}
              whileDrag={{ scale: 1.04 }}
              data-cursor-hover
              className={`group flex cursor-grab items-center gap-1.5 rounded-md px-2 py-1.5 active:cursor-grabbing ${
                isSelected
                  ? "bg-indigo-accent/15 text-ink-strong ring-1 ring-inset ring-indigo-accent/30"
                  : "text-ink-subtle hover:bg-glass hover:text-ink"
              }`}
            >
              <GripVertical
                className={`h-3 w-3 shrink-0 transition-opacity ${
                  isSelected
                    ? "text-[color:var(--accent-soft)]"
                    : "text-ink-faint opacity-0 group-hover:opacity-100"
                }`}
                strokeWidth={2}
              />
              <span
                className={`w-3 text-center text-[10px] ${
                  isSelected ? "text-[color:var(--accent-soft)]" : "text-ink-faint"
                }`}
              >
                {meta.type}
              </span>
              <span className="flex-1 truncate">{meta.label}</span>
              <Eye
                className={`h-3 w-3 shrink-0 ${
                  isSelected ? "text-[color:var(--accent-soft)]" : "text-ink-faint"
                }`}
                strokeWidth={2}
              />
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {/* Locked background layer — pinned to the bottom, not reorderable */}
      <ul className="mt-0.5 text-xs">
        <li className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-ink-subtle">
          <span aria-hidden className="h-3 w-3 shrink-0" />
          <span className="w-3 text-center text-[10px] text-ink-faint">▦</span>
          <span className="flex-1 truncate">canvas.bg</span>
          <Lock className="h-3 w-3 shrink-0 text-ink-faint" strokeWidth={2} />
        </li>
      </ul>
      {/* Reset — undoes everything the playground lets a visitor do (frame /
          text-box resizes, layer order). A quiet ghost row so it reads as
          panel chrome, not a call to action. */}
      <div className="my-1.5 h-px bg-hairline" />
      <button
        type="button"
        onClick={onReset}
        data-cursor-hover
        className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] uppercase tracking-[0.22em] text-ink-subtle transition-colors hover:bg-glass hover:text-ink"
      >
        <RotateCcw className="h-3 w-3" strokeWidth={2} />
        Reset
      </button>
    </motion.div>
  );
}

/** Figma-style inspector panel reading live cursor X/Y, parked at the right. */
function InspectorPanel() {
  const { introDone } = useIntro();
  // The Fill row doubles as the site's accent picker — its swatch + hex reflect
  // the live accent, and the swatches below switch it (see AccentSwitcher).
  const { accent } = useAccent();
  const fillHex = ACCENT_PRIMARY[accent].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={introDone ? { opacity: 1, x: 0 } : { opacity: 0, x: 16 }}
      transition={{ duration: 0.7, delay: 0.8, ease: EASE }}
      className="absolute right-6 top-1/2 hidden w-44 -translate-y-1/2 select-none rounded-lg border border-hairline bg-panel p-3 backdrop-blur xl:block"
    >
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-ink-subtle">
        Inspect
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
        <Field label="X">
          <LiveCoord axis="x" />
        </Field>
        <Field label="Y">
          <LiveCoord axis="y" />
        </Field>
        <Field label="W">1440</Field>
        <Field label="H">812</Field>
      </div>
      <div className="my-3 h-px bg-hairline" />
      <div className="flex items-center justify-between text-[11px] text-ink-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-accent-gradient" />
          Fill
        </span>
        <span className="tabular-nums text-ink-muted">{fillHex}</span>
      </div>
      {/* Interactive: the panel wrapper is pointer-events-none, so re-enable it
          here so the swatches are actually clickable. */}
      <div className="mt-2.5" style={{ pointerEvents: "auto" }}>
        <AccentSwitcher variant="strip" />
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-subtle">
        <span>Opacity</span>
        <span className="tabular-nums text-ink-muted">100%</span>
      </div>
    </motion.div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-glass px-2 py-1.5">
      <span className="text-ink-faint">{label}</span>
      <span className="tabular-nums text-ink">{children}</span>
    </div>
  );
}

/** Live cursor coordinate readout, updated via MotionValue (no re-render). */
function LiveCoord({ axis }: { axis: "x" | "y" }) {
  const pointer = usePointer();
  const fallback = useMotionValue(0);
  const source = (axis === "x" ? pointer?.x : pointer?.y) ?? fallback;
  const text = useTransform(source, (v) =>
    String(Math.max(0, Math.round(v))).padStart(3, "0"),
  );
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

/** Minimal scroll affordance, bottom-centre above the status bar. */
function ScrollCue() {
  return (
    <a
      href="#about"
      aria-label="Scroll to about"
      data-cursor-hover
      // Offset is height-clamped so the cue tucks closer to the status bar on
      // short viewports instead of colliding with the frame's dimension caption
      // above it; on tall screens it stays at the original bottom-20 (5rem).
      className="pointer-events-auto absolute bottom-[clamp(3.5rem,9vh,5rem)] left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-ink-subtle transition-colors duration-200 hover:text-ink-strong"
    >
      <span className="flex flex-col items-center gap-3">
        Scroll
        <span className="relative h-8 w-px overflow-hidden bg-ink-faint/40">
          <span className="animate-scroll-line absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-ink-strong to-transparent" />
        </span>
      </span>
    </a>
  );
}
