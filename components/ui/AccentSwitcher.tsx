"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { ACCENTS, useAccent } from "@/components/ui/AccentProvider";

/**
 * Accent-palette picker — clicking a swatch retints the whole site (see
 * AccentProvider). Two guises:
 * - "dots"  — compact gradient dots in a glass pill, for the hero status bar.
 * - "strip" — full-width segmented swatch chips in a glass tray, matching the
 *   Inspect panel's field styling; the active chip carries a check and a
 *   hairline ring that slides between chips on switch.
 * Purely a color choice, so it's aria-hidden-free but each swatch is a labelled
 * button for assistive tech.
 */
function AccentSwitcherBase({
  className = "",
  variant = "dots",
}: {
  className?: string;
  variant?: "dots" | "strip";
}) {
  const { accent, setAccent } = useAccent();
  const reduce = useReducedMotion();

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
      className={`flex items-center gap-1.5 ${chrome} ${className}`}
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
            className="relative grid h-3.5 w-3.5 place-items-center rounded-full"
          >
            {/* The swatch itself */}
            <span
              className="h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]"
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

const AccentSwitcher = memo(AccentSwitcherBase);
export default AccentSwitcher;
