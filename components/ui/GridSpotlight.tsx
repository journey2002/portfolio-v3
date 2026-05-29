"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type GridSpotlightProps = {
  className?: string;
  /** Diameter of the spotlight halo (mask radius), in px. */
  size?: number;
  /** Grid cell size in px — should match the base grid behind. */
  gridSize?: number;
  /** Color of the glowing grid lines. */
  color?: string;
  /** Soft accent halo behind the lit grid lines. */
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
  color = "rgba(196, 161, 255, 0.55)",
  halo = "rgba(168, 85, 247, 0.18)",
}: GridSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!mq.matches || reduce) return;

    let pendingX = 0;
    let pendingY = 0;
    let scheduled = false;
    const flush = () => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--gs-x", `${pendingX - rect.left}px`);
      el.style.setProperty("--gs-y", `${pendingY - rect.top}px`);
      el.style.setProperty("--gs-o", "1");
      scheduled = false;
    };
    const onMove = (e: MouseEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const mask = `radial-gradient(${size}px circle at var(--gs-x, 50%) var(--gs-y, 50%), black, transparent 72%)`;

  return (
    <div
      ref={ref}
      aria-hidden
      style={
        {
          backgroundImage: [
            `linear-gradient(to right, ${color} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
            `radial-gradient(${Math.round(size * 0.7)}px circle at var(--gs-x, 50%) var(--gs-y, 50%), ${halo}, transparent 70%)`,
          ].join(", "),
          backgroundSize: `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, 100% 100%`,
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
