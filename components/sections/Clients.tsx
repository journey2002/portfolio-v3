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
import { usePointer } from "@/components/ui/PointerProvider";

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
  /**
   * 1024-wide copy of `image`, offered alongside it through srcset on the
   * FEATURED frames only. Set for the two featured sites; the ledger's peek is
   * desktop-only, so its screenshots never need a phone size.
   */
  imageMobile?: string;
};

/* ────────────────────────────────────────────────────────────────────
   Live client sites. Drop a full-page screenshot into /public/clients
   and set `image: "/clients/x.jpg"` to replace the generative cover;
   until then a wireframe stand-in in the brand colours is used.
   First two = featured artboards; the rest go to the ledger.
   ──────────────────────────────────────────────────────────────────── */
const FEATURED: ClientSite[] = [
  {
    name: "JIJI Studio",
    domain: "jijistudio.fr",
    url: "https://jijistudio.fr/en",
    year: "2026",
    services: ["E-commerce", "Fashion", "Shopify"],
    summary:
      "Shopify build for a Paris ready-to-wear label: bilingual storefront, seasonal lookbooks, and a shopping flow as pared-back as the clothes themselves.",
    from: "#1c1917",
    to: "#d6c3a8",
    size: "1440 × 3990",
    image: "/clients/jijistudio.2a40f36a.jpg",
    imageMobile: "/clients/jijistudio.2a40f36a.a4b5d1f7.m1024.jpg",
  },
  {
    name: "La Maison du Poké Bowl",
    domain: "lamaisondupokebowl.com",
    url: "https://www.lamaisondupokebowl.com/en/",
    year: "2026",
    services: ["Brand site", "Menu", "Bilingual"],
    summary:
      "Poké bowls with a story — brand site for a Paris restaurant serving seasonal bowls since 2020, with a build-your-own menu in French and English.",
    from: "#14b8a6",
    to: "#f97316",
    size: "1440 × 5024",
    image: "/clients/pokebowl.2ab40c76.jpg",
    imageMobile: "/clients/pokebowl.2ab40c76.7737450a.m1024.jpg",
  },
];

const MORE: ClientSite[] = [
  {
    name: "Julia Paris",
    domain: "juliaparis.fr",
    url: "https://juliaparis.fr/",
    year: "2026",
    services: ["E-commerce", "Brand site", "Shopify"],
    summary:
      "A family-run Parisian knitwear house, given a warm editorial storefront where the knits and leather goods do the talking.",
    from: "#c4a484",
    to: "#8b5e4b",
    size: "1440 × 6369",
    image: "/clients/juliaparis.47c01d95.jpg",
  },
  {
    name: "Olara",
    domain: "olara.fr",
    url: "https://olara.fr/en",
    year: "2026",
    services: ["E-commerce", "Beauty", "Shopify"],
    summary:
      "Parisian parfumerie trading since 1999 — a catalogue of niche and heritage houses, from fragrance to skincare, made easy to wander.",
    from: "#4a1942",
    to: "#c9a227",
    size: "1440 × 5409",
    image: "/clients/olara.56658590.jpg",
  },
  {
    name: "Quatre-Quarts",
    domain: "quatrequarts.fr",
    url: "https://quatrequarts.fr/",
    year: "2026",
    services: ["Brand site", "Coworking"],
    summary:
      "A coworking café in central Dijon with a lot under one roof — desks, meeting rooms, domiciliation and events — now with a site to match.",
    from: "#a16207",
    to: "#ea580c",
    size: "1440 × 4680",
    image: "/clients/quatrequarts.37b4fbac.jpg",
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
  // The peek is `hidden mouse:grid` — on a coarse pointer it never renders at
  // all, so warming its screenshots there spends ~1.4 MB of a phone's data on
  // markup that device can't reach. Fine pointers still get the full warm.
  const pointer = usePointer();
  const canPeek = pointer?.enabled ?? false;
  // Warm the peek screenshots a screen ahead of the ledger arriving. They're
  // the biggest images on the site and they live inside a collapsed row, so
  // they can't be lazy-loaded the ordinary way (see LedgerRow) — this is what
  // keeps ~1.5 MB off the initial load without risking a half-painted peek.
  const ledgerNear = useInView(ledgerRef, {
    once: true,
    margin: "800px 0px 800px 0px",
  });
  // Same trick for the two featured screenshots: their reveal wrapper is
  // clipped to zero height until the board animates in, so `loading="lazy"`
  // never fires and both (~957 KB) landed during the initial page load,
  // competing with the hero. A screen and a half of margin is far more than
  // the reveal needs to have them decoded before it runs.
  const boardNear = useInView(boardRef, {
    once: true,
    margin: "800px 0px 800px 0px",
  });

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

        {/* Featured artboards — two equal frames staggered as a mirrored pair:
            JIJI flush left on row one (cols 1-9), Poké Bowl flush right on row
            two (cols 4-12). Each is inset three columns on the opposite side,
            so the offset reads as deliberate rather than as two frames that
            failed to line up, and Poké Bowl still clears JIJI's whole column
            (frame, copy and hand note). Hovering one gives it the design-tool
            selection treatment: accent outline, corner handles, dimension
            badge, and the page slowly pans inside the frame like it is being
            scrolled. */}
        <div
          ref={boardRef}
          className="relative mt-14 grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-6 md:gap-y-0"
        >
          <div className="relative md:col-span-9 md:row-start-1">
            <FeaturedFrame
              site={FEATURED[0]}
              index={0}
              show={boardInView}
              warm={boardNear}
              delay={0}
              aspect="aspect-[16/9]"
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

          {/* mt-16, not mt-6: the hand note hangs 2rem below JIJI's frame and
              this row drifts up to 40px upward on its parallax, so a 24px gap
              put Poké Bowl's frame straight through the note's lower half —
              the one thing the stagger above is documented to avoid. */}
          <Parallax
            offset={40}
            className="md:col-span-9 md:col-start-4 md:row-start-2 md:mt-16"
          >
            <FeaturedFrame
              site={FEATURED[1]}
              index={1}
              show={boardInView}
              warm={boardNear}
              delay={0.15}
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
                warm={ledgerNear && canPeek}
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

// The page pans inside the frame on hover, riding all the way down to the
// site's footer. 100cqh is the artboard's own height (it is a size container),
// so calc(100cqh − 100%) is exactly coverHeight − frameHeight — the pan lands
// on the page's end, never past it; min() guards covers shorter than the
// frame. Linear easing keeps the speed constant the whole way down — an eased
// curve over a multi-thousand-px travel is what read as a mid-pan speed-up —
// and the short base duration glides the page back up quickly on mouse-out.
// No permanent will-change: these are 1440-wide full-page captures several
// thousand pixels tall, and hinting them pinned both in compositor memory for
// a hover most visitors never perform (the ledger's identical pan learned this
// first — see its willChange note). The 1100ms base transition is plenty of
// time to promote the layer on hover instead.
const PAN =
  "absolute inset-x-0 top-0 w-full transition-transform duration-[1100ms] ease-out mouse:group-hover:duration-[14000ms] mouse:group-hover:ease-linear mouse:group-hover:translate-y-[min(0px,calc(100cqh_-_100%))] mouse:group-hover:will-change-transform";

function FeaturedFrame({
  site,
  index,
  show,
  warm,
  delay,
  aspect,
}: {
  site: ClientSite;
  index: number;
  show: boolean;
  /** Screenshot is within a screen-and-a-half — safe to put on the wire. */
  warm: boolean;
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
        {/* Artboard — a size container so the pan (see PAN) can measure it.
            Square by rule, not by oversight: this is a window onto a real site,
            and a browser viewport has square corners. Rounding it made it read
            as "a card containing a website" rather than as the website. Chrome
            we build (buttons, chips, panels) keeps its radius; the simulated
            browser UI *inside* these previews keeps its own too, since that's
            standing in for a site's interface rather than framing it.
            The two selection rings below overlay this box at inset-0 — they
            have to stay square with it or they'd ring a sharp shot with a
            rounded outline. */}
        <div
          className={`relative overflow-hidden border border-hairline bg-[#0b0b0d] [container-type:size] ${aspect}`}
        >
          {/* The page streams in top-to-bottom while the entrance selection is
              on — clip and scanline share one duration/ease so the line rides
              exactly on the develop edge. The screenshot below must not carry
              loading="lazy": this clip keeps it hidden until the reveal runs,
              so the browser never counts it as visible and never fetches it —
              the artboard just renders empty. */}
          <motion.div
            className="absolute inset-0"
            initial={reduced ? false : { clipPath: "inset(0% 0% 101% 0%)" }}
            animate={
              show && !reduced ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined
            }
            transition={{ duration: 1.0, delay: delay + 0.45, ease: EASE }}
          >
            {site.image ? (
              // <picture> with an explicit media query rather than a srcset of
              // width descriptors: the frame renders at ~894 CSS px, so on a
              // DPR 1 desktop a `w`-descriptor set would have picked the 1024
              // copy and quietly changed what desktop receives. A media rule
              // draws the line exactly where it was meant to be — phones take
              // the 1024, every other viewport keeps the master untouched.
              <picture>
                {warm && site.imageMobile && (
                  <source
                    srcSet={site.imageMobile}
                    media="(max-width: 767px)"
                    type="image/jpeg"
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  // Same reasoning as the ledger peek: this wrapper is clipped
                  // to `inset(0 0 101% 0)` until the reveal runs, so the image
                  // has no area for `loading="lazy"` to test and the browser
                  // fetched it during the initial load. `warm` fires 800px out,
                  // long before the reveal, so nothing arrives late.
                  src={warm ? site.image : undefined}
                  alt={`${site.name} — website`}
                  decoding="async"
                  className={PAN}
                />
              </picture>
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
              className="absolute inset-0 border-[1.5px] border-indigo-accent"
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
            className="absolute inset-0 border-[1.5px] border-indigo-accent"
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
  warm,
  onEnter,
}: {
  site: ClientSite;
  number: number;
  open: boolean;
  dim: boolean;
  /** The ledger is close enough that the peek's screenshot should be fetched. */
  warm: boolean;
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

        {/* Peek — a near-artboard-height window onto the site. Opens at the
            page's top and rides all the way down to the footer while hovered,
            as if the page were being scrolled. Mouse-only: rows are plain
            links on touch. */}
        <div
          className="hidden mouse:grid transition-[grid-template-rows] duration-500 ease-out-expo"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            {/* Same viewport rule as the artboard above — square. A size
                container so the pan below can measure it. */}
            <div className="relative mb-5 h-[30rem] overflow-hidden border border-hairline bg-[#0b0b0d] [container-type:size]">
              {/* Same rule as the featured frames' PAN: 100cqh is the window's
                  own height and the transform's 100% is the page's, so
                  calc(100cqh − 100%) lands exactly on the site's footer and
                  never past it; min() guards pages shorter than the window.
                  These ledger screenshots are far taller than the featured
                  ones (Julia Paris alone is 1440 × 6369), which is why the old
                  flat −520px read as barely moving. Linear the whole way down,
                  and a short eased return so it glides back up on mouse-out. */}
              <div
                className="absolute inset-x-0 top-0 w-full"
                style={{
                  transform: open
                    ? "translateY(min(0px, calc(100cqh - 100%)))"
                    : "translateY(0px)",
                  transition: open
                    ? "transform 20s linear"
                    : "transform 1.1s cubic-bezier(0.16,1,0.3,1)",
                  // Promoted only while the row is actually peeked. These are
                  // 1440-wide full-page captures several thousand pixels tall,
                  // so a permanent hint pinned three of them in compositor
                  // memory for a hover that most visitors never perform. The
                  // row's 500ms grid expansion runs before any of the pan is
                  // visible, which is ample time to rasterise the layer.
                  willChange: open ? "transform" : undefined,
                }}
              >
                {site.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    // `loading="lazy"` is no use here: the peek's container is
                    // collapsed to zero height, and a zero-area image never
                    // enters the lazy-loading viewport check — the browser
                    // fetches it immediately regardless. Withholding the src
                    // until the ledger is a screen away is the only thing that
                    // actually defers it. Nothing renders either way while the
                    // row is shut, so there's no visual difference.
                    src={warm ? site.image : undefined}
                    alt=""
                    decoding="async"
                    className="w-full"
                  />
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
