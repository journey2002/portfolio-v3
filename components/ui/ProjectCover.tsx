"use client";

/**
 * A project's cover — the piece itself, sitting on the colour identity that
 * used to stand in for it. The generated layer (two drifting blobs in the
 * project's hues, a faint grid, the ghost numeral and the shared film grain)
 * still renders underneath, so a cover that hasn't decoded yet reads as the
 * project rather than as an empty box.
 *
 * This is purely the artwork panel; callers overlay their own text. It's reused
 * at three sizes — the cursor-following preview, the index's expanded record
 * and the gallery tiles — so the views feel like the same world.
 */
export default function ProjectCover({
  index,
  from,
  to,
  src,
  alt = "",
  position,
  flip,
  showFlip = false,
  className = "",
}: {
  index: number;
  /** Leading accent colour (CSS colour string). */
  from: string;
  /** Trailing accent colour (CSS colour string). */
  to: string;
  /** The artwork. Decorative — every caller prints the title alongside it. */
  src?: string;
  alt?: string;
  /** Crop anchor for the art, e.g. "center 28%" to hold a face in frame. */
  position?: string;
  /** A second frame, crossfaded over the cover while `showFlip` is true. */
  flip?: string;
  showFlip?: boolean;
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

      {/* Faint structural grid — same vocabulary as the page background. Only
          on a coverless panel; under artwork it just reads as dirt. */}
      {!src && <div className="grid-lines absolute inset-0 opacity-50" />}

      {src && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            style={{ objectPosition: position }}
            className="absolute inset-0 h-full w-full select-none object-cover"
          />
          {/* Second frame — a project with two shots turns over on hover. */}
          {flip && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={flip}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              style={{ objectPosition: position, opacity: showFlip ? 1 : 0 }}
              className="absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-700 ease-out-expo"
            />
          )}
          {/* A breath of the project's own gradient over the art, so the cover
              still carries its hue into the page. */}
          <div
            className="absolute inset-0 opacity-[0.18] mix-blend-soft-light"
            style={{ background: `linear-gradient(140deg, ${from}, ${to})` }}
          />
        </>
      )}

      {/* Ghost numeral bleeding off the bottom-right corner. */}
      <span className="pointer-events-none absolute -bottom-8 -right-2 select-none font-numeral text-[9rem] font-bold leading-none text-white/[0.07]">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Top sheen + film grain to match the rest of the surfaces. */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="noise-overlay absolute inset-0" />
    </div>
  );
}
