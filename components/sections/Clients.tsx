"use client";

import { useRef, useState } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import { Handwrite, RevealLine } from "@/components/ui/Reveal";
import Parallax from "@/components/ui/Parallax";

const EASE = [0.16, 1, 0.3, 1] as const;

type ClientSite = {
  /** Client / project name. */
  name: string;
  /** Live domain, shown as the frame's name — the star of each row. */
  domain: string;
  /** Live URL the frame links out to. */
  url: string;
  year: string;
  services: string[];
  /** One-liner shown under the featured frames. */
  summary: string;
  /** Brand colour pair — drives the stand-in cover and hover tints. */
  from: string;
  to: string;
  /** Figma-style dimension badge shown while the frame is "selected". */
  size: string;
  /**
   * Full-page screenshot (tall, ~1200px wide, any height) in /public/clients.
   * When set it replaces the generative wireframe cover and pans the same way.
   */
  image?: string;
};

/* ────────────────────────────────────────────────────────────────────
   ⚠ PLACEHOLDER DATA — swap for the real client projects.
   Each entry needs: name, live domain + url, year, services, a brand
   colour pair and a made-up-until-real `size`. Drop a full-page
   screenshot into /public/clients and set `image: "/clients/x.jpg"`;
   until then a generative wireframe cover in the brand colours stands
   in. First three are the featured artboards, the rest go to the ledger.
   ──────────────────────────────────────────────────────────────────── */
const FEATURED: ClientSite[] = [
  {
    name: "Aurelia Café",
    domain: "aurelia.cafe",
    url: "https://aurelia.cafe",
    year: "2025",
    services: ["Brand site", "Online menu", "Booking"],
    summary:
      "Full brand site for a specialty coffee house — menu, story and table booking in one warm, editorial page.",
    from: "#f59e0b",
    to: "#ef4444",
    size: "1440 × 4160",
  },
  {
    name: "Nara Dental",
    domain: "naradental.co",
    url: "https://naradental.co",
    year: "2024",
    services: ["UX/UI", "Development", "CMS"],
    summary:
      "A calm, trust-first clinic site with treatment pages and appointment requests the staff edit themselves.",
    from: "#22d3ee",
    to: "#6366f1",
    size: "1440 × 3480",
  },
  {
    name: "Vela Studio",
    domain: "velastudio.io",
    url: "https://velastudio.io",
    year: "2025",
    services: ["Portfolio", "Motion", "CMS"],
    summary:
      "Photography studio portfolio — huge imagery, smooth motion, and a gallery the studio updates on their own.",
    from: "#a855f7",
    to: "#ec4899",
    size: "1440 × 5020",
  },
];

const MORE: ClientSite[] = [
  {
    name: "Horizon Legal",
    domain: "horizonlegal.co",
    url: "https://horizonlegal.co",
    year: "2024",
    services: ["Corporate", "Bilingual"],
    summary: "Bilingual corporate site for a boutique law office.",
    from: "#34d399",
    to: "#0ea5e9",
    size: "1440 × 2900",
  },
  {
    name: "Mori Interior",
    domain: "moriinterior.com",
    url: "https://moriinterior.com",
    year: "2023",
    services: ["Catalogue", "CMS"],
    summary: "Furniture catalogue with a self-serve product CMS.",
    from: "#fbbf24",
    to: "#f97316",
    size: "1440 × 3300",
  },
  {
    name: "Trailhead Tours",
    domain: "trailheadtours.asia",
    url: "https://trailheadtours.asia",
    year: "2023",
    services: ["Booking", "SEO"],
    summary: "Tour operator site with route pages and trip booking.",
    from: "#4ade80",
    to: "#14b8a6",
    size: "1440 × 3750",
  },
];

const ALL = [...FEATURED, ...MORE];
const YEARS = ALL.map((s) => parseInt(s.year, 10));
const YEAR_SPAN =
  Math.min(...YEARS) === Math.max(...YEARS)
    ? `${Math.min(...YEARS)}`
    : `${Math.min(...YEARS)} — ${Math.max(...YEARS)}`;
const TOTAL = String(ALL.length).padStart(2, "0");

const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const rowItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Figma-style frame glyph (⌗) for the artboard labels. */
function FrameGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden className={className}>
      <path
        d="M4 1v10M8 1v10M1 4h10M1 8h10"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

// First movement of the Work section: the shipped, live client websites.
// Rendered as a plain block (no <section>/SectionLabel of its own) so it reads
// as part of the unified "Work" section rather than a separate stop in the nav.
export default function ClientWork() {
  const headingRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-10%" });
  const boardInView = useInView(boardRef, { once: true, margin: "-12%" });
  const ledgerInView = useInView(ledgerRef, { once: true, margin: "-12%" });

  // Which ledger row is peeked open (mouse only) — the others dim, like the
  // off-the-clock index does.
  const [peeked, setPeeked] = useState<number | null>(null);

  return (
    <div className="relative overflow-hidden">
      {/* Pasteboard — the same design-tool dot grid the hero uses, faded out
          toward the edges so the artboards read as frames pinned on a canvas
          rather than cards floating on nothing. */}
      <div
        aria-hidden
        className="grid-dots pointer-events-none absolute inset-0 opacity-70 [mask-image:radial-gradient(70%_55%_at_50%_42%,black_30%,transparent)]"
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <div
          ref={headingRef}
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              className="text-xs uppercase tracking-[0.25em] text-ink-subtle"
            >
              <span className="text-ink">[ I ]</span> &nbsp; Client work
            </motion.p>
            {/* Headline lines rise behind a marquee-selection sweep. */}
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <RevealLine>
                <SplitText text="Client work" as="span" className="block" />
              </RevealLine>
              <RevealLine delay={0.14}>
                <SplitText
                  text="that shipped."
                  as="span"
                  className="block"
                  charClassName="bg-accent-gradient bg-clip-text text-transparent"
                />
              </RevealLine>
            </h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
            className="flex flex-col items-start gap-2 pt-1 sm:items-end"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
              Live sites
            </span>
            <span className="font-numeral text-[11px] tracking-[0.2em] text-ink-faint">
              {TOTAL} sites · {YEAR_SPAN}
            </span>
          </motion.div>
        </div>

        {/* Featured artboards — three frames staggered on the pasteboard.
            Hovering one gives it the design-tool selection treatment: accent
            outline, corner handles, dimension badge, and the page slowly pans
            inside the frame like it is being scrolled. */}
        <div
          ref={boardRef}
          className="relative mt-14 grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-6 md:gap-y-0"
        >
          <div className="relative md:col-span-7">
            <FeaturedFrame
              site={FEATURED[0]}
              index={0}
              show={boardInView}
              delay={0}
              aspect="aspect-[4/3]"
            />
            {/* Hand note — same handwriting voice as the hero chips; written
                in after the first frame's page has streamed in. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-8 right-2 hidden -rotate-3 font-hand text-xl text-[color:var(--accent-soft)] md:block"
            >
              <Handwrite delay={1.1} duration={0.85}>
                still like this one
              </Handwrite>
            </span>
          </div>

          <Parallax offset={44} className="md:col-span-5 md:mt-28">
            <FeaturedFrame
              site={FEATURED[1]}
              index={1}
              show={boardInView}
              delay={0.15}
              aspect="aspect-[3/4]"
            />
          </Parallax>

          <Parallax
            offset={24}
            className="md:col-span-9 md:col-start-4 md:mt-16"
          >
            <FeaturedFrame
              site={FEATURED[2]}
              index={2}
              show={boardInView}
              delay={0.3}
              aspect="aspect-[16/9]"
            />
          </Parallax>
        </div>

        {/* Ledger — the rest of the roster, numbered on from the frames.
            Hovering a row peeks a letterboxed slice of the site through it. */}
        <div ref={ledgerRef} className="mt-24 md:mt-28">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-ink-faint">
            <span>More shipped sites</span>
            <span className="font-numeral tracking-[0.2em]">
              {String(MORE.length).padStart(2, "0")} more
            </span>
          </div>
          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate={ledgerInView ? "show" : "hidden"}
            onMouseLeave={() => setPeeked(null)}
            className="mt-4 border-t border-hairline"
          >
            {MORE.map((site, i) => (
              <LedgerRow
                key={site.domain}
                site={site}
                number={FEATURED.length + i + 1}
                open={peeked === i}
                dim={peeked !== null && peeked !== i}
                onEnter={() => setPeeked(i)}
              />
            ))}
          </motion.ul>
        </div>

        <div className="mt-16 flex items-center justify-end text-[10px] uppercase tracking-[0.35em] text-ink-faint">
          <span>{TOTAL} shipped</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Featured frame — an artboard pinned on the pasteboard               */
/* ------------------------------------------------------------------ */

// The page pans inside the frame on hover. 100cqh is the artboard's own
// height (it is a size container), so the travel is exactly coverHeight −
// frameHeight — the pan always lands on the page's footer, never past it.
// min() guards covers shorter than the frame (no-op instead of sliding down).
const PAN =
  "absolute inset-x-0 top-0 w-full will-change-transform transition-transform duration-[4500ms] ease-[cubic-bezier(0.3,0.4,0.2,1)] mouse:group-hover:translate-y-[min(0px,calc(100cqh-100%))]";

function FeaturedFrame({
  site,
  index,
  show,
  delay,
  aspect,
}: {
  site: ClientSite;
  index: number;
  show: boolean;
  delay: number;
  aspect: string;
}) {
  // The load-in stages a file opening in the design tool: the artboard rises,
  // gets SELECTED (accent outline + corner handles + dimension badge), its
  // page streams in top-to-bottom behind an accent scanline, and the
  // selection releases. Reduced motion skips the theatre — plain fade.
  const reduced = useReducedMotion();

  return (
    <motion.a
      href={site.url}
      target="_blank"
      rel="noreferrer"
      data-cursor-hover
      initial={{ opacity: 0, y: 28 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: EASE }}
      className="group block"
    >
      {/* Frame label — like a Figma frame name, it turns accent when the
          artboard below is "selected". */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-2 font-numeral text-[11px] tracking-[0.18em] text-ink-subtle transition-colors duration-300 mouse:group-hover:text-indigo-accent">
          <FrameGlyph className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {String(index + 1).padStart(2, "0")} · {site.domain}
          </span>
        </span>
        <span className="shrink-0 font-numeral text-[11px] tabular-nums tracking-[0.18em] text-ink-faint">
          {site.year}
        </span>
      </div>

      <div className="relative">
        {/* Artboard — a size container so the pan (see PAN) can measure it. */}
        <div
          className={`relative overflow-hidden rounded-xl border border-hairline bg-[#0b0b0d] [container-type:size] ${aspect}`}
        >
          {/* The page streams in top-to-bottom while the entrance selection is
              on — clip and scanline share one duration/ease so the line rides
              exactly on the develop edge. */}
          <motion.div
            className="absolute inset-0"
            initial={reduced ? false : { clipPath: "inset(0% 0% 101% 0%)" }}
            animate={
              show && !reduced ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined
            }
            transition={{ duration: 1.0, delay: delay + 0.45, ease: EASE }}
          >
            {site.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={site.image} alt={`${site.name} — website`} className={PAN} />
            ) : (
              <SiteCover from={site.from} to={site.to} variant={index} className={PAN} />
            )}
          </motion.div>

          {!reduced && (
            <motion.span
              aria-hidden
              initial={{ top: "0%", opacity: 0 }}
              animate={show ? { top: "100%", opacity: [0, 0.9, 0.9, 0] } : {}}
              transition={{
                top: { duration: 1.0, delay: delay + 0.45, ease: EASE },
                opacity: {
                  duration: 1.0,
                  delay: delay + 0.45,
                  times: [0, 0.05, 0.9, 1],
                },
              }}
              className="pointer-events-none absolute inset-x-0 z-10 h-px bg-accent-gradient"
            />
          )}

          {/* Visit chip — hover flourish on desktop, always on for touch. */}
          <span className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-white opacity-0 backdrop-blur-md transition-opacity duration-300 mouse:group-hover:opacity-100 touch:opacity-100">
            Visit <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
          </span>
        </div>

        {/* Entrance selection — the same chrome as the hover treatment below,
            shown once while the page streams in, then released. Lives outside
            the clipped artboard so handles and badge can overhang. */}
        {!reduced && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={show ? { opacity: [0, 1, 1, 0] } : {}}
            transition={{
              duration: 2.1,
              delay: delay + 0.1,
              times: [0, 0.1, 0.78, 1],
            }}
            className="pointer-events-none absolute -inset-px"
          >
            <div
              className="absolute inset-0 rounded-xl border-[1.5px] border-indigo-accent"
              style={{
                boxShadow: "0 14px 44px -18px rgb(var(--accent-1) / 0.35)",
              }}
            />
            {/* Corner handles pop in clockwise from the top-left. */}
            {(
              [
                "-left-1 -top-1",
                "-right-1 -top-1",
                "-right-1 -bottom-1",
                "-left-1 -bottom-1",
              ] as const
            ).map((pos, i) => (
              <motion.span
                key={pos}
                initial={{ scale: 0 }}
                animate={show ? { scale: 1 } : {}}
                transition={{
                  type: "spring",
                  stiffness: 420,
                  damping: 22,
                  delay: delay + 0.2 + i * 0.07,
                }}
                className={`absolute ${pos} h-2 w-2 rounded-[2px] border-[1.5px] border-indigo-accent bg-white shadow-[0_1px_5px_rgba(0,0,0,0.35)]`}
              />
            ))}
            {/* Dimension badge — position on the plain wrapper, motion on the
                inner span (framer would drop the -translate-x-1/2 otherwise). */}
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={show ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, delay: delay + 0.4, ease: EASE }}
                className="block whitespace-nowrap rounded-[4px] bg-indigo-accent px-2 py-[3px] font-numeral text-[10px] font-medium leading-none text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
              >
                {site.size}
              </motion.span>
            </span>
          </motion.div>
        )}

        {/* Selection treatment — accent outline, corner handles and the
            dimension badge, exactly like selecting a frame in a design tool.
            The whole layer scales down a touch as it fades in, so the
            selection reads as snapping onto the frame; handles pop in with a
            small stagger and the badge rides up after. Lives outside the
            clipped artboard so the handles, badge and guides can overhang. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px scale-[1.01] opacity-0 transition-[opacity,transform] duration-300 ease-out-expo mouse:group-hover:scale-100 mouse:group-hover:opacity-100"
        >
          {/* Outline + a faint accent drop below — enough lift to separate the
              selected artboard from the pasteboard while the edges stay crisp.
              The shadow itself is static — only the layer's opacity animates —
              so the themed tint never hits the transitioned-var-shadow bug. */}
          <div
            className="absolute inset-0 rounded-xl border-[1.5px] border-indigo-accent"
            style={{
              boxShadow: "0 14px 44px -18px rgb(var(--accent-1) / 0.35)",
            }}
          />

          {/* Corner handles — white-filled like a real selection, popping in
              clockwise from the top-left. */}
          {(
            [
              ["-left-1 -top-1", "0ms"],
              ["-right-1 -top-1", "60ms"],
              ["-right-1 -bottom-1", "120ms"],
              ["-left-1 -bottom-1", "180ms"],
            ] as const
          ).map(([pos, delay]) => (
            <span
              key={pos}
              style={{ transitionDelay: delay }}
              className={`absolute ${pos} h-2 w-2 scale-0 rounded-[2px] border-[1.5px] border-indigo-accent bg-white shadow-[0_1px_5px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out-expo mouse:group-hover:scale-100`}
            />
          ))}

          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 translate-y-2 whitespace-nowrap rounded-[4px] bg-indigo-accent px-2 py-[3px] font-numeral text-[10px] font-medium leading-none text-white shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition-transform delay-100 duration-300 ease-out-expo mouse:group-hover:translate-y-0">
            {site.size}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-semibold tracking-tight text-ink-strong sm:text-2xl">
            {site.name}
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
            {site.summary}
          </p>
          <p className="mt-2.5 text-[10px] uppercase tracking-[0.25em] text-ink-faint">
            {site.services.join(" · ")}
          </p>
        </div>
        <ArrowUpRight
          className="mt-1 h-5 w-5 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-ink"
          strokeWidth={1.5}
        />
      </div>
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/* Ledger row — dotted-leader entry with a slice peek                  */
/* ------------------------------------------------------------------ */

function LedgerRow({
  site,
  number,
  open,
  dim,
  onEnter,
}: {
  site: ClientSite;
  number: number;
  open: boolean;
  dim: boolean;
  onEnter: () => void;
}) {
  return (
    <motion.li variants={rowItem} className="border-b border-hairline">
      <a
        href={site.url}
        target="_blank"
        rel="noreferrer"
        data-cursor-hover
        onMouseEnter={onEnter}
        style={{
          opacity: dim ? 0.4 : 1,
          transition: "opacity 0.35s cubic-bezier(0.16,1,0.3,1)",
        }}
        className="group block"
      >
        <div className="flex items-center gap-4 py-5 sm:gap-6">
          <span className="w-7 shrink-0 font-numeral text-xs tabular-nums tracking-[0.3em] text-ink-faint sm:w-10">
            {String(number).padStart(2, "0")}
          </span>
          <span className="min-w-0 truncate font-mono text-base tracking-tight text-ink transition-colors duration-300 group-hover:text-indigo-accent sm:text-lg">
            {site.domain}
          </span>
          <span className="hidden shrink-0 text-sm text-ink-subtle lg:block">
            {site.name}
          </span>
          {/* Dotted leader — ties the ledger together like a table of contents */}
          <span
            aria-hidden
            className="mx-1 hidden h-px flex-1 border-t border-dotted border-hairline sm:block"
          />
          <span className="hidden shrink-0 text-[10px] uppercase tracking-[0.25em] text-ink-faint md:block">
            {site.services.join(" · ")}
          </span>
          <span className="shrink-0 font-numeral text-xs tabular-nums text-ink-subtle">
            {site.year}
          </span>
          <ArrowUpRight
            className="h-4 w-4 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-accent"
            strokeWidth={1.5}
          />
        </div>

        {/* Slice peek — a letterboxed slit through to the site, drifting
            slowly upward while open as if the page were scrolling past the
            slot. Mouse-only: rows are plain links on touch. */}
        <div
          className="hidden mouse:grid transition-[grid-template-rows] duration-500 ease-out-expo"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="relative mb-5 h-20 overflow-hidden rounded-lg border border-hairline bg-[#0b0b0d]">
              <div
                className="absolute inset-x-0 top-0 will-change-transform"
                style={{
                  transform: open ? "translateY(-320px)" : "translateY(-60px)",
                  transition: "transform 7s linear",
                }}
              >
                {site.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={site.image} alt="" className="w-full" />
                ) : (
                  <SiteCover from={site.from} to={site.to} variant={number} />
                )}
              </div>
            </div>
          </div>
        </div>
      </a>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* SiteCover — generative wireframe stand-in for a real screenshot     */
/* ------------------------------------------------------------------ */

/**
 * Until a real full-page screenshot is provided, each client gets a tall
 * wireframe "site" built from blocks in its brand colours: nav, hero, media
 * band, feature cards, copy and footer. It renders at its natural height
 * (taller than any frame) so the hover pan reads like scrolling the page.
 * Like ProjectCover, it stays dark in both themes — it is artwork, not UI.
 */
function SiteCover({
  from,
  to,
  variant = 0,
  className = "",
}: {
  from: string;
  to: string;
  /** Small layout variations so the frames don't read as clones. */
  variant?: number;
  className?: string;
}) {
  const centered = variant % 3 === 1;
  const gradient = `linear-gradient(135deg, ${from}, ${to})`;

  return (
    <div aria-hidden className={`bg-[#0b0b0d] ${className}`}>
      <div className="relative overflow-hidden">
        {/* Brand glow blobs + structural grid, same vocabulary as ProjectCover */}
        <div
          className="absolute -left-16 -top-24 h-72 w-80 rounded-full opacity-50 blur-3xl"
          style={{ background: `radial-gradient(circle, ${from}, transparent 68%)` }}
        />
        <div
          className="absolute -right-20 top-64 h-80 w-96 rounded-full opacity-35 blur-3xl"
          style={{ background: `radial-gradient(circle, ${to}, transparent 70%)` }}
        />
        <div className="grid-lines absolute inset-0 opacity-40" />

        <div className="relative px-6 pb-8 pt-5">
          {/* Nav */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: gradient }}
              />
              <span className="h-2 w-14 rounded bg-white/20" />
            </div>
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-8 rounded bg-white/10" />
              <span className="h-1.5 w-8 rounded bg-white/10" />
              <span className="h-1.5 w-8 rounded bg-white/10" />
              <span
                className="h-5 w-14 rounded-full opacity-80"
                style={{ background: from }}
              />
            </div>
          </div>

          {/* Hero */}
          <div
            className={`flex flex-col pb-9 pt-10 ${
              centered ? "items-center" : "items-start"
            }`}
          >
            <span className="h-5 w-[72%] rounded bg-white/[0.16]" />
            <span className="mt-2.5 h-5 w-[46%] rounded bg-white/[0.12]" />
            <span className="mt-4 h-2 w-[38%] rounded bg-white/[0.08]" />
            <div className="mt-5 flex items-center gap-2.5">
              <span
                className="h-7 w-24 rounded-full opacity-90"
                style={{ background: gradient }}
              />
              <span className="h-7 w-20 rounded-full border border-white/15" />
            </div>
          </div>

          {/* Media band */}
          <div
            className="relative h-44 overflow-hidden rounded-lg border border-white/10"
            style={{ background: gradient }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_20%_0%,rgba(255,255,255,0.28),transparent_55%)]" />
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
              <span className="h-2 w-28 rounded bg-white/50" />
              <span className="h-1.5 w-20 rounded bg-white/30" />
            </div>
          </div>

          {/* Feature cards */}
          <div className="mt-8 grid grid-cols-3 gap-2.5">
            {[from, to, from].map((c, i) => (
              <div
                key={i}
                className="rounded-md border border-white/[0.07] bg-white/[0.03] p-3"
              >
                <span
                  className="block h-5 w-5 rounded"
                  style={{ background: c, opacity: 0.75 }}
                />
                <span className="mt-2.5 block h-1.5 w-full rounded bg-white/10" />
                <span className="mt-1.5 block h-1.5 w-2/3 rounded bg-white/[0.07]" />
              </div>
            ))}
          </div>

          {/* Copy block */}
          <div className="mt-8 flex flex-col gap-2.5">
            <span className="h-2 w-full rounded bg-white/[0.07]" />
            <span className="h-2 w-[92%] rounded bg-white/[0.07]" />
            <span className="h-2 w-[78%] rounded bg-white/[0.07]" />
            <span className="h-2 w-[56%] rounded bg-white/[0.07]" />
          </div>

          {/* CTA banner */}
          <div className="mt-8 flex h-16 items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-4">
            <span className="h-2.5 w-40 rounded bg-white/[0.12]" />
            <span
              className="h-6 w-16 rounded-full opacity-90"
              style={{ background: gradient }}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-between border-t border-white/[0.06] pt-4">
            <span className="h-1.5 w-16 rounded bg-white/10" />
            <div className="flex gap-2">
              <span className="h-1.5 w-6 rounded bg-white/[0.07]" />
              <span className="h-1.5 w-6 rounded bg-white/[0.07]" />
              <span className="h-1.5 w-6 rounded bg-white/[0.07]" />
            </div>
          </div>
        </div>

        {/* Top sheen + film grain to match the rest of the surfaces */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="noise-overlay absolute inset-0" />
      </div>
    </div>
  );
}
