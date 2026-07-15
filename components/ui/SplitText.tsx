"use client";

import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";

type SplitTextProps = {
  text: string;
  /** Tag rendered as the outer container (h1, h2, span...). */
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  /** Delay before the first character animates in. */
  delay?: number;
  /** Time between each character's entry. */
  stagger?: number;
  /** Animate once when mounted (true) or wait for inView (false). */
  immediate?: boolean;
  /** With `immediate`, false holds the hidden pose; flipping to true plays
      the entrance. Lets the page intro release the hero's headline reveal. */
  active?: boolean;
  /** How far each character translates from. */
  fromY?: number;
  /** Optional rotation applied at rest, eased to 0. Adds a touch of life. */
  fromRotate?: number;
  /** Per-word className (useful for color spans on parts of the line). */
  highlightWords?: { word: string; className: string }[];
  /**
   * Applied to each per-character motion span. Needed for effects like
   * `bg-clip-text` gradients, which don't propagate from a parent through
   * the per-char split wrappers.
   */
  charClassName?: string;
};

const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

const charItem = (fromY: number, fromRotate: number): Variants => ({
  hidden: { y: fromY, opacity: 0, rotate: fromRotate, scale: 0.96 },
  show: {
    y: 0,
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const },
  },
});

/**
 * Character-by-character mask reveal. Each glyph rides up from below its own
 * overflow-hidden frame, with rotation easing to zero — so headlines feel
 * like they're settling into place rather than just fading in.
 *
 * Words wrap normally; whitespace between words is preserved as a
 * non-breaking space so the line still wraps where it should.
 */
export default function SplitText({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.025,
  immediate = true,
  active = true,
  fromY = 64,
  fromRotate = 6,
  highlightWords = [],
  charClassName = "",
}: SplitTextProps) {
  const words = useMemo(() => text.split(" "), [text]);

  const highlightMap = useMemo(() => {
    const map = new Map<string, string>();
    highlightWords.forEach(({ word, className }) => map.set(word, className));
    return map;
  }, [highlightWords]);

  const MotionTag = motion[Tag] as typeof motion.span;

  return (
    <MotionTag
      variants={container(stagger, delay)}
      initial="hidden"
      animate={immediate ? (active ? "show" : "hidden") : undefined}
      whileInView={immediate ? undefined : "show"}
      viewport={immediate ? undefined : { once: true, margin: "-15%" }}
      // Default to inline-block so SplitText can be used inline within a
      // sentence; callers pass `block` (or similar) via className to override.
      className={className.includes("block") ? className : `inline-block ${className}`}
      aria-label={text}
    >
      {words.map((word, wi) => {
        const wordClass = highlightMap.get(word) ?? "";
        return (
          <span
            key={wi}
            className={`inline-block whitespace-nowrap ${wordClass}`}
            aria-hidden
          >
            {Array.from(word).map((char, ci) => (
              <span
                key={ci}
                className="relative inline-block overflow-hidden align-baseline"
                // The reveal mask (overflow-hidden) clips each glyph to its own
                // frame. With only a hairline of bottom room, descenders (g, y,
                // p) get sheared off at the baseline. Extend the clip box down
                // with paddingBottom, then cancel that exact height with a
                // negative marginBottom so the frame's margin box — and thus the
                // baseline and line spacing — stay unchanged. Net effect: only
                // the descender clearance grows (below-baseline extension held
                // at the original 0.08em: 0.26 − 0.18).
                style={{ paddingBottom: "0.26em", marginBottom: "-0.18em" }}
              >
                {/* No hardcoded will-change here: framer manages it during the
                    entrance, and a permanent hint would pin every glyph in its
                    own GPU layer for the lifetime of the page. */}
                <motion.span
                  variants={charItem(fromY, fromRotate)}
                  className={`inline-block ${charClassName}`}
                >
                  {char}
                </motion.span>
              </span>
            ))}
            {/* preserve inter-word spacing */}
            {wi < words.length - 1 && (
              <span aria-hidden className="inline-block">
                &nbsp;
              </span>
            )}
          </span>
        );
      })}
    </MotionTag>
  );
}
