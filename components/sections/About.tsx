"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";

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
 * version" card carries the essential facts. Dark premium canvas is unchanged;
 * the soul is handmade.
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
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={DRAW_VIEWPORT}
                    transition={{ duration: 0.7, ease: "easeInOut", delay: 0.5 }}
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
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={DRAW_VIEWPORT}
            transition={{ duration: 0.8, ease: "easeInOut", delay }}
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
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={DRAW_VIEWPORT}
          transition={{ duration: 0.6, ease: "easeInOut", delay }}
        />
      </svg>
    </span>
  );
}

