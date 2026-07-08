"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { useRef } from "react";
import {
  useAccent,
  ACCENT_PRIMARY,
  ACCENT_CHANNELS,
} from "@/components/ui/AccentProvider";

// Static diagonal band used as the sheen mask — only its position animates.
// A narrow hot core so the glint stays a passing streak (a wide core whites
// out the whole glyph at mid-pass), with shoulders that still taper gently to
// zero: the bloom must dissolve inside the falloff, never meet a hard
// boundary, or the trimmed glow prints the band's straight edges onto the
// backdrop as a visible stripe.
const SHEEN_BAND =
  "linear-gradient(115deg, transparent 36%, rgba(0,0,0,0.15) 44%, #000 49%, #000 51%, rgba(0,0,0,0.15) 56%, transparent 64%)";

type ReflectiveGlyphProps = {
  /** Glyph(s) to render — a numeral like "02" or a short mark like "CV". */
  text: string;
  /** Scroll progress (0→1) that drives the color shift and light-pass. */
  progress: MotionValue<number>;
  /**
   * Progress window over which the stroke floods up from empty → full. Omit to
   * render the glyph statically full (e.g. a hero mark that's visible on load),
   * with only the sheen reacting to scroll.
   */
  revealRange?: [number, number];
  /**
   * Optional separate progress that drives the reveal flood (so it can finish on
   * a different cadence than the sheen — e.g. as the section scrolls into view
   * rather than across its whole height). Defaults to `progress`.
   */
  revealProgress?: MotionValue<number>;
  /**
   * Progress window over which the light-pass sweeps across. Paired with a
   * travel span that barely overshoots the glyph, so nearly all of the window
   * is spent visibly crossing it — stretching the window slows the pass.
   */
  sheenRange?: [number, number];
};

/**
 * A huge hollow glyph whose stroke lights up bottom-up and then catches a hot
 * specular light-pass. Four pixel-aligned layers share the same text/size:
 *   1. ghost  — a faint always-on outline (the unlit tube)
 *   2. flood  — the lit stroke revealed bottom-up (white → accent), a clean
 *               line with no glow of its own
 *   3. crest  — a near-white scan line tracing the rising waterline
 *   4. sheen  — a wide screen-blended light streak with a white-hot bloom
 *               (the only glowing layer), swept across *after* the tube is
 *               fully lit
 *
 * Reveal + crest are clip-path driven (compositor-friendly); the sheen animates
 * mask-position. Inherits font-size/weight from its parent. Decorative.
 */
export function ReflectiveGlyph({
  text,
  progress,
  revealRange,
  revealProgress,
  sheenRange = [0.03, 0.55],
}: ReflectiveGlyphProps) {
  // The flood can track a different progress than the sheen (e.g. the section's
  // entry into view rather than its full scroll-through).
  const floodProgress = revealProgress ?? progress;

  // With a reveal window the waterline retreats 102% → -18% across it; without
  // one the glyph stays full and only the sheen moves. The overshoot past
  // [100, 0] matters: inset(0%) still clips to the exact text box, which
  // shears the sheen's drop-shadow bloom off at the box edges (a visible
  // straight cut beside the first/last digit). Ending at -18% — mirrored on
  // the other three sides in the clip template below — leaves the bloom room
  // to fade out on its own.
  const range = revealRange ?? [0, 1];
  const floodTopDynamic = useTransform(floodProgress, range, [102, -18]);
  const floodTopStatic = useMotionValue(-18);
  const floodTop = revealRange ? floodTopDynamic : floodTopStatic;

  // Stroke cools from a subtle white into the accent over the first ~2/3 of the
  // reveal; a static glyph just sits at the accent. The endpoint is a hex (not a
  // CSS var) because framer interpolates colours numerically — ACCENT_PRIMARY
  // mirrors --accent-1 per palette so it retints when the accent changes.
  const { accent } = useAccent();
  const accentHex = ACCENT_PRIMARY[accent];
  // Bloom for the passing glint only — the resting stroke stays a clean line.
  // drop-shadow() renders from the stroke's alpha, so the glow hugs the tube
  // lines instead of filling the glyph the way text-shadow would.
  const ch = ACCENT_CHANNELS[accent];
  const sheenGlow = `drop-shadow(0 0 5px rgba(255,255,255,0.7)) drop-shadow(0 0 12px rgba(${ch},0.35))`;
  const colorEnd = range[0] + (range[1] - range[0]) * 0.65;
  const floodStrokeDynamic = useTransform(
    floodProgress,
    [range[0], colorEnd],
    ["rgba(255,255,255,0.55)", accentHex]
  );
  const floodStroke: MotionValue<string> | string = revealRange
    ? floodStrokeDynamic
    : accentHex;

  const floodClip = useMotionTemplate`inset(${floodTop}% -18% -18% -18%)`;
  // Crest: a ~3%-tall band sitting exactly at the waterline; collapses to
  // nothing while empty. Its top is the waterline clamped back into [0, 100]
  // so the flood's overshoot doesn't move it: it still appears as the flood
  // crosses into the box and parks at the cap once the reveal tops off.
  const crestTop = useTransform(floodTop, (v) => Math.min(100, Math.max(0, v)));
  const crestBottom = useTransform(crestTop, (v) => Math.max(0, 97 - v));
  const crestClip = useMotionTemplate`inset(${crestTop}% 0% ${crestBottom}% 0%)`;

  // Light-pass — only the mask position animates; the band shape is static and
  // the highlight is gated to the revealed area via the same waterline clip.
  // Runs on the full scroll-through so it starts moving as soon as the section
  // does; the early reveal (see SectionLabel) has the tube lit before the hot
  // core of the band crosses it. Travel (130% → -30%) just clears the glyph on
  // each side — pairing that short span with the long sheenRange window is
  // what makes the pass move slowly instead of flashing through.
  const sheenPos = useTransform(progress, sheenRange, [
    "130% 130%",
    "-30% -30%",
  ]);

  return (
    <span className="relative block">
      {/* Ghost outline — in-flow, sets the box the overlays clip against. */}
      <span
        className="block"
        style={{
          WebkitTextStroke: "2.5px var(--glyph-ghost)",
          color: "transparent",
        }}
      >
        {text}
      </span>

      {/* Lit stroke — floods bottom-up, fading white → accent. */}
      <motion.span
        className="absolute inset-0 block"
        style={{
          clipPath: floodClip,
          WebkitClipPath: floodClip,
          WebkitTextStrokeWidth: "3px",
          WebkitTextStrokeColor: floodStroke,
          color: "transparent",
          opacity: 0.85,
        }}
      >
        {text}
      </motion.span>

      {/* Waterline crest — a brighter, near-white stroke tracing the edge. */}
      <motion.span
        className="absolute inset-0 block"
        style={{
          clipPath: crestClip,
          WebkitClipPath: crestClip,
          WebkitTextStrokeWidth: "3px",
          WebkitTextStrokeColor: "var(--glyph-crest)",
          color: "transparent",
          opacity: 0.95,
        }}
      >
        {text}
      </motion.span>

      {/* Light-pass — a wide specular streak with a white-hot core that sweeps
          across the lit tube, screen-blended and bloomed so it reads as a
          reflection travelling over glass. */}
      <motion.span
        className="absolute inset-0 block"
        style={{
          clipPath: floodClip,
          WebkitClipPath: floodClip,
          WebkitTextStrokeWidth: "3.5px",
          WebkitTextStrokeColor: "rgba(255,255,255,0.95)",
          color: "transparent",
          mixBlendMode: "screen",
          filter: sheenGlow,
          maskImage: SHEEN_BAND,
          WebkitMaskImage: SHEEN_BAND,
          maskSize: "250% 250%",
          WebkitMaskSize: "250% 250%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: sheenPos,
          WebkitMaskPosition: sheenPos,
        }}
      >
        {text}
      </motion.span>
    </span>
  );
}

type SectionLabelProps = {
  /** Section index, shown as a giant outlined numeral. */
  index: string;
  /** Short caption above the index, e.g., "About" or "Selected Work". */
  caption: string;
  /** Side of the section the label clings to. */
  align?: "left" | "right";
  /** Optional override for the vertical anchor — default top-12. */
  className?: string;
};

/**
 * Big floating section marker — a huge reflective numeral that parallax-drifts
 * behind content while the section is on screen, plus a small caption. The
 * numeral's stroke lights up and catches a sweeping sheen as you scroll (see
 * {@link ReflectiveGlyph}). Decorative; aria-hidden.
 */
export default function SectionLabel({
  index,
  caption,
  align = "left",
  className = "",
}: SectionLabelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Entry-only progress: 0 when the section's top first enters the bottom of the
  // viewport, 1 when that top reaches the top of the viewport. Unlike the full
  // scroll-through above this is independent of section height, so a fixed range
  // on it always means the same amount of the section is on screen. We use it to
  // top off the numeral's reveal just as the section nearly fills the viewport.
  const { scrollYProgress: entryProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  });

  // Numeral drifts upward as you scroll through the section.
  const numeralY = useTransform(scrollYProgress, [0, 1], ["12%", "-32%"]);
  const numeralOpacity = useTransform(
    scrollYProgress,
    [0, 0.18, 0.82, 1],
    [0, 1, 1, 0]
  );

  // Caption slides in horizontally; parallax in the opposite direction.
  const captionX = useTransform(
    scrollYProgress,
    [0, 1],
    align === "left" ? ["-30px", "10px"] : ["30px", "-10px"]
  );

  const numeralSize =
    "text-[28vw] leading-none sm:text-[22vw] md:text-[18vw] lg:text-[15vw]";

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Giant numeral — drifts + fades as a unit; the stroke lights up within.
          Offset from its near edge with a font-relative value (so the distance
          stays consistent across breakpoints rather than gapping at large sizes
          and bleeding at small ones). The value is mirrored per side: raising it
          pushes each digit toward its screen edge (left one left, right one
          right); lowering it pulls them toward the center. */}
      <motion.span
        style={{ y: numeralY, opacity: numeralOpacity }}
        className={`absolute top-0 block select-none font-numeral font-bold ${
          align === "left" ? "-left-[0.04em]" : "-right-[0.04em]"
        } ${numeralSize}`}
      >
        {/* Reveal tops off early (0.68 of the entry) so the tube is already
            fully lit when the light-pass's hot core crosses it low on the
            screen — the glint reads over a lit stroke, not an empty ghost. */}
        <ReflectiveGlyph
          text={index}
          progress={scrollYProgress}
          revealProgress={entryProgress}
          revealRange={[0.1, 0.68]}
        />
      </motion.span>

      {/* Small caption sliding in opposite direction. Sits on z-10 above the
          numeral, with a dark halo so it stays legible once the stroke lights
          up behind it — the glow is invisible over the plain dark background and
          only reads where it overlaps the bright outline or crest. */}
      <motion.span
        style={{
          x: captionX,
          textShadow:
            "0 0 10px var(--glyph-halo), 0 1px 3px var(--glyph-halo-soft)",
        }}
        className={`absolute top-12 z-10 ${
          align === "left" ? "left-6 sm:left-10" : "right-6 sm:right-10"
        } text-[10px] uppercase tracking-[0.4em] text-ink-muted`}
      >
        — {caption}
      </motion.span>
    </div>
  );
}
