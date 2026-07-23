import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Nav from "@/components/ui/Nav";
import MagneticButton from "@/components/ui/MagneticButton";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

// Staged in the same design-tool language as the rest of the site: the missing
// route reads as a frame that isn't in the file, numbered like a section marker
// and sitting on the pasteboard grid. Server-rendered — no motion needed for a
// page whose whole job is to hand the visitor a way back.
export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-6 py-32 text-center sm:px-10"
    >
      <Nav />

      {/* Pasteboard + atmosphere, matching the hero's background stack. */}
      <div aria-hidden className="grid-dots pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="bg-aurora pointer-events-none absolute left-1/2 top-1/2 h-[90vh] w-[90vh] -translate-x-1/2 -translate-y-1/2 opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[image:var(--vignette)]"
      />
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      <div className="relative flex flex-col items-center">
        <p className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-ink-subtle">
          <span className="h-px w-8 bg-hairline" />
          Error
          <span className="h-px w-8 bg-hairline" />
        </p>

        <p
          aria-hidden
          className="mt-6 select-none font-numeral text-[clamp(5rem,22vw,13rem)] font-bold leading-none tracking-tight"
          style={{
            WebkitTextStroke: "2.5px var(--glyph-ghost)",
            color: "transparent",
          }}
        >
          404
        </p>

        <h1 className="mt-6 font-serif text-3xl font-bold leading-tight text-ink-strong sm:text-5xl">
          This frame isn&apos;t in the file.
        </h1>

        <p className="mt-5 max-w-md text-base text-ink-muted">
          The page you were after has been moved, renamed, or never existed.
          Everything else is still where you left it.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
          <MagneticButton
            href="/"
            glow
            className="px-7 py-3.5 text-sm font-semibold text-white"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
              strokeWidth={2.25}
            />
            Back to portfolio
          </MagneticButton>
          <a
            href="/#work"
            data-cursor-hover
            className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink-strong"
          >
            See my work
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </a>
        </div>
      </div>
    </main>
  );
}
