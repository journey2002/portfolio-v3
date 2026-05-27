"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

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
 * Big floating section marker — a huge outlined numeral that parallax-drifts
 * behind content while the section is on screen, plus a small label.
 * Decorative; aria-hidden.
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

  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Giant outlined numeral */}
      <motion.span
        style={{ y: numeralY, opacity: numeralOpacity }}
        className={`absolute top-0 select-none font-serif font-bold leading-none ${
          align === "left" ? "-left-2 sm:-left-4" : "-right-2 sm:-right-4"
        } text-[28vw] sm:text-[22vw] md:text-[18vw] lg:text-[15vw]`}
      >
        <span
          className="block"
          style={{
            WebkitTextStroke: "1px rgba(255,255,255,0.045)",
            color: "transparent",
          }}
        >
          {index}
        </span>
      </motion.span>

      {/* Small caption sliding in opposite direction */}
      <motion.span
        style={{ x: captionX }}
        className={`absolute top-12 ${
          align === "left" ? "left-6 sm:left-10" : "right-6 sm:right-10"
        } text-[10px] uppercase tracking-[0.4em] text-neutral-600`}
      >
        — {caption}
      </motion.span>
    </div>
  );
}
