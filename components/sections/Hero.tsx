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
  ArrowUpRight,
  Eye,
  Frame as FrameIcon,
  GripVertical,
  Hand,
  Lock,
  MessageSquareDashed,
  Minus,
  MousePointer2,
  PenTool,
  Plus,
  Type as TypeIcon,
} from "lucide-react";
import { Balancer } from "react-wrap-balancer";
import MagneticButton from "@/components/ui/MagneticButton";
import MouseParallax from "@/components/ui/MouseParallax";
import Particles from "@/components/ui/Particles";
import SplitText from "@/components/ui/SplitText";
import GridSpotlight from "@/components/ui/GridSpotlight";
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

const MARQUEE_TAGS = [
  "UX/UI Designer",
  "Digital Artist",
  "Based in Thailand",
  "TNI Graduate",
  "Available for Work",
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

    // Grow the box width and carry the frame along by the same delta (constant
    // gutter), clamped to the viewport and floored at the longest word.
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
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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

    // Floors: the frame can't go narrower than the headline (+ breathing room)
    // nor shorter than its natural content height (measured with --fh removed).
    const minW =
      (headlineRef.current?.getBoundingClientRect().width ?? 264) + 96;
    const prevMinH = body.style.minHeight;
    body.style.minHeight = "0px";
    const minH = body.getBoundingClientRect().height;
    body.style.minHeight = prevMinH;

    const startDX = e.clientX - cx || 1;
    const startDY = e.clientY - cy || 1;
    const maxW = Math.min(window.innerWidth - 48, FRAME_MAX_W);
    const maxH = Math.max(minH, window.innerHeight - 40);
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
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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
  const contentY = useTransform(heroProgress, [0, 1], [0, -110]);
  const auroraScale = useTransform(heroProgress, [0, 1], [1, 1.4]);
  const auroraY = useTransform(heroProgress, [0, 1], [0, 160]);
  const gridY = useTransform(heroProgress, [0, 1], [0, 80]);

  const marqueeHoverRef = useMarqueeSlowOnHover<HTMLDivElement>();

  // Live layer order, shared by the layers panel (drag to reorder) and the frame
  // content (rendered in this sequence). Reordering one reorders the other.
  const [layerOrder, setLayerOrder] = useState<LayerId[]>(DEFAULT_LAYER_ORDER);
  const [selectedLayer, setSelectedLayer] = useState<LayerId>("statement");

  // The hero content blocks, keyed by layer id. Rendered through `layerOrder`
  // below so the panel's drag-to-reorder physically restacks them, with a
  // `layout` transition animating each block to its new slot.
  const blocks: Record<LayerId, React.ReactNode> = {
    presence: (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
        className="flex flex-wrap items-center gap-3"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-glass px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-muted backdrop-blur">
          <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent-gradient" />
          Available for work
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
          fontSize: "calc(clamp(2.75rem,8.5vw,6rem) * var(--hs,1))",
          width: "var(--bw, min-content)",
          lineHeight: "var(--lh, 0.94)",
        }}
      >
        <h1 className="font-serif font-bold tracking-tight text-ink-strong">
          <SplitText
            text="Designing"
            as="span"
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
              delay={0.9}
              stagger={0.03}
              fromY={90}
              fromRotate={-4}
            />
            {/* Blinking text-insertion caret — scales with the text (em) */}
            <motion.span
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="animate-caret-blink mb-[0.3em] ml-1 h-[0.72em] w-[3px] rounded-full bg-accent-gradient sm:w-1"
            />
          </span>
        </h1>

        {/* Selection bounding box + draggable resize handles (desktop) */}
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.25, ease: EASE }}
          className="pointer-events-none absolute -inset-x-3 -inset-y-2 hidden md:block"
        >
          <span className="absolute inset-0 rounded-[2px] ring-1 ring-indigo-accent/55" />
          {RESIZE_HANDLES.map((h) => (
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
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 1.45, ease: EASE }}
        className="grid grid-cols-1 items-end gap-8 sm:grid-cols-12 sm:gap-6"
      >
        <p className="text-base text-ink-muted sm:col-span-6 sm:text-lg">
          <Balancer>
            UX/UI designer &amp; digital artist crafting{" "}
            <span className="text-ink">interfaces people love</span> —
            from research to pixel-perfect prototype.
          </Balancer>
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:col-span-6 sm:justify-end">
          <MagneticButton
            href="#work"
            glow
            className="px-7 py-3.5 text-sm font-medium text-white"
          >
            View my work
            <span className="relative inline-flex h-4 w-4 items-center justify-center">
              <ArrowUpRight
                className="absolute h-4 w-4 transition-all duration-300 group-hover:rotate-45 group-hover:scale-50 group-hover:opacity-0"
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
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16 sm:px-10"
    >
      {/* ── Background: dot grid + cursor-glow, aurora, accents, dust ───────────── */}
      <motion.div style={{ y: gridY }} className="absolute inset-0">
        <MouseParallax strength={16} className="absolute inset-0">
          <div className="grid-dots pointer-events-none absolute -inset-16" />
          <GridSpotlight className="-inset-16" size={620} gridSize={80} />
        </MouseParallax>
      </motion.div>

      <motion.div
        aria-hidden
        style={{ y: auroraY, scale: auroraScale }}
        className="pointer-events-none absolute inset-0"
      >
        <MouseParallax strength={42} className="absolute inset-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1.6, delay: 0.8, ease: "easeOut" }}
            className="bg-aurora animate-aurora-shift absolute left-1/2 top-1/2 h-[120vh] w-[120vh] -translate-x-1/2 -translate-y-1/2 blur-3xl"
          />
        </MouseParallax>
      </motion.div>

      <motion.div
        aria-hidden
        style={{ y: auroraY }}
        className="pointer-events-none absolute inset-0"
      >
        <MouseParallax strength={28} follow className="absolute inset-0">
          <div className="absolute left-[18%] top-[22%] h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),transparent_70%)] blur-2xl" />
          <div className="absolute right-[14%] bottom-[18%] h-[36vh] w-[36vh] translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.18),transparent_70%)] blur-2xl" />
        </MouseParallax>
      </motion.div>

      <Particles count={48} />

      {/* Smoothed vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--vignette)]" />
      {/* Film grain */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      {/* ── Decorative workspace chrome (non-interactive, fades on scroll) ──── */}
      <motion.div
        aria-hidden
        style={{ opacity: exitOpacity }}
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
      >
        <InspectorPanel />
      </motion.div>
      {/* Scroll cue is bottom-anchored — it sweeps up with the hero, so it rides
          the earlier `chromeOpacity` curve to clear before it re-enters view. */}
      <motion.div
        aria-hidden
        style={{ opacity: chromeOpacity }}
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
      >
        <ScrollCue />
      </motion.div>

      {/* ── Interactive layers panel (own wrapper so it isn't aria-hidden) ──── */}
      {/* The wrapper owns the scroll-driven opacity; the panel inside owns its
          entrance + the pointer events for dragging. */}
      <motion.div
        style={{ opacity: exitOpacity }}
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
      >
        <LayersPanel
          order={layerOrder}
          setOrder={setLayerOrder}
          selected={selectedLayer}
          onSelect={setSelectedLayer}
        />
      </motion.div>

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
        <div className="absolute -top-6 left-0 right-0 hidden items-center sm:flex">
          <motion.span
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
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
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          style={{ minHeight: "var(--fh)" }}
          className="relative flex flex-col justify-center rounded-md border border-hairline bg-panel-weak px-6 py-10 backdrop-blur-[2px] sm:px-12 sm:py-14 lg:px-16 xl:px-48"
        >
          {/* Top sheen on the frame edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent"
          />

          {/* Corner selection handles around the frame — drag to resize it */}
          <FrameHandles onResize={startFrameResize} />

          {/* Content blocks, rendered in live `layerOrder`. Each is wrapped in a
              `layout` motion.div so dragging the matching row in the layers panel
              animates the block to its new slot. `space-y` (not per-block margins)
              keeps the gaps identical no matter the order. */}
          <motion.div style={{ y: contentY }} className="space-y-10">
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
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 hidden items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-faint sm:flex"
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
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE }}
        className="border-t border-hairline bg-panel backdrop-blur"
       >
        <div className="flex h-10 items-center justify-between gap-4 pl-2 pr-3 sm:h-11">
          {/* Left — tool dock + zoom */}
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
            <span className="hidden items-center gap-1.5 tabular-nums sm:flex">
              <span className="text-ink-faint">X</span>
              <LiveCoord axis="x" />
              <span className="ml-1 text-ink-faint">Y</span>
              <LiveCoord axis="y" />
            </span>
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
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="absolute -top-[3.2rem] left-0 right-0 hidden h-3 overflow-hidden sm:block"
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
}: {
  order: LayerId[];
  setOrder: (order: LayerId[]) => void;
  selected: LayerId;
  onSelect: (id: LayerId) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
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
    </motion.div>
  );
}

/** Figma-style inspector panel reading live cursor X/Y, parked at the right. */
function InspectorPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
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
        <span className="tabular-nums text-ink-muted">#6366F1</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-subtle">
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
      className="absolute bottom-20 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-ink-subtle"
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
