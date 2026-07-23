"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, type Variants } from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import { RevealLine } from "@/components/ui/Reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, delay },
  }),
};

/**
 * The record: every fact the old facts-card-that-wasn't-a-facts-card scattered
 * through the margin, set as an actual table. The previous version went to some
 * trouble to avoid looking like a spec sheet — hand-drawn leader lines, ragged
 * annotation placement, nothing aligned to anything. This one commits to being
 * one, because a spec sheet is a legitimate form and a page pretending not to be
 * a table while behaving exactly like one is just a table with worse alignment.
 */
const RECORD: { k: string; v: string; live?: boolean }[] = [
  { k: "Role", v: "UX/UI Design · Illustration · 3D" },
  { k: "Base", v: "Bangkok, TH" },
  { k: "Timezone", v: "GMT+7" },
  // Full year, not "'20": this is a credential in a record table now, not the
  // casual margin scribble it used to be. Hyphen, not an en dash — "Thai-Nichi"
  // is the institute's own spelling of its name, not a Thai–Japanese range.
  { k: "Education", v: "Thai-Nichi Institute, Class of 2020" },
  { k: "Tools", v: "Figma · Procreate · Blender" },
  { k: "Status", v: "Taking new projects", live: true },
];

const INTERESTS = [
  "ux/ui design",
  "digital art",
  "3d",
  "anime",
  "drawing",
];

/**
 * About, rebuilt as a system record rather than a performance.
 *
 * The section used to open on the sentence "a quiet designer with loud ideas"
 * and then act it out: the loud half was set at 19.4vw — roughly 370px of type
 * on a desktop screen — in an accent gradient, deliberately overrunning the
 * viewport so the section's own overflow cropped it mid-word. Everything under
 * it was marginalia: handwriting, self-drawing ink circles, leader lines hung
 * off whichever word happened to end near the right rail.
 *
 * All of that is gone. What replaces it is structural: a masthead rule, a
 * headline at a size a headline should be, the bio on a real measure beside a
 * record table, and the art laid out on a hard grid of plates. The dotted
 * leaders in the record are the same rule the Clients ledger uses to tie a
 * table of contents together — the one piece of the old marginalia vocabulary
 * that was doing structural work rather than decorating.
 */
export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section id="about" className="relative overflow-hidden py-28 md:py-36">
      {/* The section's index, kept as the giant drifting numeral the rest of
          the site uses — Work and Stack carry theirs, and About reads as a
          stray without it. It sits on z-0 behind the content, so the numeral
          can be oversized without competing with anything: nothing is set at
          that scale in the foreground any more. */}
      <SectionLabel index="01" caption="About" align="right" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10">
        {/* Headline. Two lines, flat ink, no gradient fill, and a ceiling of
            3.5rem — the type is sized to be read rather than to be an event. */}
        <h2
          className="max-w-4xl font-serif font-medium leading-[1.06] tracking-[-0.02em] text-ink-strong"
          style={{ fontSize: "clamp(1.875rem, 4.4vw, 3.5rem)" }}
        >
          <RevealLine>
            <span className="block">Designer and digital artist,</span>
          </RevealLine>
          <RevealLine delay={0.1}>
            <span className="block text-ink-muted">working out of Bangkok.</span>
          </RevealLine>
        </h2>

        {/* ── Statement + record ──────────────────────────────────────────
            One hard rule top and bottom, one vertical rule between the two
            columns. The bio keeps a readable measure on the left; every fact
            that used to hang in the margin is a row on the right. */}
        <div
          ref={ref}
          className="mt-16 grid grid-cols-12 border-y border-ink-strong/20 sm:mt-20"
        >
          <div className="col-span-12 py-10 lg:col-span-7 lg:border-r lg:border-hairline lg:pr-14">
            <motion.p
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="text-xl leading-snug text-ink sm:text-2xl sm:leading-snug"
            >
              I&apos;m{" "}
              <span className="text-ink-strong">Worapat</span> — a UX/UI designer
              and digital artist who builds interfaces for apps, brands, and the
              occasional side project.
            </motion.p>

            <motion.p
              variants={fadeUp}
              custom={0.1}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="mt-7 max-w-xl text-base leading-relaxed text-ink-muted"
            >
              Most days I&apos;m somewhere between Figma, Procreate and Blender:
              researching, sketching, and pushing until a messy idea finally
              clicks.
            </motion.p>

            {/* Interests, set as a divided strip instead of five bordered
                pills or a line of handwriting. */}
            <motion.ul
              variants={fadeUp}
              custom={0.2}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="mt-10 flex flex-wrap items-center border-t border-hairline pt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-ink-subtle"
            >
              {INTERESTS.map((tag, i) => (
                <li
                  key={tag}
                  className={`py-1 ${
                    i === 0 ? "pr-4" : "border-l border-hairline px-4"
                  }`}
                >
                  {tag}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* The record. Dotted leaders run from key to value — the same
              `border-t border-dotted border-hairline` rule the Clients ledger
              uses, so a row here and a row there read as one system. */}
          <motion.dl
            variants={fadeUp}
            custom={0.15}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="col-span-12 border-t border-hairline py-10 lg:col-span-5 lg:border-t-0 lg:pl-14"
          >
            {RECORD.map(({ k, v, live }) => (
              <div
                key={k}
                className="flex items-baseline gap-2 border-b border-hairline py-3 last:border-b-0"
              >
                {/* ink-subtle rather than ink-faint: these keys are content,
                    not chrome, and faint drops to ~2.3:1 on the light canvas. */}
                <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-subtle">
                  {k}
                </dt>
                <span
                  aria-hidden
                  className="mx-1 h-px flex-1 border-t border-dotted border-hairline"
                />
                <dd className="flex shrink-0 items-center gap-2 text-right font-mono text-[11px] leading-relaxed text-ink">
                  {live && (
                    <span className="relative flex h-1.5 w-1.5 shrink-0 translate-y-[-1px]">
                      <span className="absolute inset-0 animate-pulse-dot bg-violet-accent" />
                      <span className="relative h-1.5 w-1.5 bg-violet-accent" />
                    </span>
                  )}
                  {v}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <Plates />
      </div>
    </section>
  );
}

/* ── Plates ────────────────────────────────────────────────────────────────── */

// The gradients are PLACEHOLDERS standing in for real pieces — to swap one in,
// drop the file in /public/art and set `img` (e.g. img: "/art/vroid-stage.png");
// the gradient stays behind it as the loading backdrop.
type Plate = {
  id: string;
  caption: string;
  alt: string;
  bg: string;
  img?: string;
};

const PLATES: Plate[] = [
  {
    id: "vroid-stage",
    caption: "VRoid idol — stage lights",
    alt: "VRoid character glowing on a concert stage",
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
    caption: "Everyone starts with the donut",
    alt: "3D render of a pink-frosted donut with sprinkles",
    bg: [
      "radial-gradient(circle at 42% 38%, rgba(255,255,255,0.5) 0 2px, transparent 3px)",
      "radial-gradient(circle at 60% 30%, rgba(126,222,255,0.9) 0 1.5px, transparent 2.5px)",
      "radial-gradient(circle at 36% 52%, rgba(255,233,120,0.9) 0 1.5px, transparent 2.5px)",
      "radial-gradient(circle at 50% 44%, #170b12 0 12%, #f795bd 13% 38%, #fbb7d2 39% 45%, #e97fae 46% 49%, #170b12 50%)",
    ].join(", "),
  },
  {
    id: "magenta",
    caption: "Magenta mood, phone up",
    alt: "Anime character raising a phone against a hot magenta backdrop",
    bg: [
      "radial-gradient(ellipse at 28% 16%, rgba(255,255,255,0.4) 0 12%, transparent 46%)",
      "linear-gradient(150deg, #ff3ad9 0%, #e214be 55%, #8f0c9c 100%)",
    ].join(", "),
  },
  {
    id: "chair",
    caption: "One honest chair",
    alt: "Product render of a wooden chair on a dark backdrop",
    bg: [
      "radial-gradient(ellipse at 55% 42%, #d7b58e 0 16%, rgba(215,181,142,0.35) 34%, transparent 58%)",
      "linear-gradient(165deg, #26211c 0%, #17130f 65%, #0e0c0a 100%)",
    ].join(", "),
  },
];

/**
 * The art, laid out as plates on a grid.
 *
 * The previous version scattered these as tilted prints held down with tape,
 * each one draggable around a "desk", tilting under the cursor with a
 * light-cone glare tracking the pointer across it. That was a lot of machinery
 * — a hand-rolled pan with its own clamped bounds, three chased springs per
 * card, a three-layer holographic gradient — in service of pretending a web
 * page is a physical surface. The work is the same work on a grid, and here it
 * is legible at a glance instead of piled at angles.
 *
 * What's left of the interaction is what a grid can honestly offer: the plate
 * you're pointing at brightens and takes an accent rule.
 */
function Plates() {
  return (
    <div className="mt-20 sm:mt-24">
      {/* Unnumbered on purpose: this is a sub-header inside section 01, and a
          "02" here would read as the section index that Work already owns. */}
      <div className="flex items-center gap-4 border-t border-ink-strong/20 pt-3 sm:gap-6">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.35em] text-ink-subtle">
          Selected output
        </span>
        <span aria-hidden className="h-px flex-1 bg-hairline" />
      </div>

      <motion.div
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-8%" }}
        className="mt-10 grid grid-cols-1 border-l border-t border-hairline sm:grid-cols-2 lg:grid-cols-4"
      >
        {PLATES.map((p, i) => (
          <motion.figure
            key={p.id}
            variants={fadeUp}
            className="group border-b border-r border-hairline"
          >
            <div
              className="relative aspect-[4/5] overflow-hidden transition-[filter] duration-300 group-hover:brightness-110"
              style={{ background: p.bg }}
            >
              {p.img && (
                <Image
                  src={p.img}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              )}
              <span
                aria-hidden
                className="noise-overlay pointer-events-none absolute inset-0"
              />
              {/* Accent rule that draws itself across the plate's foot on
                  hover — the grid's one moving part. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-indigo-accent transition-transform duration-500 ease-out-expo group-hover:scale-x-100"
              />
            </div>

            <figcaption className="flex items-baseline gap-2 px-4 py-3.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-300 group-hover:text-ink-strong">
                {p.caption}
              </span>
              <span
                aria-hidden
                className="mx-1 h-px flex-1 border-t border-dotted border-hairline"
              />
              <span className="shrink-0 font-numeral text-[10px] tabular-nums text-ink-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </motion.div>
    </div>
  );
}
