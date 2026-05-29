"use client";

import { motion, useMotionValue, useTransform, type MotionStyle } from "framer-motion";
import { type ReactNode } from "react";
import { usePointer } from "@/components/ui/PointerProvider";

type MouseParallaxProps = {
  children: ReactNode;
  /** Max travel (in px) at the corners of the viewport. */
  strength?: number;
  /** Invert direction — true means element moves WITH the cursor. */
  follow?: boolean;
  className?: string;
  style?: MotionStyle;
};

/**
 * Translates the wrapped element by a fraction of the cursor's distance from
 * viewport centre — a dragging-glass feel for backgrounds and decorative layers.
 *
 * The normalised, spring-smoothed pointer position comes from the shared
 * PointerProvider (one listener / one spring for the whole page) rather than a
 * per-instance listener + spring. Each layer just scales that shared value by
 * its own `strength` and direction, so the motion is identical to before.
 */
export default function MouseParallax({
  children,
  strength = 24,
  follow = false,
  className = "",
  style,
}: MouseParallaxProps) {
  const pointer = usePointer();
  // Hooks must run unconditionally; fall back to a static 0 if (somehow) used
  // outside the provider, which yields no movement — the touch-device default.
  const fallback = useMotionValue(0);
  const sx = pointer?.snx ?? fallback;
  const sy = pointer?.sny ?? fallback;

  const sign = follow ? 1 : -1;
  const x = useTransform(sx, (v) => v * strength * sign);
  const y = useTransform(sy, (v) => v * strength * sign);

  return (
    <motion.div style={{ x, y, ...style }} className={className}>
      {children}
    </motion.div>
  );
}
