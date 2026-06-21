"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowUpRight,
  Eye,
  Frame as FrameIcon,
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

const MARQUEE_TAGS = [
  "UX/UI Designer",
  "Digital Artist",
  "Based in Thailand",
  "TNI Graduate",
  "Available for Work",
];

// The artboard's "layers" — a static stand-in for a design tool's layer list.
const LAYERS = [
  { name: "presence", type: "◇" },
  { name: "statement", type: "T", selected: true },
  { name: "actions", type: "◇" },
  { name: "canvas.bg", type: "▦", locked: true },
];

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
    const maxFW = window.innerWidth - 48; // keep the frame inside the viewport

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
    const maxW = window.innerWidth - 48;
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
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const uiOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const auroraScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const marqueeHoverRef = useMarqueeSlowOnHover<HTMLDivElement>();

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 sm:px-10"
    >
      {/* ── Background: grid + cursor-glow, aurora, accents, dust ───────────── */}
      <motion.div style={{ y: gridY }} className="absolute inset-0">
        <MouseParallax strength={16} className="absolute inset-0">
          <div className="grid-lines pointer-events-none absolute -inset-16" />
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_130%_at_50%_0%,transparent_38%,rgba(0,0,0,0.12)_58%,rgba(0,0,0,0.32)_76%,rgba(0,0,0,0.5)_90%,rgba(0,0,0,0.62)_100%)]" />
      {/* Film grain */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      {/* ── Decorative workspace chrome (non-interactive, fades on scroll) ──── */}
      <motion.div
        aria-hidden
        style={{ opacity: uiOpacity }}
        className="pointer-events-none absolute inset-0 z-20 hidden lg:block"
      >
        <LayersPanel />
        <InspectorPanel />
        <ScrollCue />
      </motion.div>

      {/* ── The artboard frame + its content (interactive) ─────────────────── */}
      {/* Width tracks the headline box via --fw (set while dragging a handle),
          so the big frame stays responsive to the small text box inside it.
          Default is a wide full-bleed artboard: fills the width on laptops, caps
          at 75rem and centres on wide screens. Dragging a frame corner overrides
          it via --fw. */}
      <motion.div
        ref={frameWrapRef}
        style={{ opacity: uiOpacity, width: "var(--fw, min(75rem, 100%))" }}
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
            className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-indigo-200/80"
          >
            <span className="h-2 w-2 rounded-[2px] bg-accent-gradient" />
            Frame&nbsp;01
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-400">Hero</span>
          </motion.span>
        </div>

        {/* Frame body — min-height tracks --fh (set while dragging a frame
            corner); content is centred so it stays balanced as the box grows. */}
        <motion.div
          ref={frameBodyRef}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          style={{ minHeight: "var(--fh)" }}
          className="relative flex flex-col justify-center rounded-md border border-hairline bg-[#0a0a0c]/40 px-6 py-12 backdrop-blur-[2px] sm:px-12 sm:py-16 lg:px-16 lg:py-20"
        >
          {/* Top sheen on the frame edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          {/* Corner selection handles around the frame — drag to resize it */}
          <FrameHandles onResize={startFrameResize} />

          {/* Interactive vector pen-path — fills the open canvas to the right of
              the headline. Only shown where the wide frame leaves room (xl+). */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 1.7, ease: EASE }}
            // y via motion (not a Tailwind translate, which motion's transform
            // would override) so the path stays vertically centred in the frame.
            style={{ y: "-50%" }}
            className="pointer-events-none absolute right-[6%] top-1/2 hidden xl:block"
          >
            <PenPath />
          </motion.div>

          <motion.div style={{ y: contentY }}>
            {/* Presence row — availability, framed as a layer status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
              className="mb-9 flex flex-wrap items-center gap-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.02] px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-400 backdrop-blur">
                <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent-gradient" />
                Available for work
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.28em] text-neutral-600 sm:inline">
                UX/UI &amp; Digital Art
              </span>
            </motion.div>

            {/* Headline = a resizable "text box". The words FLOW (not forced onto
                separate lines) inside a width of var(--bw): the default
                `min-content` keeps the longest word per line — i.e. the current
                two-line look — while dragging an edge handle re-wraps them. Size
                (--hs) and leading (--lh) ride the same container. */}
            <div
              ref={headlineRef}
              className="relative inline-block select-none"
              style={{
                fontSize: "calc(clamp(2.75rem,8.5vw,6rem) * var(--hs,1))",
                width: "var(--bw, min-content)",
                lineHeight: "var(--lh, 0.94)",
              }}
            >
              <h1 className="font-serif font-bold tracking-tight text-white">
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
                    // 24px hit area around an 8px dot so the small handles are
                    // easy to grab; the dot grows on hover to read as draggable.
                    className="pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center [&:hover>span]:scale-150"
                    style={{ left: `${h.x}%`, top: `${h.y}%`, cursor: h.cursor }}
                  >
                    <span className="h-2 w-2 rounded-[1px] border border-indigo-accent bg-night transition-transform duration-150" />
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Tagline + actions */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.45, ease: EASE }}
              className="mt-10 grid grid-cols-1 items-end gap-8 sm:grid-cols-12 sm:gap-6"
            >
              <p className="text-base text-neutral-400 sm:col-span-6 sm:text-lg">
                <Balancer>
                  UX/UI designer &amp; digital artist crafting{" "}
                  <span className="text-neutral-200">
                    interfaces people love
                  </span>{" "}
                  — from research to pixel-perfect prototype.
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
                  className="group inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
                >
                  Get in touch
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Dimension caption under the frame */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-3 hidden items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-600 sm:flex"
        >
          <span className="h-px w-6 bg-hairline" />
          Worapat Settapak · Portfolio 2026
          <span className="h-px w-6 bg-hairline" />
        </motion.div>
      </motion.div>

      {/* ── App-style status bar ──────────────────────────────────────────── */}
      {/* Split in two: the outer wrapper owns the scroll-driven opacity (a
          controlled MotionValue), the inner owns the entrance fade + slide. On
          a single element the controlled `style.opacity` would swallow the
          entrance's opacity keyframe, so the bar would slide in without fading. */}
      <motion.div
        style={{ opacity: uiOpacity }}
        className="absolute inset-x-0 bottom-0 z-20"
      >
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6, ease: EASE }}
        className="border-t border-hairline bg-[#080808]/55 backdrop-blur"
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
                      ? "bg-indigo-accent/20 text-indigo-200"
                      : "text-neutral-600"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
              ))}
            </div>
            <span className="mx-1 h-4 w-px bg-hairline" />
            <div className="flex items-center gap-1 text-neutral-500">
              <Minus className="h-3 w-3" strokeWidth={2} />
              <span className="w-10 text-center text-[11px] tabular-nums tracking-wide text-neutral-400">
                100%
              </span>
              <Plus className="h-3 w-3" strokeWidth={2} />
            </div>
          </div>

          {/* Center — role marquee */}
          <div
            ref={marqueeHoverRef}
            className="relative flex flex-1 overflow-hidden"
          >
            {/* edge fades */}
            <span className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-[#080808] to-transparent" />
            <span className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-[#080808] to-transparent" />
            <MarqueeTrack />
            <MarqueeTrack aria-hidden />
          </div>

          {/* Right — live cursor coordinates + presence */}
          <div className="flex shrink-0 items-center gap-3 text-[11px] text-neutral-500">
            <span className="hidden items-center gap-1.5 tabular-nums sm:flex">
              <span className="text-neutral-600">X</span>
              <LiveCoord axis="x" />
              <span className="ml-1 text-neutral-600">Y</span>
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

/** One marquee track of role tags. Two are rendered for a seamless loop. */
function MarqueeTrack(props: { "aria-hidden"?: boolean }) {
  return (
    <div
      {...props}
      className="animate-marquee flex shrink-0 items-center gap-8 pr-8"
    >
      {MARQUEE_TAGS.concat(MARQUEE_TAGS).map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="flex shrink-0 items-center gap-8 text-[10px] uppercase tracking-[0.32em] text-neutral-500"
        >
          {tag}
          <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
        </span>
      ))}
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
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 8px)",
          }}
        />
        <div
          className="absolute -left-8 -right-8 bottom-0 h-3 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0 1px, transparent 1px 80px)",
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
          // 24px hit area around the small square so the corner is easy to grab;
          // the square grows on hover to read as draggable (matches the headline).
          className="pointer-events-auto absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center [&:hover>span]:scale-150"
          style={{ left: `${x}%`, top: `${y}%`, cursor }}
        >
          <span className="h-2.5 w-2.5 rounded-[2px] border border-neutral-500 bg-[#0c0c0c] transition-transform duration-150" />
        </span>
      ))}
    </span>
  );
}

/**
 * An interactive vector "pen path" — a live cubic-bézier curve a visitor can
 * reshape by dragging its anchor points (squares) or control points (circles),
 * a nod to the Pen tool in the status-bar dock. The container is pointer-through;
 * only the small points capture input, so it never blocks the copy beneath it.
 */
function PenPath() {
  const W = 360;
  const H = 300;
  const PAD = 14;
  const svgRef = useRef<SVGSVGElement>(null);
  const [pts, setPts] = useState({
    p0: { x: 28, y: 236 },
    c1: { x: 64, y: 38 },
    c2: { x: 264, y: 274 },
    p3: { x: 330, y: 92 },
  });
  const dragKey = useRef<keyof typeof pts | null>(null);

  const onDown = (key: keyof typeof pts) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragKey.current = key;
    const move = (ev: PointerEvent) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || !dragKey.current) return;
      // Map client → viewBox coords (svg may be scaled by responsive width).
      const x = ((ev.clientX - rect.left) / rect.width) * W;
      const y = ((ev.clientY - rect.top) / rect.height) * H;
      setPts((p) => ({
        ...p,
        [dragKey.current!]: {
          x: Math.max(PAD, Math.min(W - PAD, x)),
          y: Math.max(PAD, Math.min(H - PAD, y)),
        },
      }));
    };
    const up = () => {
      dragKey.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const { p0, c1, c2, p3 } = pts;
  const d = `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}`;
  const points: { key: keyof typeof pts; anchor: boolean }[] = [
    { key: "c1", anchor: false },
    { key: "c2", anchor: false },
    { key: "p0", anchor: true },
    { key: "p3", anchor: true },
  ];

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="pointer-events-none overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id="pen-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="pen-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* control-handle leashes from each anchor to its control point */}
      <line x1={p0.x} y1={p0.y} x2={c1.x} y2={c1.y} stroke="rgba(255,255,255,0.16)" strokeWidth={1} strokeDasharray="3 4" />
      <line x1={p3.x} y1={p3.y} x2={c2.x} y2={c2.y} stroke="rgba(255,255,255,0.16)" strokeWidth={1} strokeDasharray="3 4" />

      {/* the curve: a soft glow under a crisp gradient stroke */}
      <path d={d} fill="none" stroke="url(#pen-grad)" strokeWidth={9} strokeLinecap="round" opacity={0.35} filter="url(#pen-glow)" />
      <path d={d} fill="none" stroke="url(#pen-grad)" strokeWidth={3} strokeLinecap="round" />

      {points.map(({ key, anchor }) => {
        const p = pts[key];
        return (
          <g
            key={key}
            onPointerDown={onDown(key)}
            className="group pointer-events-auto cursor-grab [&:active]:cursor-grabbing"
          >
            {/* generous transparent hit target */}
            <circle cx={p.x} cy={p.y} r={14} fill="transparent" />
            {anchor ? (
              <rect
                x={p.x - 5}
                y={p.y - 5}
                width={10}
                height={10}
                rx={1.5}
                strokeWidth={1.5}
                className="origin-center fill-white stroke-indigo-accent transition-transform [transform-box:fill-box] group-hover:scale-125"
              />
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r={5.5}
                strokeWidth={1.5}
                className="origin-center fill-[#0c0c0c] stroke-indigo-accent transition-transform [transform-box:fill-box] group-hover:scale-125"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Figma-style layers panel, parked at the left edge of the canvas. */
function LayersPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
      className="absolute left-6 top-1/2 hidden w-44 -translate-y-1/2 select-none rounded-lg border border-hairline bg-[#0b0b0d]/70 p-2.5 backdrop-blur xl:block"
    >
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
        Layers
        <span className="text-neutral-700">4</span>
      </div>
      <ul className="space-y-0.5 text-xs">
        {LAYERS.map((layer) => (
          <li
            key={layer.name}
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
              layer.selected
                ? "bg-indigo-accent/15 text-white ring-1 ring-inset ring-indigo-accent/30"
                : "text-neutral-500"
            }`}
          >
            <span
              className={`w-3 text-center text-[10px] ${
                layer.selected ? "text-indigo-200" : "text-neutral-600"
              }`}
            >
              {layer.type}
            </span>
            <span className="flex-1 truncate">{layer.name}</span>
            {layer.locked ? (
              <Lock className="h-3 w-3 text-neutral-700" strokeWidth={2} />
            ) : (
              <Eye
                className={`h-3 w-3 ${
                  layer.selected ? "text-indigo-200/80" : "text-neutral-700"
                }`}
                strokeWidth={2}
              />
            )}
          </li>
        ))}
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
      className="absolute right-6 top-1/2 hidden w-44 -translate-y-1/2 select-none rounded-lg border border-hairline bg-[#0b0b0d]/70 p-3 backdrop-blur xl:block"
    >
      <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-neutral-500">
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
      <div className="flex items-center justify-between text-[11px] text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-[3px] bg-accent-gradient" />
          Fill
        </span>
        <span className="tabular-nums text-neutral-400">#6366F1</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Opacity</span>
        <span className="tabular-nums text-neutral-400">100%</span>
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
    <div className="flex items-center gap-2 rounded-md bg-white/[0.03] px-2 py-1.5">
      <span className="text-neutral-600">{label}</span>
      <span className="tabular-nums text-neutral-300">{children}</span>
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
      className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-neutral-500"
    >
      <span className="flex flex-col items-center gap-3">
        Scroll
        <span className="relative h-8 w-px overflow-hidden bg-neutral-800">
          <span className="animate-scroll-line absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        </span>
      </span>
    </a>
  );
}
