"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { memo } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";

/**
 * Dark/light theme switch. A compact icon pill that shows the CURRENT theme's
 * glyph (moon = dark, sun = light) and spin-swaps it when toggled, with a soft
 * accent halo on hover — sized and styled to sit beside the nav CTA. Reduced
 * motion drops the spin to a plain cross-fade.
 */
function ThemeToggleBase({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={isLight ? "Switch to dark theme" : "Switch to light theme"}
      data-cursor-hover
      onClick={toggle}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`group relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline bg-glass transition-colors hover:border-indigo-accent/40 ${className}`}
    >
      {/* Accent glow blooms on hover, matching the section menu button. */}
      <span className="pointer-events-none absolute -inset-px rounded-full bg-accent-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-30" />
      <span className="relative h-4 w-4">
        {/* Brand gradient shared by both glyphs so the toggle matches the
            planet logo + menu icon instead of reading as a flat grey glyph.
            Defined once in a 0×0 svg and referenced by url(); userSpaceOnUse
            maps it to each icon's own 24×24 viewBox. */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <defs>
            <linearGradient
              id="theme-grad"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="24"
              y2="24"
            >
              <stop offset="0%" stopColor="var(--accent-glow-1)" />
              <stop offset="100%" stopColor="var(--accent-glow-2)" />
            </linearGradient>
          </defs>
        </svg>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={theme}
            initial={reduce ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : { rotate: 90, scale: 0.4, opacity: 0 }
            }
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 grid place-items-center transition-[filter] group-hover:brightness-110"
          >
            {isLight ? (
              <Sun className="h-4 w-4" strokeWidth={1.75} stroke="url(#theme-grad)" />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.75} stroke="url(#theme-grad)" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

const ThemeToggle = memo(ThemeToggleBase);
export default ThemeToggle;
