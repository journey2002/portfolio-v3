"use client";

import { memo, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ACCENTS, useAccent } from "@/components/ui/AccentProvider";

/**
 * Accent-palette picker — clicking a swatch retints the whole site (see
 * AccentProvider). Three guises:
 * - "dots"  — compact gradient dots in a glass pill, for the hero status bar.
 * - "strip" — full-width segmented swatch chips in a glass tray, matching the
 *   Inspect panel's field styling; the active chip carries a check and a
 *   hairline ring that slides between chips on switch.
 * - "chip"  — the phone guise: one tap-to-advance fill field (see AccentChip).
 * Purely a color choice, so it's aria-hidden-free but each swatch is a labelled
 * button for assistive tech.
 */
function AccentSwitcherBase({
  className = "",
  variant = "dots",
}: {
  className?: string;
  variant?: "dots" | "strip" | "chip";
}) {
  const { accent, setAccent } = useAccent();
  const reduce = useReducedMotion();

  if (variant === "chip") return <AccentChip className={className} />;

  if (variant === "strip") {
    return (
      <div
        role="group"
        aria-label="Accent color"
        className={`flex w-full items-center gap-1 rounded-md bg-glass p-1 ${className}`}
      >
        {ACCENTS.map(({ id, label, swatch }) => {
          const active = accent === id;
          return (
            <motion.button
              key={id}
              type="button"
              aria-pressed={active}
              aria-label={`${label} accent`}
              title={`${label} accent`}
              data-cursor-hover
              onClick={() => setAccent(id)}
              whileTap={reduce ? undefined : { scale: 0.96 }}
              className="group relative h-6 flex-1 rounded-[5px]"
            >
              <span
                aria-hidden
                className={`absolute inset-0 rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)] transition duration-300 ${
                  active
                    ? ""
                    : "opacity-55 saturate-[0.8] group-hover:opacity-90 group-hover:saturate-100"
                }`}
                style={{ backgroundImage: swatch }}
              />
              {active && (
                <motion.span
                  aria-hidden
                  layoutId={reduce ? undefined : "accent-strip-ring"}
                  transition={{ type: "spring", stiffness: 520, damping: 34 }}
                  className="pointer-events-none absolute -inset-px rounded-md ring-1 ring-[color:var(--sheen)]"
                />
              )}
              <span
                aria-hidden
                className={`relative grid h-full place-items-center transition-opacity duration-200 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              >
                <Check
                  className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
                  strokeWidth={3}
                />
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  const chrome = "rounded-full border border-hairline bg-glass px-2 py-1 backdrop-blur";

  return (
    <div
      role="group"
      aria-label="Accent color"
      // Wider spacing on touch so the enlarged hit areas below can't overlap:
      // 24px targets 10px apart keeps 34px between centres, where the desktop
      // 14px/6px pairing would have them colliding into each other's taps.
      className={`flex items-center gap-1.5 touch:gap-2.5 ${chrome} ${className}`}
    >
      {ACCENTS.map(({ id, label, swatch }) => {
        const active = accent === id;
        return (
          <motion.button
            key={id}
            type="button"
            aria-pressed={active}
            aria-label={`${label} accent`}
            title={`${label} accent`}
            data-cursor-hover
            onClick={() => setAccent(id)}
            whileTap={reduce ? undefined : { scale: 0.88 }}
            animate={reduce ? undefined : { scale: active ? 1.12 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            // 14px reads right beside the status bar's other chrome, but it's a
            // real control and 14px is half the 24px minimum tap target — on a
            // phone this picker (the Inspect panel's copy is desktop-only) was
            // the smallest thing on the page. Touch pointers get a 24px button
            // with a slightly larger dot inside; mouse widths are unchanged.
            className="relative grid h-3.5 w-3.5 place-items-center rounded-full touch:h-6 touch:w-6"
          >
            {/* The swatch itself */}
            <span
              className="h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] touch:h-4 touch:w-4"
              style={{ backgroundImage: swatch }}
            />
            {/* Active ring + bloom, drawn from the swatch so it matches the hue */}
            {active && (
              <>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-[3px] rounded-full ring-1 ring-[color:var(--sheen)]"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-1 rounded-full opacity-50 blur-[3px]"
                  style={{ backgroundImage: swatch }}
                />
              </>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Phone guise — a single "fill" field rather than a row of dots.
 *
 * A row of three swatches costs ~110px of a 375px status bar, needs three
 * separate tap targets small enough to miss, and reads as a generic colour
 * widget bolted onto chrome that otherwise speaks in instrument readouts. This
 * says the same thing in the bar's own language: a recessed swatch slot and the
 * live hex, i.e. the Inspect panel's Fill row compressed to one control. Tapping
 * anywhere on the pill advances to the next palette — the slot's colour reel
 * slides a cell and the hex rolls to match.
 *
 * The reel is addressed by an ever-increasing step rather than the palette
 * index, so wrapping from the last accent to the first slides onward like a
 * physical dial instead of snapping back across two cells.
 */
function AccentChip({ className = "" }: { className?: string }) {
  const { accent, setAccent } = useAccent();
  const reduce = useReducedMotion();

  const n = ACCENTS.length;
  const index = Math.max(
    0,
    ACCENTS.findIndex((a) => a.id === accent)
  );
  const [step, setStep] = useState(index);

  // Catch the reel up whenever the accent moves without a tap — on mount, when
  // AccentProvider swaps SSR's default for the stored palette. Always forward,
  // so the correction reads as the same dial motion. It lands long before the
  // status bar finishes fading in, so nothing is visibly spinning on load.
  useEffect(() => {
    setStep((s) => s + ((((index - s) % n) + n) % n));
  }, [index, n]);

  const next = ACCENTS[(index + 1) % n];
  const { label, primary } = ACCENTS[index];
  const hex = primary.toUpperCase();

  return (
    <motion.button
      type="button"
      aria-label={`Accent color: ${label}. Activate for ${next.label}.`}
      title={`Accent color — ${label}`}
      data-cursor-hover
      onClick={() => {
        setStep((s) => s + 1);
        setAccent(next.id);
      }}
      whileTap={reduce ? undefined : { scale: 0.95 }}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border border-hairline bg-glass pl-1 pr-2.5 backdrop-blur ${className}`}
    >
      {/* The slot: a window one cell wide onto a strip of every palette */}
      <span
        aria-hidden
        className="relative h-4 w-6 overflow-hidden rounded-[5px]"
      >
        <motion.span
          className="absolute inset-0"
          animate={{ x: `${-step * 100}%` }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 340, damping: 32 }
          }
        >
          {/* Only the cells that can be on-screen mid-slide are mounted; each
              sits at its own absolute step, so the strip never re-lays out
              underneath the animation. */}
          {[step - 1, step, step + 1].map((s) => (
            <span
              key={s}
              className="absolute inset-y-0 w-full"
              style={{
                left: `${s * 100}%`,
                backgroundImage: ACCENTS[((s % n) + n) % n].swatch,
              }}
            />
          ))}
        </motion.span>
        {/* Rim light plus a shadow down each inner edge, so the colour reads as
            sitting inside the slot rather than painted on top of it. */}
        <span className="pointer-events-none absolute inset-0 rounded-[5px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),inset_2px_0_3px_-2px_rgba(0,0,0,0.55),inset_-2px_0_3px_-2px_rgba(0,0,0,0.55)]" />
      </span>

      {/* Live hex, odometer-rolled. The invisible copy sizes the box: every
          palette hex is the same seven mono characters, so it holds a constant
          width while the animated copies are taken out of flow. */}
      <span className="relative overflow-hidden font-mono text-[10px] leading-[1.3] tracking-wide text-ink-muted">
        <span className="invisible">{hex}</span>
        <AnimatePresence initial={false}>
          <motion.span
            key={accent}
            initial={reduce ? false : { y: "105%" }}
            animate={{ y: "0%" }}
            exit={reduce ? { opacity: 0 } : { y: "-105%" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {hex}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

const AccentSwitcher = memo(AccentSwitcherBase);
export default AccentSwitcher;
