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

// Static diagonal band used as the sheen mask — only its position animates.
const SHEEN_BAND =
  "linear-gradient(115deg, transparent 43%, #000 50%, transparent 57%)";

type ReflectiveGlyphProps = {
  /** Glyph(s) to render — a numeral like "02" or a short mark like "CV". */
  text: string;
  /** Scroll progress (0→1) that drives the color shift and sheen. */
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
  /** Progress window over which the reflective sheen sweeps across. */
  sheenRange?: [number, number];
};

/**
 * A huge hollow glyph whose *stroke* lights up and catches a moving reflection
 * as `progress` advances. Four pixel-aligned layers share the same text/size:
 *   1. ghost  — a faint always-on outline (the empty vessel)
 *   2. flood  — a colored stroke revealed bottom-up, fading white → indigo
 *   3. crest  — a near-white band tracing the rising waterline
 *   4. sheen  — a screen-blended diagonal glint that sweeps across
 *
 * Reveal + crest are clip-path driven (compositor-friendly); the sheen animates
 * mask-position. Inherits font-size/weight from its parent. Decorative.
 */
export function ReflectiveGlyph({
  text,
  progress,
  revealRange,
  revealProgress,
  sheenRange = [0.05, 0.55],
}: ReflectiveGlyphProps) {
  // The flood can track a different progress than the sheen (e.g. the section's
  // entry into view rather than its full scroll-through).
  const floodProgress = revealProgress ?? progress;

  // With a reveal window the waterline retreats 100% → 0% across it; without
  // one the glyph stays full and only the sheen moves.
  const range = revealRange ?? [0, 1];
  const floodTopDynamic = useTransform(floodProgress, range, [100, 0]);
  const floodTopStatic = useMotionValue(0);
  const floodTop = revealRange ? floodTopDynamic : floodTopStatic;

  // Stroke cools from a subtle white into indigo over the first ~2/3 of the
  // reveal; a static glyph just sits at indigo.
  const colorEnd = range[0] + (range[1] - range[0]) * 0.65;
  const floodStrokeDynamic = useTransform(
    floodProgress,
    [range[0], colorEnd],
    ["rgba(255,255,255,0.55)", "#6366f1"]
  );
  const floodStroke: MotionValue<string> | string = revealRange
    ? floodStrokeDynamic
    : "#6366f1";

  const floodClip = useMotionTemplate`inset(${floodTop}% 0% 0% 0%)`;
  // Crest: a ~3%-tall band sitting exactly at the waterline; collapses to
  // nothing while empty.
  const crestBottom = useTransform(floodTop, (v) => Math.max(0, 97 - v));
  const crestClip = useMotionTemplate`inset(${floodTop}% 0% ${crestBottom}% 0%)`;

  // Reflective sheen — only the mask position animates; the band shape is static
  // and the highlight is gated to the revealed area via the same waterline clip.
  const sheenPos = useTransform(progress, sheenRange, [
    "160% 160%",
    "-60% -60%",
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

      {/* Colored stroke — lights up bottom-up, fading white → indigo. */}
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

      {/* Reflective sheen — a diagonal glint sweeping across, screen-blended so
          it reads as a moving specular highlight. */}
      <motion.span
        className="absolute inset-0 block"
        style={{
          clipPath: floodClip,
          WebkitClipPath: floodClip,
          WebkitTextStrokeWidth: "3px",
          WebkitTextStrokeColor: "rgba(255,255,255,0.92)",
          color: "transparent",
          opacity: 0.8,
          mixBlendMode: "screen",
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
        className={`absolute top-0 block select-none font-serif font-bold ${
          align === "left" ? "-left-[0.04em]" : "-right-[0.04em]"
        } ${numeralSize}`}
      >
        <ReflectiveGlyph
          text={index}
          progress={scrollYProgress}
          revealProgress={entryProgress}
          revealRange={[0.12, 0.96]}
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
