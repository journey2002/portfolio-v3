"use client";

/**
 * A generative "cover" for a project — there are no real screenshots, so each
 * project gets a distinct, hand-tuned colour identity rendered entirely in CSS:
 * two soft colour blobs drifting over a near-black base, a faint grid, a giant
 * ghost numeral bleeding off the corner, and the shared film grain on top.
 *
 * This is purely the artwork panel; callers overlay their own text. It's reused
 * at two sizes — the cursor-following preview in the index, and the larger
 * tiles in the gallery — so the two views feel like the same world.
 */
export default function ProjectCover({
  index,
  from,
  to,
  className = "",
}: {
  index: number;
  /** Leading accent colour (CSS colour string). */
  from: string;
  /** Trailing accent colour (CSS colour string). */
  to: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={`relative overflow-hidden bg-[#0b0b0d] ${className}`}>
      {/* Two drifting colour blobs give the panel depth and motion. The
          animations are CSS keyframes, so prefers-reduced-motion freezes them
          via the global rule in globals.css. */}
      <div
        className="absolute -left-[20%] -top-[35%] h-[140%] w-[80%] rounded-full opacity-70 blur-3xl animate-float-card"
        style={{ background: `radial-gradient(circle at center, ${from}, transparent 68%)` }}
      />
      <div
        className="absolute -right-[25%] bottom-[-40%] h-[140%] w-[85%] rounded-full opacity-55 blur-3xl animate-drift-x"
        style={{ background: `radial-gradient(circle at center, ${to}, transparent 70%)` }}
      />

      {/* Faint structural grid — same vocabulary as the page background. */}
      <div className="grid-lines absolute inset-0 opacity-50" />

      {/* Ghost numeral bleeding off the bottom-right corner. */}
      <span className="pointer-events-none absolute -bottom-8 -right-2 select-none font-serif text-[9rem] font-bold leading-none text-white/[0.07]">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Top sheen + film grain to match the rest of the surfaces. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}
