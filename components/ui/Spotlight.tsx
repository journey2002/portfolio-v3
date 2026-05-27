"use client";

import { useEffect, useRef, type CSSProperties } from "react";

type SpotlightProps = {
  className?: string;
  /** Diameter of the spotlight halo, in px. */
  size?: number;
  /** Gradient stops — keep alpha low for "subtle". */
  color1?: string;
  color2?: string;
};

/**
 * Cursor-tracking radial gradient layered behind content. Renders inside the
 * positioned parent (absolute inset-0). The cursor coords are converted to
 * element-local space via the parent's bounding rect so the halo lands under
 * the mouse, even inside a non-fullscreen section.
 *
 * Disabled on touch-only devices and when prefers-reduced-motion is set —
 * the halo never fades in, so it's effectively invisible.
 */
export default function Spotlight({
  className = "",
  size = 600,
  color1 = "rgba(99,102,241,0.22)",
  color2 = "rgba(168,85,247,0.08)",
}: SpotlightProps) {
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
      el.style.setProperty("--sp-x", `${pendingX - rect.left}px`);
      el.style.setProperty("--sp-y", `${pendingY - rect.top}px`);
      el.style.setProperty("--sp-o", "1");
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

  return (
    <div
      ref={ref}
      aria-hidden
      style={
        {
          background: `radial-gradient(${size}px circle at var(--sp-x, 50%) var(--sp-y, 50%), ${color1}, ${color2} 40%, transparent 70%)`,
          opacity: "var(--sp-o, 0)",
          transition: "opacity 700ms ease-out",
          "--sp-x": "50%",
          "--sp-y": "50%",
          "--sp-o": "0",
        } as CSSProperties
      }
      className={`pointer-events-none absolute inset-0 hidden md:block ${className}`}
    />
  );
}
