"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";
import { Play } from "lucide-react";
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

type Plate = {
  id: string;
  caption: string;
  alt: string;
  src: string;
  poster: string;
  /** Backdrop under the frame while the poster loads, toned from the footage so
   *  a slow connection never flashes an empty box against the page. */
  bg: string;
};

const PLATES: Plate[] = [
  {
    id: "mesh",
    caption: "Nodes, still talking",
    alt: "Low-poly mesh of triangular panels wired together with glowing violet edges, drifting",
    src: "/assets/move1.mp4",
    poster: "/assets/posters/move1.jpg",
    bg: "linear-gradient(160deg, #1b1420 0%, #0c0a0f 100%)",
  },
  {
    id: "grid",
    caption: "Cyan cubes, magenta wiring",
    alt: "Neon grid of cyan cubes strung together with magenta lines, panning",
    src: "/assets/move2.mp4",
    poster: "/assets/posters/move2.jpg",
    bg: "linear-gradient(160deg, #120a1e 0%, #08060d 100%)",
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
 * Where it used to be four gradient placeholders in four equal portrait cells,
 * it is now two real clips at their own 16:9 — a matched pair, sharing a
 * baseline, so the eye reads them as one spread rather than two exhibits.
 * What's left of the interaction is what a grid can honestly offer: the plate
 * you're pointing at plays, brightens, and takes an accent rule.
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
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.35em] text-ink-faint">
          Silent · looping
        </span>
      </div>

      <motion.div
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
        }}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-8%" }}
        className="mt-10 grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-8 md:gap-y-0"
      >
        {PLATES.map((p, i) => (
          <motion.div key={p.id} variants={fadeUp}>
            <Clip plate={p} index={i} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/**
 * One clip, framed as a plate.
 *
 * Nothing is on the wire until it's asked for: `preload="none"` plus a poster
 * cut from frame 0, so the resting state, the first frame of playback and the
 * frame it rewinds to are all the same image and the handoff is invisible.
 * A mouse plays it by pointing; touch and keyboard get the same behaviour from
 * the button underneath, which is also what reduced-motion falls back to —
 * nothing should start moving under a cursor that didn't ask for it.
 */
function Clip({ plate, index }: { plate: Plate; index: number }) {
  const figRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = useReducedMotion();
  // No margin on purpose: the question here is only "is any of this still on
  // screen", and a negative one would shrink the viewport enough that pointing
  // at a clip just entering it would start and instantly rewind the thing.
  const inView = useInView(figRef);

  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    // Rejects when a leave interrupts the start; the pause event is the source
    // of truth for state either way, so there is nothing to handle.
    videoRef.current?.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }, []);

  // A clip left running on touch shouldn't keep decoding once it's scrolled
  // off — stopping also rewinds it to the poster frame it started on.
  useEffect(() => {
    if (!inView && playing) stop();
  }, [inView, playing, stop]);

  return (
    <figure
      ref={figRef}
      className="group"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && !reduced) play();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") stop();
      }}
    >
      <button
        type="button"
        onClick={() => (playing ? stop() : play())}
        // The visible caption is a title, not a description — the button's
        // label carries what's actually on screen, since this is the control a
        // screen reader lands on.
        aria-label={`${playing ? "Pause" : "Play"} clip — ${plate.alt}`}
        className="block w-full outline-none"
      >
        <div
          data-cursor-hover
          style={{ background: plate.bg }}
          className="relative aspect-video overflow-hidden border border-hairline transition-colors duration-500 group-hover:border-ink-strong/25 group-focus-within:border-indigo-accent"
        >
          <video
            ref={videoRef}
            src={plate.src}
            poster={plate.poster}
            muted
            loop
            playsInline
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-[transform,filter] duration-[1200ms] ease-out-expo ${
              playing
                ? "brightness-100"
                : "brightness-[0.78] group-hover:brightness-95"
            } ${playing && !reduced ? "scale-[1.04]" : "scale-100"}`}
          />
          <span
            aria-hidden
            className="noise-overlay pointer-events-none absolute inset-0"
          />

          {/* Transport marker — a play glyph while the frame is a still, an
              accent dot once it's running. The only chrome laid over the art. */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-3 flex h-3 w-3 items-center justify-center"
          >
            {playing ? (
              <span className="h-1.5 w-1.5 bg-indigo-accent" />
            ) : (
              <Play
                className="h-3 w-3 text-white/55 transition-colors duration-300 group-hover:text-white"
                fill="currentColor"
                strokeWidth={0}
              />
            )}
          </span>

          {/* Accent rule that draws itself across the plate's foot on hover —
              the grid's one moving part. Held open while the clip runs, so a
              tapped plate reads as live after the finger has gone. */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left bg-indigo-accent transition-transform duration-500 ease-out-expo group-hover:scale-x-100 ${
              playing ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </div>
      </button>

      <figcaption className="flex items-baseline gap-2 pt-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted transition-colors duration-300 group-hover:text-ink-strong">
          {plate.caption}
        </span>
        <span
          aria-hidden
          className="mx-1 h-px flex-1 border-t border-dotted border-hairline"
        />
        <span className="shrink-0 font-numeral text-[10px] tabular-nums text-ink-faint">
          {String(index + 1).padStart(2, "0")}
        </span>
      </figcaption>
    </figure>
  );
}
