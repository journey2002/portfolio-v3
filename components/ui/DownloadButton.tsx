"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Download } from "lucide-react";

/**
 * Download CTA with quick, honest feedback: clicking starts the real browser
 * download (the anchor's default), the arrow drops out of the circle like the
 * file saving down, a check draws in its place, and the label quietly reads
 * "Saved" for a moment before the button resets — the arrow re-entering from
 * the top, completing the loop. No fake progress; the download is instant.
 *
 * Deliberate choices:
 * - The pill never collapses or changes width — the rest label stays in flow
 *   and the confirmation overlays it, so the CTA row doesn't reflow.
 * - Every accent surface reads from the live gradient/accent tokens, so the
 *   button retints instantly with the accent switcher.
 */

type Phase = "idle" | "done";

/** How long the "saved" state lingers before the button resets. */
const DONE_MS = 1600;

type DownloadButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function DownloadButton({
  href,
  label = "Download PDF",
  className = "",
}: DownloadButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  // Distinguishes first render from post-save resets, so the arrow's
  // top-entry keyframes never play on mount.
  const [hasSaved, setHasSaved] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // A click mid-confirmation would restart the browser download; swallow it.
    if (phase !== "idle") {
      e.preventDefault();
      return;
    }
    // Don't preventDefault here — the anchor's default IS the download.
    setPhase("done");
    setHasSaved(true);
    timer.current = window.setTimeout(() => setPhase("idle"), DONE_MS);
  };

  return (
    <motion.a
      href={href}
      download
      data-cursor-hover
      aria-label="Download résumé (PDF)"
      onClick={handleClick}
      whileTap={{ scale: 0.96 }}
      className={`group relative inline-flex items-center gap-2.5 rounded-full border bg-surface/50 p-[5px] pr-5 backdrop-blur transition-colors duration-300 ${
        phase === "idle"
          ? "border-hairline hover:border-indigo-accent/40"
          : "border-indigo-accent/40"
      } ${className}`}
    >
      {/* Circle assembly — plain wrapper so positioning classes never sit on
          an animated element (framer drops Tailwind transforms). */}
      <span className="relative h-[38px] w-[38px] shrink-0">
        {/* bg-origin-border for the same reason as the primary button: with a
            border in play the gradient is sized to the padding box but painted
            across the border box, and the 1px ring left over repeats the wrapped
            end of the gradient onto the rim. (The overflow clip here is real —
            the arrow animates out of the circle and is meant to be cut off.) */}
        <span className="absolute inset-0 overflow-hidden rounded-full border border-white/10 bg-accent-gradient bg-origin-border">
          {/* Arrow — drops out the bottom on save, re-enters from the top on
              reset. ±28px clears the 38px circle, so the teleport between the
              two happens fully clipped. */}
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={false}
            animate={
              phase === "done"
                ? { y: reduce ? 0 : 28, opacity: 0 }
                : hasSaved && !reduce
                  ? { y: [-28, 0], opacity: [0, 1] }
                  : { y: 0, opacity: 1 }
            }
            transition={
              phase === "done"
                ? { duration: 0.25, ease: "easeIn" }
                : { duration: 0.3, ease: "easeOut", delay: 0.05 }
            }
          >
            <Download
              className="h-4 w-4 text-white transition-transform duration-300 group-hover:translate-y-0.5"
              strokeWidth={2.25}
            />
          </motion.span>
          {/* Check — draws itself once the arrow has dropped. */}
          {phase === "done" && (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="absolute inset-0 m-auto h-[18px] w-[18px]"
            >
              <motion.path
                d="M5 12.5l4.8 4.8L19 7.7"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduce ? { opacity: 0 } : { pathLength: 0 }}
                animate={reduce ? { opacity: 1 } : { pathLength: 1 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
          )}
        </span>
      </span>

      {/* Label stack — the rest label sits in flow and fixes the width; the
          confirmation crossfades over it. Both are decorative (the anchor's
          aria-label is the stable accessible name). */}
      <span className="relative" aria-hidden>
        <motion.span
          className="block whitespace-nowrap text-sm text-ink-muted transition-colors group-hover:text-ink-strong"
          animate={
            phase === "idle"
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: reduce ? 0 : -6 }
          }
          transition={{ duration: 0.25 }}
        >
          {label}
        </motion.span>
        <motion.span
          className="absolute inset-0 flex items-center whitespace-nowrap text-sm text-ink-strong"
          initial={{ opacity: 0 }}
          animate={
            phase === "done"
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: reduce ? 0 : 6 }
          }
          transition={{ duration: 0.25 }}
        >
          Saved
        </motion.span>
      </span>
    </motion.a>
  );
}
