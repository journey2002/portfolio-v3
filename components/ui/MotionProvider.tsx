"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Honours prefers-reduced-motion for every framer-driven animation on the site.
 *
 * The global CSS rule in globals.css only reaches CSS keyframes/transitions —
 * the JS springs and entrance tweens (hero, nav, section reveals) ran at full
 * travel regardless. `reducedMotion="user"` makes framer skip transform and
 * layout animation for those visitors while still crossfading opacity, so
 * content arrives without motion instead of not arriving at all. Components
 * that already branch on useReducedMotion() keep working — the hook reads the
 * same preference.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
