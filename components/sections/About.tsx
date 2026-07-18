"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionStyle,
  type PanInfo,
  type Variants,
} from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import { Handwrite, RevealLine } from "@/components/ui/Reveal";
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
          <div className="col-span-12 sm:col-span-6">
            <motion.p
              variants={fadeUp}
              custom={0}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="text-xs uppercase tracking-[0.25em] text-ink-subtle"
            >
              <span className="text-ink">[01]</span> &nbsp; About me
            </motion.p>
            {/* Each line rises out of a mask behind a marquee-selection sweep
                (RevealLine) — the same selection grammar as the intro. */}
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <RevealLine>
                <SplitText
                  text="A quiet designer with"
                  as="span"
                  className="block"
                />
              </RevealLine>
              <RevealLine delay={0.14}>
                <SplitText
                  text="loud ideas."
                  as="span"
                  className="block"
                  charClassName="bg-accent-gradient bg-clip-text text-transparent"
                />
              </RevealLine>
            </h2>
          </div>

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
            {/* Handwritten kicker — tilted, like a margin scribble. Wipes in
                left-to-right (Handwrite) as if the pen is writing it. */}
            <p className="-rotate-2 font-hand text-2xl text-[color:var(--accent-soft-2)]">
              <Handwrite duration={0.8}>a few true things —</Handwrite>
            </p>

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
              designer and digital artist from Bangkok who designs interfaces
              for{" "}
              <InkMark variant="circle" delay={0.7}>
                apps, brands,
              </InkMark>{" "}
              and the occasional{" "}
              <InkMark variant="underline" delay={1.1}>
                side project
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
              , researching, sketching, and pushing until a messy idea finally clicks.
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
                {/* The signature is written, not faded — the wipe starts once
                    the row's paper has landed. */}
                <Handwrite delay={0.4} duration={1.05}>
                  Worapat
                </Handwrite>
              </span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                Bangkok
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

                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-ink-faint">
                    Right now
                  </span>
                  <span className="text-sm text-ink">Taking new projects</span>
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

// Drag tuning for the desk prints. framer's built-in `drag` tracks the cursor
// 1:1 and offers no way to slow that down, so ArtDesk pans by hand instead:
// every pointer delta is scaled by DRAG_FACTOR (the print travels at half the
// cursor's speed — weighted paper under friction, not an air-hockey puck) and
// hard-clamped to DESK_BOUNDS around the print's resting spot.
const DRAG_FACTOR = 0.5;
const DESK_BOUNDS = { left: -80, right: 80, top: -44, bottom: 70 };
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// Light-cone hover: the print tilts as if pressed under the cursor (the point
// beneath the pointer recedes) and a diffuse glare-line drifts on the same
// diagonal. Kept modest — the card already wobbles from its under-damped
// pick-up spring, so a steeper tilt on a 160–224px print reads busy rather
// than glossy. Pointer handlers only move TARGET values; one persistent
// useSpring per value glides after them. (Never respawn animate() per
// pointermove — each respawn restarts the spring into its slow opening
// phase, and under a real event stream the tilt crawls seconds behind the
// cursor.) The glare-line is lazier than the tilt, and only patrols a short
// stretch of the diagonal near the bottom-right corner instead of sweeping
// edge to edge.
const TILT_MAX = 9; // deg
const TILT_FOLLOW = { stiffness: 170, damping: 26 } as const;
const GLARE_FOLLOW = { stiffness: 80, damping: 24 } as const;
const GLARE_BASE = 74; // % along the 135° axis — bottom-right quadrant
const GLARE_TRAVEL = 20; // % of patrol range around it — never nears center

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
  const reduce = useReducedMotion();
  const tiltOn = canDrag && !reduce;
  const [topId, setTopId] = useState<string | null>(null);

  return (
    <div className="pt-16 lg:pt-20">
      {/* Kicker — the same margin-scribble voice as the note above, written
          in rather than faded in */}
      <div className="flex items-end justify-between gap-6">
        <p className="-rotate-2 font-hand text-2xl text-[color:var(--accent-soft-2)]">
          <Handwrite duration={0.85}>…and the loud part —</Handwrite>
        </p>
        {canDrag && (
          <span className="hidden rotate-1 font-hand text-lg text-ink-faint lg:inline">
            <Handwrite delay={0.55} duration={0.95}>
              (go on — drag them around)
            </Handwrite>
          </span>
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
          <DeskPrint
            key={p.id}
            p={p}
            canDrag={canDrag}
            tiltOn={tiltOn}
            onTop={topId === p.id}
            raise={() => setTopId(p.id)}
          />
        ))}
      </motion.div>
    </div>
  );
}

/**
 * One print on the desk. Split out of the map so each card can own real hooks:
 * the light-cone chase runs on persistent useSpring values that RETARGET as
 * the pointer moves — momentum carries through, nothing restarts. Entrance
 * variants still stagger from the desk's container (variant labels propagate
 * through component boundaries).
 */
function DeskPrint({
  p,
  canDrag,
  tiltOn,
  onTop,
  raise,
}: {
  p: ArtPrint;
  canDrag: boolean;
  tiltOn: boolean;
  onTop: boolean;
  raise: () => void;
}) {
  // Dragged offset — owned by the hand-rolled pan below.
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  // Light-cone chase: pointer handlers write these TARGETS; the springs below
  // glide after them and are what the DOM actually renders.
  const rxT = useMotionValue(0);
  const ryT = useMotionValue(0);
  const gpT = useMotionValue(GLARE_BASE);
  const rx = useSpring(rxT, TILT_FOLLOW);
  const ry = useSpring(ryT, TILT_FOLLOW);
  const gpS = useSpring(gpT, GLARE_FOLLOW);
  const gp = useMotionTemplate`${gpS}%`;

  return (
    <div
      className={`relative shrink-0 snap-center ${p.offset}`}
      style={{ zIndex: onTop ? 30 : undefined }}
    >
      <motion.div
        custom={p.tilt}
        variants={cardVariants}
        // Hand-rolled drag (see DRAG_FACTOR above): pan deltas move the
        // x/y motion values at half cursor speed, hard-clamped to fixed
        // DESK_BOUNDS around the print's own resting spot — static
        // offsets (not a measured containerRef, which framer re-measures
        // on resize and uses to shove "outside" prints into a pile).
        onPanStart={canDrag ? raise : undefined}
        onPan={
          canDrag
            ? (_: PointerEvent, info: PanInfo) => {
                x.set(
                  clamp(
                    x.get() + info.delta.x * DRAG_FACTOR,
                    DESK_BOUNDS.left,
                    DESK_BOUNDS.right,
                  ),
                );
                y.set(
                  clamp(
                    y.get() + info.delta.y * DRAG_FACTOR,
                    DESK_BOUNDS.top,
                    DESK_BOUNDS.bottom,
                  ),
                );
              }
            : undefined
        }
        // Light-cone tilt + glare tracking. The card itself is never
        // 3D-transformed (only the inner tilt layer is), so its rect
        // stays undistorted and reads true mid-pan. py is normalised to
        // the print box, not the whole card — the caption below would
        // otherwise dilute the tilt and stop the glare short of the
        // bottom edge. Clamps are load-bearing: pointer capture during a
        // pan can deliver coordinates past the card's edges.
        onPointerMove={
          tiltOn
            ? (e: React.PointerEvent) => {
                const r = e.currentTarget.getBoundingClientRect();
                const px = clamp((e.clientX - r.left) / r.width, 0, 1);
                const py = clamp(
                  (e.clientY - r.top) / ((r.width * 4) / 3),
                  0,
                  1,
                );
                rxT.set((0.5 - py) * TILT_MAX);
                ryT.set((px - 0.5) * TILT_MAX);
                // Glare rides the cursor's projection onto the
                // top-left→bottom-right diagonal, compressed into the
                // short patrol band around the low-right resting spot.
                gpT.set(GLARE_BASE + ((px + py) / 2 - 0.5) * GLARE_TRAVEL);
              }
            : undefined
        }
        // Tilt targets go flat on exit; the springs glide home. The glare
        // target stays put — recentring it would visibly drag the light
        // across the print while the layer is still fading out; the next
        // pointer-enter re-aims it before the fade-in is perceptible.
        onPointerLeave={
          tiltOn
            ? () => {
                rxT.set(0);
                ryT.set(0);
              }
            : undefined
        }
        // Hover = picking the print up: it swings PAST straight (a real
        // nudge, half its resting tilt the other way) and grows. NO `y`
        // here — the pan owns y, and a hover-exit re-home would teleport
        // a dragged print back to its resting baseline.
        whileHover={{ rotate: p.tilt * -0.5, scale: 1.06 }}
        // Press = pick up (replaces whileDrag, which only fires for the
        // built-in drag gesture). The pointer stays down through a pan,
        // so the pose holds while sliding.
        whileTap={canDrag ? { rotate: 0, scale: 1.08 } : undefined}
        // Under-damped spring so the pick-up overshoots and settles with
        // a small paper wobble — the life is in the motion, not the pose.
        // Entrance keeps its own tween (declared inside cardVariants).
        transition={{ type: "spring", stiffness: 350, damping: 14 }}
        data-cursor-hover
        style={{
          x,
          y,
          touchAction: canDrag ? "none" : undefined,
        }}
        className="group relative w-40 select-none sm:w-48 md:w-52 xl:w-56"
      >
        {/* Tilt layer — the sheet that rocks under the cursor. Wraps the
            tape and the print so both lift as one; the caption below
            stays flat on the desk. rotateX/Y live here alone, clear of
            the rotate/scale/x/y the card itself is already juggling. */}
        <motion.div
          className="relative"
          style={{
            rotateX: rx,
            rotateY: ry,
            transformPerspective: 800,
          }}
        >
          {/* Tape holding the print down — leans against the tilt. On
              hover it visibly peels: swings ~1.6× its angle, rides up 4px
              and stretches wider, as if the lifting paper is pulling
              against it. The rotation lives in a CSS var so the
              group-hover transform can scale the angle with calc(). */}
          <span
            aria-hidden
            className="absolute -top-3 left-1/2 z-10 h-6 w-16 rounded-[2px] border border-white/10 bg-white/10 shadow-sm backdrop-blur-[2px] transition-transform duration-300 ease-out group-hover:[transform:translateX(-50%)_rotate(calc(var(--tape-r)*1.6))_translateY(-4px)_scaleX(1.18)]"
            style={
              {
                "--tape-r": `${-p.tilt * 1.4}deg`,
                transform: "translateX(-50%) rotate(var(--tape-r))",
              } as React.CSSProperties
            }
          />

          {/* The print itself — it BRIGHTENS as it lifts (light catching
              the raised paper; far more legible on the dark canvas than a
              shadow change) and its shadow falls deeper underneath. */}
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-xl border border-hairline shadow-[0_28px_55px_-26px_rgba(0,0,0,0.85)] transition-[box-shadow,filter] duration-300 group-hover:brightness-110 group-hover:shadow-[0_46px_80px_-30px_rgba(0,0,0,0.9)]"
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

            {/* Framing glass, hover-only. The GLASS layer is the light-cone
                glare: a feathered beam of light on the 45° ("/") diagonal
                with a thin companion glint running ahead of it and a faint
                accent fringe trailing behind (the holographic split), all
                screened over the print and blurred so the stops melt into
                real light — no banding, no laser edge. The layer overscans
                the box (negative inset) so the blur doesn't fade at the
                clip. The GLARE below is the one-shot band that sweeps
                across on hover-in. Both clipped by the rounded box. */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute opacity-0 mix-blend-screen transition-opacity duration-500 group-hover:opacity-100"
              style={
                {
                  "--gp": gp,
                  inset: "-10%",
                  filter: "blur(6px)",
                  background: [
                    "linear-gradient(135deg, transparent calc(var(--gp) - 9%), rgba(255,255,255,0.06) calc(var(--gp) - 5%), rgba(255,255,255,0.18) calc(var(--gp) - 2%), rgba(255,255,255,0.30) var(--gp), rgba(255,255,255,0.18) calc(var(--gp) + 2%), rgba(255,255,255,0.06) calc(var(--gp) + 5%), transparent calc(var(--gp) + 9%))",
                    "linear-gradient(135deg, transparent calc(var(--gp) - 15%), rgba(255,255,255,0.12) calc(var(--gp) - 13%), transparent calc(var(--gp) - 11%))",
                    "linear-gradient(135deg, transparent calc(var(--gp) + 6%), color-mix(in srgb, var(--accent-glow-2) 20%, transparent) calc(var(--gp) + 10%), transparent calc(var(--gp) + 14%))",
                  ].join(", "),
                } as MotionStyle
              }
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 ease-out group-hover:translate-x-[300%]"
            />
          </div>
        </motion.div>

        {/* Hand-written caption riding along under the print — snaps to
            full strength while the print is held, like it's being read */}
        <p className="mt-3 text-center font-hand text-lg leading-tight text-ink-muted transition-colors duration-300 group-hover:text-ink-strong">
          {p.caption}
        </p>
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

