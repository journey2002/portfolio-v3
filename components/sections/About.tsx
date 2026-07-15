"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useInView, type Variants } from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import { usePointer } from "@/components/ui/PointerProvider";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay },
  }),
};

// Shared viewport config for every hand-drawn mark — they draw once, just
// before the phrase is comfortably on screen.
const DRAW_VIEWPORT = { once: true, margin: "-12%" } as const;

/**
 * About, rethought as a designer's hand-annotated note rather than a clinical
 * "ID card + stat block". The bio is written in the first person and key phrases
 * are circled / underlined / highlighted with ink marks that *draw themselves* as
 * the section scrolls into view, signed off by hand. Beside it, a compact "short
 * version" card carries the essential facts. Below both, the "loud part": a row
 * of tilted art prints scattered across the desk — taped down, hand-captioned,
 * draggable on desktop — that pays off the headline with actual color. Dark
 * premium canvas is unchanged; the soul is handmade.
 */
export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });

  const tags = ["UX/UI Design", "Digital Art", "3D Art", "Anime", "Drawing"];

  return (
    <section
      id="about"
      className="relative overflow-hidden py-32 md:py-44"
    >
      {/* Shared ink gradient — referenced by every hand-drawn stroke below so
          the marginalia carries the same indigo→violet accent as the brand. */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="ink-accent" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="var(--accent-glow-1)" />
            <stop offset="100%" stopColor="var(--accent-glow-2)" />
          </linearGradient>
        </defs>
      </svg>

      <SectionLabel index="01" caption="About" align="right" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-6">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="col-span-12 sm:col-span-6"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-ink-subtle">
              <span className="text-ink">[01]</span> &nbsp; About me
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <SplitText
                text="A quiet designer with"
                as="span"
                className="block"
                immediate={false}
                stagger={0.022}
                fromY={42}
              />
              <SplitText
                text="loud ideas."
                as="span"
                className="block"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                immediate={false}
                stagger={0.025}
                delay={0.18}
                fromY={42}
                fromRotate={-4}
              />
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={0.2}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="col-span-12 hidden text-right text-[10px] uppercase tracking-[0.35em] text-ink-faint sm:col-span-6 sm:block"
          >
            Profile · 01 / 05
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          custom={0.1}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="mt-10 h-px w-full origin-left bg-hairline"
          style={{ transformOrigin: "0% 50%" }}
        />

        {/* ── Hand-annotated note + taped portrait ─────────────────────────── */}
        <div
          ref={ref}
          className="grid grid-cols-1 gap-y-16 pb-10 pt-20 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0"
        >
          {/* The note (main). The split waits for lg — at md the facts card
              would be ~260px wide and its key/value rows overflow. */}
          <div className="lg:col-span-7 lg:pr-6">
            {/* Handwritten kicker — tilted, like a margin scribble */}
            <motion.p
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="-rotate-2 font-hand text-2xl text-[color:var(--accent-soft-2)]"
            >
              a few true things —
            </motion.p>

            {/* First-person statement with self-drawing ink marks */}
            <motion.p
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="mt-5 text-2xl leading-snug text-ink sm:text-3xl sm:leading-snug"
            >
              Hi, I&apos;m{" "}
              <span className="font-medium text-ink-strong">Worapat</span>, a UX/UI
              designer and digital artist from Bangkok who turns{" "}
              <InkMark variant="circle" delay={0.7}>
                half-formed ideas
              </InkMark>{" "}
              into interfaces people actually{" "}
              <InkMark variant="underline" delay={1.1}>
                love
              </InkMark>
              .
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg"
            >
              Proud Thai-Nichi grad. Most days I&apos;m somewhere between{" "}
              <InkMark variant="highlight" delay={1.3}>
                Figma, Procreate &amp; Blender
              </InkMark>
              , researching, sketching, and chasing the moment a messy concept
              finally clicks into place.
            </motion.p>

            {/* Signature row */}
            <motion.div
              variants={fadeUp}
              custom={0.3}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="mt-9 flex items-center gap-4"
            >
              <span className="font-hand text-4xl leading-none text-ink-strong sm:text-5xl">
                Worapat
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                Bangkok · open to projects
              </span>
            </motion.div>

            {/* Interest "stickers" — tilted, slightly imperfect chips */}
            <motion.div
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.35 },
                },
              }}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-3"
            >
              <span className="font-hand text-xl text-ink-subtle">
                into:
              </span>
              {tags.map((tag, i) => (
                <motion.span
                  key={tag}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 14,
                      rotate: i % 2 === 0 ? -5 : 5,
                    },
                    show: {
                      opacity: 1,
                      y: 0,
                      rotate: i % 2 === 0 ? -2.5 : 2,
                      transition: { duration: 0.6, ease: EASE },
                    },
                  }}
                  whileHover={{
                    rotate: 0,
                    y: -3,
                    borderColor: "rgb(var(--accent-2) / 0.5)",
                    color: "rgb(var(--ink-strong))",
                  }}
                  className="cursor-default rounded-[10px] border border-hairline bg-surface/40 px-3.5 py-1.5 text-xs text-ink-muted shadow-[0_2px_12px_rgba(0,0,0,0.3)] backdrop-blur"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* The facts — a compact info card, vertically centred next to the note */}
          <div className="lg:col-span-5 lg:flex lg:items-center">
            <motion.div
              variants={fadeUp}
              custom={0.3}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="relative w-full max-w-sm lg:ml-auto"
            >
              <div className="rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur shadow-[0_30px_70px_-40px_rgba(0,0,0,0.85)]">
                {/* Header — handwritten label with a hand-drawn underline */}
                <div className="flex items-end justify-between">
                  <span className="font-hand text-2xl leading-none text-[color:var(--accent-soft-2)]">
                    the short version
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                    at a glance
                  </span>
                </div>
                <svg
                  aria-hidden
                  viewBox="0 0 200 8"
                  preserveAspectRatio="none"
                  fill="none"
                  className="mt-2 h-2 w-36 overflow-visible"
                >
                  <motion.path
                    d="M2 5 C 40 1, 80 8, 120 4 C 150 2, 176 7, 198 4"
                    stroke="url(#ink-accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    whileInView={{ pathLength: 1, opacity: 1 }}
                    viewport={DRAW_VIEWPORT}
                    transition={{
                      duration: 0.7,
                      ease: "easeInOut",
                      delay: 0.5,
                      opacity: { duration: 0.01, delay: 0.5 },
                    }}
                  />
                </svg>

                {/* Vitals — key/value rows with hairline leaders */}
                <ul className="mt-6 space-y-3.5 text-sm">
                  {[
                    { k: "Based", v: "Bangkok, TH" },
                    { k: "Focus", v: "UX/UI · Illustration · 3D" },
                    { k: "Tools", v: "Figma · Procreate · Blender" },
                    { k: "Studied", v: "TNI · Class of '20" },
                  ].map((row) => (
                    <li key={row.k} className="flex items-baseline gap-3">
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-ink-faint">
                        {row.k}
                      </span>
                      <span className="h-px flex-1 translate-y-[-3px] bg-hairline" />
                      <span className="shrink-0 text-ink">{row.v}</span>
                    </li>
                  ))}
                </ul>

                <div className="my-6 h-px w-full bg-hairline" />

                {/* Status — the live, important bit */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-ink-faint">
                    Status
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Open to projects
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── The loud part — art prints scattered on the desk ─────────────── */}
        <ArtDesk />

        <motion.div
          variants={fadeUp}
          custom={0.4}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="mt-6 h-px w-full bg-hairline"
        />
      </div>
    </section>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────────── */

// Prints scattered on the desk. The gradients are PLACEHOLDERS standing in for
// real pieces — to swap one in, drop the file in /public/art and set `img`
// (e.g. img: "/art/vroid-stage.png"); the gradient stays behind it as the
// loading backdrop. `tilt` is the resting rotation; `offset` staggers the
// baselines so the row reads as tossed-down prints, not a grid.
type ArtPrint = {
  id: string;
  caption: string;
  alt: string;
  tilt: number;
  offset: string;
  bg: string;
  img?: string;
};

const ART_PRINTS: ArtPrint[] = [
  {
    id: "vroid-stage",
    caption: "vroid idol — stage lights",
    alt: "VRoid character glowing on a concert stage",
    tilt: -5,
    offset: "mt-5 lg:mt-10",
    bg: [
      "radial-gradient(circle at 26% 22%, rgba(255,255,255,0.95) 0 2px, transparent 3px)",
      "radial-gradient(circle at 68% 12%, rgba(255,255,255,0.85) 0 1.5px, transparent 2.5px)",
      "radial-gradient(circle at 82% 40%, rgba(255,255,255,0.7) 0 1px, transparent 2px)",
      "radial-gradient(ellipse at 50% 104%, rgba(255,208,130,0.6) 0 24%, transparent 58%)",
      "linear-gradient(165deg, #7fb7f7 0%, #b9c7fb 42%, #efe9ff 100%)",
    ].join(", "),
  },
  {
    id: "donut",
    caption: "everyone starts with the donut",
    alt: "3D render of a pink-frosted donut with sprinkles",
    tilt: 3,
    offset: "mt-0",
    bg: [
      "radial-gradient(circle at 42% 38%, rgba(255,255,255,0.5) 0 2px, transparent 3px)",
      "radial-gradient(circle at 60% 30%, rgba(126,222,255,0.9) 0 1.5px, transparent 2.5px)",
      "radial-gradient(circle at 36% 52%, rgba(255,233,120,0.9) 0 1.5px, transparent 2.5px)",
      "radial-gradient(circle at 50% 44%, #170b12 0 12%, #f795bd 13% 38%, #fbb7d2 39% 45%, #e97fae 46% 49%, #170b12 50%)",
    ].join(", "),
  },
  {
    id: "magenta",
    caption: "magenta mood, phone up",
    alt: "Anime character raising a phone against a hot magenta backdrop",
    tilt: -3.5,
    offset: "mt-7 lg:mt-14",
    bg: [
      "radial-gradient(ellipse at 28% 16%, rgba(255,255,255,0.4) 0 12%, transparent 46%)",
      "linear-gradient(150deg, #ff3ad9 0%, #e214be 55%, #8f0c9c 100%)",
    ].join(", "),
  },
  {
    id: "chair",
    caption: "one honest chair",
    alt: "Product render of a wooden chair on a dark backdrop",
    tilt: 4.5,
    offset: "mt-3 lg:mt-5",
    bg: [
      "radial-gradient(ellipse at 55% 42%, #d7b58e 0 16%, rgba(215,181,142,0.35) 34%, transparent 58%)",
      "linear-gradient(165deg, #26211c 0%, #17130f 65%, #0e0c0a 100%)",
    ].join(", "),
  },
];

const cardVariants: Variants = {
  hidden: (tilt: number) => ({
    opacity: 0,
    y: 64,
    rotate: tilt * 2.4,
    scale: 0.94,
  }),
  show: (tilt: number) => ({
    opacity: 1,
    y: 0,
    rotate: tilt,
    scale: 1,
    transition: { duration: 0.8, ease: EASE },
  }),
};

/**
 * The "loud part" — a row of tilted art prints, taped down with hand-written
 * captions, paying off the headline with actual color. On desktop each print is
 * draggable around the desk (constrained to the strip, no momentum, so it feels
 * like sliding paper); the last-touched print rides on top. On touch the drags
 * are inert, so the strip falls back to a snap-scrolling row instead.
 *
 * Rotation lives on the framer card itself (variants/hover/drag all negotiate
 * it), so the vertical scatter sits on the plain wrapper div — framer would
 * drop any Tailwind transform sharing its element.
 */
function ArtDesk() {
  const pointer = usePointer();
  const canDrag = !!pointer?.enabled;
  const [topId, setTopId] = useState<string | null>(null);

  return (
    <div className="pt-16 lg:pt-20">
      {/* Kicker — the same margin-scribble voice as the note above */}
      <div className="flex items-end justify-between gap-6">
        <motion.p
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="show"
          viewport={DRAW_VIEWPORT}
          className="-rotate-2 font-hand text-2xl text-[color:var(--accent-soft-2)]"
        >
          …and the loud part —
        </motion.p>
        {canDrag && (
          <motion.span
            variants={fadeUp}
            custom={0.25}
            initial="hidden"
            whileInView="show"
            viewport={DRAW_VIEWPORT}
            className="hidden rotate-1 font-hand text-lg text-ink-faint lg:inline"
          >
            (go on — drag them around)
          </motion.span>
        )}
      </div>

      {/* The desk. Mobile: full-bleed snap-scroll row. Desktop: static spread
          each print can be shuffled around within. */}
      <motion.div
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-8%" }}
        className="-mx-6 mt-2 flex snap-x gap-7 overflow-x-auto px-6 pb-4 pt-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-10 sm:px-10 lg:mx-0 lg:snap-none lg:justify-center lg:gap-10 lg:overflow-visible lg:px-0 xl:gap-14"
      >
        {ART_PRINTS.map((p) => (
          <div
            key={p.id}
            className={`relative shrink-0 snap-center ${p.offset}`}
            style={{ zIndex: topId === p.id ? 30 : undefined }}
          >
            <motion.div
              custom={p.tilt}
              variants={cardVariants}
              drag={canDrag}
              // Fixed constraints around each print's OWN resting spot — enough
              // travel to overlap a neighbour, never enough to leave the desk.
              // Deliberately not a measured ref (dragConstraints={containerRef}):
              // framer re-measures ref boxes on resize and physically shoves any
              // "outside" element back in, which piles every print onto one spot
              // when the box measures degenerate (hidden tab, mid-resize mobile
              // scroll row). Static offsets involve no measurement at all.
              dragConstraints={{ left: -120, right: 120, top: -60, bottom: 100 }}
              dragElastic={0.16}
              dragMomentum={false}
              onDragStart={() => setTopId(p.id)}
              whileHover={{ rotate: 0, y: -8, scale: 1.03 }}
              whileDrag={{ rotate: 0, scale: 1.06 }}
              data-cursor-hover
              className="relative w-40 select-none sm:w-48 md:w-52 xl:w-56"
            >
              {/* Tape holding the print down — leans against the tilt */}
              <span
                aria-hidden
                className="absolute -top-3 left-1/2 z-10 h-6 w-16 rounded-[2px] border border-white/10 bg-white/10 shadow-sm backdrop-blur-[2px]"
                style={{
                  transform: `translateX(-50%) rotate(${-p.tilt * 1.4}deg)`,
                }}
              />

              {/* The print itself */}
              <div
                className="relative aspect-[3/4] overflow-hidden rounded-xl border border-hairline shadow-[0_28px_55px_-26px_rgba(0,0,0,0.85)]"
                style={{ background: p.bg }}
              >
                {p.img && (
                  <Image
                    src={p.img}
                    alt={p.alt}
                    fill
                    draggable={false}
                    sizes="(min-width: 1280px) 224px, (min-width: 640px) 208px, 160px"
                    className="object-cover"
                  />
                )}
                <span
                  aria-hidden
                  className="noise-overlay pointer-events-none absolute inset-0"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/10 to-transparent"
                />
              </div>

              {/* Hand-written caption riding along under the print */}
              <p className="mt-3 text-center font-hand text-lg leading-tight text-ink-muted">
                {p.caption}
              </p>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

type InkVariant = "underline" | "circle" | "highlight";

/**
 * Wraps an inline phrase with a hand-drawn ink mark that *draws itself* the first
 * time it scrolls into view (stroke `pathLength` 0→1 / highlighter scaleX). Keep
 * phrases short — the overlay is sized to the phrase's box, so a phrase that wraps
 * to a second line would misalign its mark.
 */
function InkMark({
  children,
  variant,
  delay = 0,
}: {
  children: React.ReactNode;
  variant: InkVariant;
  delay?: number;
}) {
  if (variant === "highlight") {
    return (
      <span className="relative inline-block whitespace-nowrap text-ink-strong">
        <motion.span
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={DRAW_VIEWPORT}
          transition={{ duration: 0.6, ease: EASE, delay }}
          className="absolute inset-x-[-0.15em] bottom-[0.05em] top-[0.1em] -z-10 origin-left -rotate-1 rounded-[3px] bg-gradient-to-r from-indigo-accent/25 to-violet-accent/25"
        />
        {children}
      </span>
    );
  }

  if (variant === "circle") {
    return (
      <span className="relative inline-block whitespace-nowrap text-ink-strong">
        {children}
        <svg
          aria-hidden
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
          fill="none"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[116%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
        >
          <motion.path
            d="M44 12 C 96 1, 168 4, 188 28 C 200 46, 156 72, 96 73 C 36 74, 6 60, 11 36 C 15 18, 28 14, 58 11"
            stroke="url(#ink-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={DRAW_VIEWPORT}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              delay,
              opacity: { duration: 0.01, delay },
            }}
          />
        </svg>
      </span>
    );
  }

  // underline
  return (
    <span className="relative inline-block whitespace-nowrap text-ink-strong">
      {children}
      <svg
        aria-hidden
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
        fill="none"
        className="pointer-events-none absolute -bottom-[0.18em] left-0 h-[0.45em] w-full overflow-visible"
      >
        <motion.path
          d="M1 6 C 16 2, 33 10, 50 5 C 67 1, 83 10, 99 5"
          stroke="url(#ink-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={DRAW_VIEWPORT}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
            delay,
            opacity: { duration: 0.01, delay },
          }}
        />
      </svg>
    </span>
  );
}

