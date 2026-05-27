"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from "framer-motion";
import { useEffect, type ReactNode } from "react";

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
 * Tracks the cursor's distance from viewport centre and translates the wrapped
 * element by a fraction of that — gives backgrounds and decorative layers a
 * dragging-glass feel without needing per-element listeners.
 */
export default function MouseParallax({
  children,
  strength = 24,
  follow = false,
  className = "",
  style,
}: MouseParallaxProps) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const springX = useSpring(mx, { stiffness: 60, damping: 18, mass: 0.6 });
  const springY = useSpring(my, { stiffness: 60, damping: 18, mass: 0.6 });

  const sign = follow ? 1 : -1;
  const x = useTransform(springX, (v) => v * strength * sign);
  const y = useTransform(springY, (v) => v * strength * sign);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    let pendingX = 0;
    let pendingY = 0;
    let scheduled = false;
    const flush = () => {
      mx.set(pendingX);
      my.set(pendingY);
      scheduled = false;
    };
    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX / window.innerWidth - 0.5;
      pendingY = e.clientY / window.innerHeight - 0.5;
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <motion.div style={{ x, y, ...style }} className={className}>
      {children}
    </motion.div>
  );
}
