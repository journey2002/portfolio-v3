"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

export type LightboxItem = {
  /** Full-size artwork to show. */
  src: string;
  /** Real description of the piece — this is the only copy a screen reader gets
   *  for the image itself, so it carries the content, not the title. */
  alt: string;
  title: string;
  caption: string;
  /** The project's colour identity, for the gradient seam under the frame. */
  from: string;
  to: string;
};

/**
 * Full-screen image viewer for the work whose piece IS the deliverable — the
 * illustration and the UI concepts, which have no live site to link out to.
 *
 * Rendered through a portal into <body> rather than in place. It has to be:
 * the Work section clips with overflow-hidden and the gallery tiles carry
 * transforms, and `position: fixed` inside a transformed ancestor resolves
 * against that ancestor instead of the viewport — so an in-place overlay would
 * be both clipped and mis-anchored.
 *
 * Sits at z-500: above the page, the intro overlay (100) and the skip link
 * (200), but under the custom cursor (9998/9999) so the cursor still draws over
 * it instead of vanishing behind the backdrop.
 */
export default function Lightbox({
  item,
  onClose,
}: {
  /** The piece to show; null closes the viewer. */
  item: LightboxItem | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Whatever was focused when the viewer opened, so focus can go back there on
  // close instead of resetting to the top of the document.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Portals need a real document, which the server render doesn't have.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const open = item !== null;

  // Escape closes; Tab is kept inside the dialog. The viewer holds one or two
  // focusable nodes, so the trap is a plain cycle rather than a full inert
  // treatment of the page behind it.
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;

    // Freeze the page under the viewer. overflow on <html> (not a fixed body)
    // because it holds the scroll position exactly — a fixed body would snap
    // the page back to the top behind the backdrop and land the reader
    // somewhere else on close. Lenis drives native scroll, so this stops it
    // too; data-lenis-prevent on the backdrop keeps it off the wheel as well.
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    document.addEventListener("keydown", onKeyDown);
    // Focus lands on the close control, so Escape isn't the only way out for
    // anyone on a keyboard.
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);

    return () => {
      html.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
      returnFocusRef.current?.focus?.();
    };
  }, [open, onKeyDown]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {item && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} — full size`}
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.28, ease: "easeOut" }}
          // The backdrop itself closes on click; the frame below stops the
          // event so a click on the artwork doesn't dismiss it.
          onClick={onClose}
          className="fixed inset-0 z-[500] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-8"
        >
          <motion.div
            ref={panelRef}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: reduce ? 0 : 0.42, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-full w-auto max-w-full flex-col overflow-hidden rounded-xl border border-white/15 bg-[#0b0b0d] shadow-[0_40px_120px_-30px_rgba(0,0,0,0.95)]"
          >
            {/* The project's gradient seam — the same tell the gallery panel and
                the cursor-flown preview use, so this reads as the same project
                still speaking. */}
            <div
              aria-hidden
              className="h-px w-full shrink-0"
              style={{
                background: `linear-gradient(90deg, ${item.from}, ${item.to})`,
              }}
            />

            {/* min-h-0 lets the image flex-shrink inside max-h-full instead of
                overflowing the frame on a short window.
                It also carries its own top rounding rather than leaning on the
                frame's overflow-hidden. The artwork's corners are square and sit
                ~2px inside a 12px arc, and Chromium antialiases that clip badly
                enough that the top corners rendered visibly squarer than the
                rounded bottom ones — obvious on a piece like Partly Cloudy whose
                art runs solid and pale right into the corner. 11px = the frame's
                12px less its ~1px border, so the curves stay concentric. */}
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-t-[11px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                draggable={false}
                // Capped on BOTH axes, and the height cap subtracts the chrome
                // the image doesn't get: the backdrop's padding, the caption
                // rail (~72px) and the frame's border. The old max-h-[78vh]
                // measured the whole window instead, so a tall piece (Firefly
                // is 1200×1302) sized itself by width, overshot its box by
                // ~19px and was quietly cropped. A replaced element honours
                // max-width and max-height together while preserving its
                // aspect, so this fits inside both and stays whole.
                // svh, not vh: on mobile vh includes the retractable URL bar,
                // which would put the rail off-screen.
                className="h-auto max-h-[calc(100svh-10rem)] w-auto max-w-full select-none object-contain"
              />
            </div>

            {/* Caption rail. Sits under the art rather than over it, so nothing
                is covering the piece the viewer opened this to look at. */}
            <div className="flex shrink-0 items-baseline justify-between gap-4 border-t border-white/10 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-400">
                  {item.caption}
                </p>
                <h2 className="mt-1 truncate font-serif text-lg font-semibold text-white sm:text-xl">
                  {item.title}
                </h2>
              </div>
              <p className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.28em] text-neutral-500 sm:block">
                Esc to close
              </p>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              data-cursor-hover
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-neutral-200 backdrop-blur-sm transition-colors duration-200 hover:border-white/40 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
