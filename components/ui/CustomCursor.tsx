"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { useEffect, useState } from "react";

const SPRING = { stiffness: 150, damping: 20, mass: 0.5 };

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);

  const mouseX = useMotionValue(-200);
  const mouseY = useMotionValue(-200);

  const springX = useSpring(mouseX, SPRING);
  const springY = useSpring(mouseY, SPRING);

  const ringSize = useMotionValue(30);
  const dotSize = useMotionValue(6);

  // Center dot and ring dynamically using their current half-widths
  const dotHalf = useTransform(dotSize, (s) => s / 2);
  const dotX = useTransform(
    [mouseX, dotHalf] as const,
    ([x, h]: number[]) => x - h
  );
  const dotY = useTransform(
    [mouseY, dotHalf] as const,
    ([y, h]: number[]) => y - h
  );
  const ringX = useTransform(
    [springX, ringSize] as const,
    ([x, s]: number[]) => x - s / 2
  );
  const ringY = useTransform(
    [springY, ringSize] as const,
    ([y, s]: number[]) => y - s / 2
  );

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    setEnabled(true);

    // Coalesce mousemove updates to one per frame — fires far less often than
    // the raw event stream and lets the spring catch up smoothly.
    let pendingX = 0;
    let pendingY = 0;
    let rafScheduled = false;
    const flush = () => {
      mouseX.set(pendingX);
      mouseY.set(pendingY);
      rafScheduled = false;
    };
    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(flush);
      }
    };

    const isInteractive = (el: EventTarget | null) =>
      el instanceof Element && !!el.closest("a, button, [data-cursor-hover]");

    const onOver = (e: MouseEvent) => {
      if (isInteractive(e.target)) {
        animate(ringSize, 44, { duration: 0.2, ease: "easeOut" });
        animate(dotSize, 11, { duration: 0.2, ease: "easeOut" });
      }
    };
    const onOut = (e: MouseEvent) => {
      if (isInteractive(e.target)) {
        animate(ringSize, 30, { duration: 0.2, ease: "easeOut" });
        animate(dotSize, 6, { duration: 0.2, ease: "easeOut" });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mouseout", onOut);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
    };
  }, [mouseX, mouseY, ringSize, dotSize]);

  if (!enabled) return null;

  return (
    <>
      {/* Dot — grows on interactive hover. mix-blend-difference inverts the
          color beneath so the dot always reads against any background. */}
      <motion.div
        aria-hidden
        style={{ x: dotX, y: dotY, width: dotSize, height: dotSize }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white mix-blend-difference"
      />
      {/* Ring — spring trail with its indigo glow restored. */}
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY, width: ringSize, height: ringSize }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-indigo-accent/60 shadow-[0_0_16px_3px_rgba(99,102,241,0.35)]"
      />
    </>
  );
}
