"use client";

import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ACCENTS, useAccent } from "@/components/ui/AccentProvider";

/**
 * Accent-palette picker — three gradient swatches styled as a design-tool fill
 * control, sized to live in the hero's status bar. The active swatch carries a
 * ring + soft glow; clicking one retints the whole site (see AccentProvider).
 * Purely a color choice, so it's aria-hidden-free but each swatch is a labelled
 * button for assistive tech.
 */
function AccentSwitcherBase({
  className = "",
  bare = false,
}: {
  className?: string;
  /** Drop the glass pill chrome — used when embedded in the Inspect panel. */
  bare?: boolean;
}) {
  const { accent, setAccent } = useAccent();
  const reduce = useReducedMotion();

  const chrome = bare
    ? ""
    : "rounded-full border border-hairline bg-glass px-2 py-1 backdrop-blur";

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
