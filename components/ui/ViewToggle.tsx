"use client";

import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { LayoutGrid, List } from "lucide-react";
import { memo, useEffect } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";

export type WorkView = "index" | "gallery";

/**
 * Segmented switch that morphs the Selected Work section between the editorial
 * "index" (a hover-revealed list) and the "gallery" (a grid of cover tiles).
 *
 * A single click fires a coordinated little burst: the knob slides with a
 * speed-based squash-and-stretch and lights up, the icon spins as it swaps, the
 * label rolls like an odometer, the track tints, the whole pill presses in, and
 * a ring ripples out. Memoised so it only re-renders (and re-plays) on a real
 * view change — not on every parent hover.
 */
function ViewToggleBase({
  view,
  onChange,
}: {
  view: WorkView;
  onChange: (view: WorkView) => void;
}) {
  const isGallery = view === "gallery";
  const { theme } = useTheme();
  // The "off" (index) track reads as a neutral groove in EACH theme: a dark
  // slate on the dark UI, a light slate on the warm-white page. A fixed dark
  // grey here looked like a leftover dark-theme element once the page went
  // light. framer animates backgroundColor, so we feed it a concrete colour
  // per theme rather than a CSS var it can't interpolate.
  const offTrack =
    theme === "light" ? "rgba(212,212,216,1)" : "rgba(82,82,82,1)";

  // Knob position is a motion value so we can derive a squash from its speed:
  // the faster it travels, the more it stretches along X, then it settles.
  const x = useMotionValue(0);
  useEffect(() => {
    const controls = animate(x, isGallery ? 16 : 0, {
      type: "spring",
      stiffness: 520,
      damping: 30,
    });
    return controls.stop;
  }, [isGallery, x]);

  const xVelocity = useVelocity(x);
  const stretch = useTransform(xVelocity, [-450, 0, 450], [1.7, 1, 1.7]);
  const scaleX = useSpring(stretch, { stiffness: 400, damping: 26 });
  // Conserve volume — squashing X pinches Y, so the knob reads like jelly.
  const scaleY = useTransform(scaleX, (s) => 1 / Math.max(s, 0.5));

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={isGallery}
      aria-label="Switch between index and gallery layouts"
      data-cursor-hover
      onClick={() => onChange(isGallery ? "index" : "gallery")}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="group relative flex shrink-0 items-center gap-3 rounded-full border border-hairline bg-surface/60 px-4 py-2 text-xs uppercase tracking-wider text-ink-muted transition-colors hover:border-indigo-accent/40 hover:text-ink"
    >
      {/* Ring ripple — remounts on each view change and pulses outward. */}
      <motion.span
        key={view}
        aria-hidden
        initial={{ opacity: 0.5, scale: 0.85 }}
        animate={{ opacity: 0, scale: 1.45 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 rounded-full border border-indigo-accent/60"
      />

      {/* Icon — spins and scales as it swaps. */}
      <span className="relative h-3.5 w-3.5">
        <AnimatePresence initial={false}>
          <motion.span
            key={view}
            initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {isGallery ? (
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <List className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
          </motion.span>
        </AnimatePresence>
      </span>

      {/* Label — rolls vertically like an odometer. Fixed width so the pill
          doesn't jump as the word changes. */}
      <span className="relative hidden h-4 w-[3.75rem] overflow-hidden text-left sm:block">
        <AnimatePresence initial={false}>
          <motion.span
            key={view}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-110%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 leading-4"
          >
            {isGallery ? "Gallery" : "Index"}
          </motion.span>
        </AnimatePresence>
      </span>

      {/* Track — tints toward indigo when on. */}
      <motion.span
        className="relative h-5 w-9 rounded-full"
        animate={{
          backgroundColor: isGallery ? "rgba(99,102,241,0.45)" : offTrack,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Knob — gradient fill, speed-squash, and an accent glow when on. */}
        <motion.span
          style={{ x, scaleX, scaleY }}
          animate={{
            boxShadow: isGallery
              ? "0 0 12px 2px rgba(99,102,241,0.65)"
              : "0 0 0px 0px rgba(99,102,241,0)",
          }}
          transition={{ duration: 0.3 }}
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-accent-gradient"
        />
      </motion.span>
    </motion.button>
  );
}

const ViewToggle = memo(ViewToggleBase);
export default ViewToggle;
