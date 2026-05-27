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
      animate={immediate ? "show" : undefined}
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
                style={{ paddingBottom: "0.08em" }}
              >
                <motion.span
                  variants={charItem(fromY, fromRotate)}
                  className={`inline-block ${charClassName}`}
                  style={{ willChange: "transform, opacity" }}
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
