"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  animate,
} from "framer-motion";
import { type ReactNode } from "react";

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

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rawX.set(Math.max(-strength, Math.min(strength, (e.clientX - cx) * 0.4)));
    rawY.set(Math.max(-strength, Math.min(strength, (e.clientY - cy) * 0.4)));
  };

  const handleLeave = () => {
    animate(rawX, 0, { type: "spring", ...SPRING });
    animate(rawY, 0, { type: "spring", ...SPRING });
  };

  if (glow) {
    const glowMotionProps = {
      style: { x, y },
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
    // `overflow-hidden` alone doesn't reliably clip the gradient to the pill:
    // the parent's `will-change: transform` promotes this to its own GPU layer,
    // and Chromium's rounded-rect overflow clip leaves a few stray pixels of the
    // background bleeding out at the caps' 3-/9-o'clock extremes — small nubs on
    // the button's left/right edges. A `clip-path` pill is rasterised accurately
    // on the composited layer, so it trims those nubs (rest and mid-magnetic).
    const glowEl = (
      <span
        className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-white/10 bg-accent-gradient-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-[filter] duration-300 [clip-path:inset(0_round_9999px)] group-hover:brightness-110 ${className}`}
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
          className="btn-glow-halo group relative inline-flex rounded-full will-change-transform"
        >
          {glowEl}
        </motion.a>
      );
    }
    return (
      <motion.button
        type="button"
        {...glowMotionProps}
        className="btn-glow-halo group relative inline-flex rounded-full will-change-transform"
      >
        {glowEl}
      </motion.button>
    );
  }

  // Default (no glow)
  const motionProps = {
    style: { x, y },
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
