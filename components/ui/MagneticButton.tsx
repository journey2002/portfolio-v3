"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  animate,
} from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";

type MagneticButtonProps = {
  children: ReactNode;
  href?: string;
  className?: string;
  strength?: number;
  onClick?: () => void;
  /** Renders the primary "filled" variant — gradient surface with a soft hover halo. */
  glow?: boolean;
};

const SPRING = { stiffness: 280, damping: 18, mass: 0.5 };

export default function MagneticButton({
  children,
  href,
  className = "",
  strength = 14,
  onClick,
  glow = false,
}: MagneticButtonProps) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING);
  const y = useSpring(rawY, SPRING);

  // Centre of the button, measured once per hover instead of per mousemove.
  // Reading it inside the move handler forced a layout on every event; the
  // button can't move under a stationary cursor mid-hover, so the entry
  // measurement stays correct for the whole gesture. A scroll during the hover
  // clears it, and the next move re-measures.
  const centre = useRef<{ x: number; y: number } | null>(null);

  const measure = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    centre.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    return centre.current;
  };

  useEffect(() => {
    const invalidate = () => {
      centre.current = null;
    };
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    return () => {
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
    };
  }, []);

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    measure(e.currentTarget);
  };

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const c = centre.current ?? measure(e.currentTarget);
    rawX.set(Math.max(-strength, Math.min(strength, (e.clientX - c.x) * 0.4)));
    rawY.set(Math.max(-strength, Math.min(strength, (e.clientY - c.y) * 0.4)));
  };

  const handleLeave = () => {
    centre.current = null;
    animate(rawX, 0, { type: "spring", ...SPRING });
    animate(rawY, 0, { type: "spring", ...SPRING });
  };

  if (glow) {
    const glowMotionProps = {
      style: { x, y },
      onMouseEnter: handleEnter,
      onMouseMove: handleMove,
      onMouseLeave: handleLeave,
      whileTap: { scale: 0.97 },
      transition: { type: "spring" as const, stiffness: 340, damping: 26 },
      onClick,
    };

    // Themed drop-shadow halo via the `.btn-glow-halo` class (globals.css): two
    // pseudo-element shadow layers tinted from --btn-glow / -hover (the accent's
    // mid hue), crossfaded on hover by opacity. The tint lives entirely in CSS so
    // it retints the instant the accent swaps — no JS. Driving it through framer's
    // `animate`, or a transitioned var-composed box-shadow, both proved unreliable:
    // the shadow kept a stale accent colour when the accent changed at rest.
    //
    // `bg-origin-border` is load-bearing. Once an element has a border, a gradient
    // background is sized to the PADDING box (background-origin's default) but
    // still painted across the BORDER box, and background-repeat fills the 1px
    // ring left over with the wrapped end of the gradient — so the border carries
    // a sliver of the first stop hard against the last: emerald down the blue
    // right cap, blue down the emerald left cap. It's worst at the caps'
    // 3-/9-o'clock extremes, the only place that ring runs vertically for a few
    // pixels instead of turning, which is why it read as a pair of small nubs.
    // Sizing the tile to the border box leaves no ring to wrap into.
    //
    // It looks like a clipping fault and isn't — the stray pixels are INSIDE the
    // pill's silhouette. That's why the `clip-path: inset(0 round 9999px)` pill
    // that used to sit here never touched them; it's gone rather than left in as
    // cargo. Same for `will-change: transform` on the wrapper: it bought nothing
    // but a permanent compositor layer, and framer writes `transform` per frame
    // anyway, which Chromium promotes for the duration of the movement.
    const glowEl = (
      <span
        className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-accent-gradient-3 bg-origin-border shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter] duration-300 group-hover:brightness-110 ${className}`}
      >
        {/* Subtle top sheen — keeps it from feeling flat without being noisy */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.22] to-transparent"
        />
        <span className="relative inline-flex items-center gap-2">{children}</span>
      </span>
    );

    if (href) {
      return (
        <motion.a
          href={href}
          {...glowMotionProps}
          className="btn-glow-halo group relative inline-flex rounded-full"
        >
          {glowEl}
        </motion.a>
      );
    }
    return (
      <motion.button
        type="button"
        {...glowMotionProps}
        className="btn-glow-halo group relative inline-flex rounded-full"
      >
        {glowEl}
      </motion.button>
    );
  }

  // Default (no glow)
  const motionProps = {
    style: { x, y },
    onMouseEnter: handleEnter,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring" as const, stiffness: 400, damping: 22 },
    onClick,
  };

  const shared = {
    ...motionProps,
    className: `inline-flex items-center gap-2 will-change-transform ${className}`,
  } as const;

  if (href) {
    return (
      <motion.a href={href} {...shared}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button type="button" {...shared}>
      {children}
    </motion.button>
  );
}
