"use client";

import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useMotionValue,
  type MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
   * Optional separate progress that drives the light-pass. Defaults to
   * `progress`. Prefer an entry-based signal for tall sections so the glint
   * still crosses while the numeral is on screen.
   */
  sheenProgress?: MotionValue<number>;
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
 *   4. sheen  — a wide near-white light streak with a white-hot bloom
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
  sheenProgress,
  sheenRange = [0.03, 0.55],
}: ReflectiveGlyphProps) {
  // Flood and sheen can each track a different progress than the base (e.g.
  // entry into view rather than the section's full scroll-through).
  const floodProgress = revealProgress ?? progress;
  const lightProgress = sheenProgress ?? progress;

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
  // SectionLabel drives this from entry progress so tall sections (Work) still
  // get the glint while the numeral is on screen. Travel (130% → -30%) just
  // clears the glyph on each side — pairing that short span with the sheenRange
  // window is what makes the pass move slowly instead of flashing through.
  const sheenPos = useTransform(lightProgress, sheenRange, [
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
          across the lit tube, bloomed so it reads as a reflection travelling
          over glass. Mobile Safari/Chrome refuse to composite clip-path + mask
          + filter + blend stacked on ONE element (the layer simply doesn't
          paint), so each effect gets its own box: outer = waterline clip,
          middle = bloom filter, inner = band mask on the stroke. The screen
          blend is dropped rather than re-homed — a 0.95-alpha white stroke
          over the lit accent stroke reads the same under normal compositing,
          and blend was the least mobile-safe piece of the stack. */}
      <motion.span
        className="absolute inset-0 block"
        style={{ clipPath: floodClip, WebkitClipPath: floodClip }}
      >
        <span className="block" style={{ filter: sheenGlow }}>
          <motion.span
            className="block"
            style={{
              WebkitTextStrokeWidth: "3.5px",
              WebkitTextStrokeColor: "rgba(255,255,255,0.95)",
              color: "transparent",
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
      </motion.span>
    </span>
  );
}

// Numeral fade-in is still keyed to full scroll-through, so on a very tall
// section (Work ~5 viewports) the 0→1 opacity ramp would finish long after
// the mark is on screen. Past this window length the fade is compressed;
// shorter sections divide out to 1 and keep their original timing. (Sheen no
// longer needs this — it rides entry progress, one viewport of travel.)
const TIMING_REFERENCE_WINDOW = 3.5;

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

  // 1 for every section short enough to animate correctly on its own, and below
  // 1 only for the outliers tall enough to stall (see TIMING_REFERENCE_WINDOW).
  // This box is `inset-0` on its section, so its own height is the section's.
  const [timingScale, setTimingScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const vh = window.innerHeight;
      if (!vh) return;
      const span = el.offsetHeight + vh;
      setTimingScale(Math.min(1, (TIMING_REFERENCE_WINDOW * vh) / span));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Numeral drifts upward as you scroll through the section.
  const numeralY = useTransform(scrollYProgress, [0, 1], ["12%", "-32%"]);
  const numeralOpacity = useTransform(
    scrollYProgress,
    [0, 0.18 * timingScale, 0.82, 1],
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
          and bleeding at small ones). The two sides deliberately don't mirror,
          because the sidebearing each one eats into isn't symmetric: every index
          leads with "0", whose 0.047em left bearing swallows -0.04em and lands
          the ink flush with the edge, but the trailing digits vary and "4"
          carries only 0.016em — the mirrored negative pushed its stroke past
          this box's overflow clip and sheared the numeral. So the right side
          insets instead, and by a flat px rather than an em: what it has to
          clear is half the text-stroke, which is itself a constant width, so an
          em value would over-inset the large breakpoints and still pinch the
          small ones. 1px is about as tight as this goes — at 28vw it leaves the
          "4" under a pixel of air, so lowering it further starts shaving the
          stroke on phones again. Raising either value pulls that digit toward
          the center; lowering it drives it into the clip. */}
      <motion.span
        style={{ y: numeralY, opacity: numeralOpacity }}
        className={`absolute top-0 block select-none font-numeral font-bold ${
          align === "left" ? "-left-[0.04em]" : "right-[1px]"
        } ${numeralSize}`}
      >
        {/* Reveal tops off early (0.68 of entry) so the tube is already lit
            when the light-pass crosses. Sheen is also entry-driven: full
            scroll-through progress stretched Work's glint so late the numeral
            had already left the frame. Entry progress is one viewport of
            travel regardless of section height, so the reflection lands while
            "02" is still the focal mark. Window starts mid-flood so the hot
            core rides a mostly-lit stroke. */}
        <ReflectiveGlyph
          text={index}
          progress={scrollYProgress}
          revealProgress={entryProgress}
          revealRange={[0.1, 0.68]}
          sheenProgress={entryProgress}
          sheenRange={[0.38, 0.92]}
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
