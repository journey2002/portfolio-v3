"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { usePointer } from "@/components/ui/PointerProvider";
import { useTheme } from "@/components/ui/ThemeProvider";

type GridSpotlightProps = {
  className?: string;
  /** Diameter of the spotlight halo (mask radius), in px. */
  size?: number;
  /** Grid cell size in px — should match the base grid behind. */
  gridSize?: number;
  /** Color of the glowing grid dots. */
  color?: string;
  /** Soft accent halo behind the lit grid dots. */
  halo?: string;
};

/**
 * Cursor-tracked grid glow: a brighter copy of the background grid, revealed
 * only inside a soft radial mask under the mouse. Combined with a faint static
 * base grid behind, it reads like the grid itself is glowing under the cursor.
 *
 * Disabled on touch-only devices and when prefers-reduced-motion is set.
 */
export default function GridSpotlight({
  className = "",
  size = 620,
  gridSize = 80,
  color,
  halo,
}: GridSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pointer = usePointer();
  const { theme } = useTheme();
  // Deeper, denser purple on light so the lit dots read on the warm white.
  const dotColor =
    color ??
    (theme === "light" ? "rgba(124, 58, 237, 0.45)" : "rgba(196, 161, 255, 0.55)");
  const haloColor =
    halo ??
    (theme === "light" ? "rgba(124, 58, 237, 0.12)" : "rgba(168, 85, 247, 0.18)");

  useEffect(() => {
    const el = ref.current;
    if (!el || !pointer || !pointer.enabled) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    const { x, y } = pointer;
    let scheduled = false;
    const flush = () => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--gs-x", `${x.get() - rect.left}px`);
      el.style.setProperty("--gs-y", `${y.get() - rect.top}px`);
      el.style.setProperty("--gs-o", "1");
      scheduled = false;
    };
    // Driven by the shared pointer source; coalesce to one rAF per frame.
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    };
    const unsubX = x.on("change", schedule);
    const unsubY = y.on("change", schedule);
    return () => {
      unsubX();
      unsubY();
    };
  }, [pointer]);

  const mask = `radial-gradient(${size}px circle at var(--gs-x, 50%) var(--gs-y, 50%), black, transparent 72%)`;

  return (
    <div
      ref={ref}
      aria-hidden
      style={
        {
          backgroundImage: [
            `radial-gradient(circle, ${dotColor} 1.2px, transparent 1.7px)`,
            `radial-gradient(${Math.round(size * 0.7)}px circle at var(--gs-x, 50%) var(--gs-y, 50%), ${haloColor}, transparent 70%)`,
          ].join(", "),
          backgroundSize: `${gridSize}px ${gridSize}px, 100% 100%`,
          maskImage: mask,
          WebkitMaskImage: mask,
          opacity: "var(--gs-o, 0)",
          transition: "opacity 700ms ease-out",
          "--gs-x": "50%",
          "--gs-y": "50%",
          "--gs-o": "0",
        } as CSSProperties
      }
      className={`pointer-events-none absolute hidden md:block ${className}`}
    />
  );
}
