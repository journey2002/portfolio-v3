"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Brief on-load overlay. Shows the initials WS and a tiny counter that ticks
 * to 100, then wipes upward in two stacked panels to reveal the page below.
 *
 * Sits at z-[100] above everything, sets a body data-attr so the rest of the
 * page can choose to hold its entry animation until the intro lifts.
 *
 * Skipped entirely when prefers-reduced-motion is set.
 */
export default function PageIntro() {
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(0);
  const [skip, setSkip] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Only show once per session — refreshes feel snappy after the first view.
    const seen = sessionStorage.getItem("intro-seen") === "1";

    if (reduce || seen) {
      setSkip(true);
      document.body.dataset.introState = "done";
      return;
    }

    document.body.dataset.introState = "playing";

    // Tick a counter to 100 in ~1.2s — quick enough to feel like a launch, not a wait.
    const start = performance.now();
    const duration = 1200;
    let rafId: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setCount(Math.round(p * 100));
      if (p < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    // Hide overlay shortly after the counter completes.
    const exitTimer = window.setTimeout(() => {
      setDone(true);
      document.body.dataset.introState = "done";
      sessionStorage.setItem("intro-seen", "1");
    }, duration + 250);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(exitTimer);
    };
  }, []);

  if (skip) return null;

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="page-intro"
          className="pointer-events-none fixed inset-0 z-[100]"
          initial={false}
          // Two stacked panels wipe up in a staggered split for a curtain feel.
        >
          {/* Top half */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.95, ease: [0.76, 0, 0.24, 1] as const }}
            className="absolute inset-x-0 top-0 h-1/2 bg-[rgb(var(--canvas))]"
          />
          {/* Bottom half — slightly delayed so it reads as two doors parting */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.95,
              delay: 0.05,
              ease: [0.76, 0, 0.24, 1] as const,
            }}
            className="absolute inset-x-0 bottom-0 h-1/2 bg-[rgb(var(--canvas))]"
          />

          {/* Centerpiece — initials + counter */}
          <motion.div
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative flex flex-col items-center">
              {/* Tiny line drawing under the initials */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }}
                className="absolute -bottom-6 left-1/2 h-px w-32 origin-left -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent"
              />

              <div className="flex items-baseline gap-3 font-serif text-ink-strong">
                {/* Initials reveal letter by letter */}
                {["W", "S"].map((letter, i) => (
                  <span
                    key={letter}
                    className="relative inline-block overflow-hidden"
                    style={{ paddingBottom: "0.1em" }}
                  >
                    <motion.span
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      transition={{
                        duration: 0.7,
                        delay: 0.1 + i * 0.07,
                        ease: [0.16, 1, 0.3, 1] as const,
                      }}
                      className="inline-block text-7xl font-bold leading-none tracking-tight sm:text-8xl"
                    >
                      {letter}
                    </motion.span>
                  </span>
                ))}
              </div>

              {/* Counter */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="absolute -right-12 top-0 font-serif text-xs tabular-nums tracking-widest text-ink-subtle sm:-right-16"
              >
                {String(count).padStart(3, "0")}
              </motion.span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
