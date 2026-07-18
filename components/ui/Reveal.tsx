"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Shared trigger — fires once, just before the element is comfortably on
// screen. Matches the ink-mark cadence in About (DRAW_VIEWPORT).
const VIEWPORT = { once: true, margin: "-12%" } as const;

type RevealLineProps = {
  children: ReactNode;
  /** Entrance delay (s) — stagger successive lines by ~0.14. */
  delay?: number;
  className?: string;
};

/**
 * Headline line entrance: the line rises out of a mask with a slight settle.
 * One RevealLine per headline line; the line itself is usually a
 * `<SplitText className="block" />`.
 *
 * The mask needs overflow-hidden, which would shave descenders (g, y, p) at
 * tight display leading — so the wrapper opens padding for the glyph paint
 * and hands the exact same amount back as negative margin. Zero layout
 * shift, same trick SplitText uses internally for bg-clip-text.
 */
export function RevealLine({
  children,
  delay = 0,
  className = "",
}: RevealLineProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.5, delay }}
        className={`block ${className}`}
      >
        {children}
      </motion.span>
    );
  }

  // The trigger stays on the unclipped wrapper and drives the line through
  // variants: whileInView observes the element it sits on, and the line spends
  // its rest pose translated fully outside the mask — an observer there would
  // read zero intersection and never fire.
  return (
    <motion.span
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      className={`relative block overflow-hidden ${className}`}
      style={{
        padding: "0.1em 0.06em 0.24em",
        margin: "-0.1em -0.06em -0.24em",
      }}
    >
      <motion.span
        variants={{
          hidden: { y: "116%", rotate: 2.2 },
          show: {
            y: "0%",
            rotate: 0,
            transition: { duration: 0.95, ease: EASE, delay },
          },
        }}
        className="block origin-bottom-left"
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

type HandwriteProps = {
  children: ReactNode;
  delay?: number;
  /** Wipe duration (s) — scale with the phrase length. */
  duration?: number;
  className?: string;
};

/**
 * Left-to-right clip wipe for the handwritten (font-hand) marginalia, so a
 * scribble appears the way it would be written rather than fading in as a
 * block. Near-linear ease — pen speed, not UI ease. The clip window
 * overshoots the box on every side so Caveat's swashes never get shaved.
 */
export function Handwrite({
  children,
  delay = 0,
  duration = 0.9,
  className = "",
}: HandwriteProps) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      initial={
        reduced
          ? { opacity: 0 }
          : { opacity: 0, clipPath: "inset(-20% 103% -20% -3%)" }
      }
      whileInView={
        reduced
          ? { opacity: 1 }
          : { opacity: 1, clipPath: "inset(-20% -3% -20% -3%)" }
      }
      viewport={VIEWPORT}
      transition={
        reduced
          ? { duration: 0.5, delay }
          : {
              opacity: { duration: 0.01, delay },
              clipPath: { duration, delay, ease: [0.35, 0.1, 0.5, 0.95] },
            }
      }
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  );
}
