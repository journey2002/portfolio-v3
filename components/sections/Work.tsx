"use client";

import { memo, useEffect, useRef, useState } from "react";
import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { ArrowUpRight, Maximize2, Plus } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import { RevealLine } from "@/components/ui/Reveal";
import ProjectCover from "@/components/ui/ProjectCover";
import ViewToggle, { type WorkView } from "@/components/ui/ViewToggle";
import Lightbox from "@/components/ui/Lightbox";
import { usePointer } from "@/components/ui/PointerProvider";
import ClientWork from "@/components/sections/Clients";
import Reel from "@/components/sections/Reel";

// Both take no props, and both are heavy — Reel alone owns a keyed <video>, a
// scrub rail and ~25 hooks. Work re-renders on every `hovered` change as the
// pointer moves down the index list, which was reconciling both of these
// subtrees on each row. Memoising makes those re-renders stop at this boundary;
// the rendered output is identical either way.
const MemoClientWork = memo(ClientWork);
const MemoReel = memo(Reel);

type Project = {
  title: string;
  description: string;
  tags: string[];
  /** Short discipline caption shown under the title / in the preview. */
  caption: string;
  /** Per-project colour identity — drives the cover, spine and title fill. */
  from: string;
  to: string;
  /** The piece itself. `ratio` is the file's own w/h: the gallery grows a
   *  hovered tile into exactly that shape, so the focused work is shown whole
   *  instead of cropped to whatever the bento happened to leave it. */
  cover: { src: string; ratio: number; position?: string; flip?: string };
  /**
   * Somewhere to send a visitor who wants the whole thing — a Figma file for
   * the projects that have one. Set → the gallery tile is a link out (↗). Unset
   * → the piece itself IS the deliverable (the illustration, the UI concepts),
   * so the tile opens it full size in the viewer instead (see Lightbox).
   */
  href?: string;
};

// Titles stay short on purpose — they sit inside tiles that shrink, and a
// three-word title is the difference between one line and an overflowing card.
const PROJECTS: Project[] = [
  {
    title: "Montana",
    description:
      "A digital design project highlighting user experience and visual storytelling while showcasing the beauty of the Rocky Mountains, created during a work and travel program in Montana.",
    tags: ["UX Design", "Visual Design", "Figma", "Procreate"],
    caption: "Digital Design · Work & Travel",
    from: "#6366f1",
    to: "#38bdf8",
    cover: { src: "/assets/work/montana.jpg", ratio: 1800 / 1280 },
    href: "https://www.figma.com/design/0m3oJjrQnwboGATTENMYdB/parallax",
  },
  {
    title: "Firefly",
    description:
      "Fan art digital illustration of Firefly from Honkai: Star Rail — exploring character design, light and shadow, and detailed digital painting.",
    tags: ["Digital Art", "Illustration", "Photoshop"],
    caption: "Fan Art · Honkai: Star Rail",
    from: "#f5c451",
    to: "#7c8cf8",
    // Portrait piece — hold the face high in frame when the crop is wide.
    cover: {
      src: "/assets/work/firefly.jpg",
      ratio: 1200 / 1302,
      position: "center 22%",
    },
  },
  {
    title: "DJ .instrument",
    description:
      "Final project for the Intelligent Human-Computer Interaction course — a fully designed and coded online store applying UX principles, user-centered design, and front-end implementation.",
    tags: ["UX/UI", "HTML / CSS / JS", "Figma"],
    caption: "UX/UI · E-commerce",
    from: "#22d3ee",
    to: "#c084fc",
    cover: {
      src: "/assets/work/instrument-home.jpg",
      ratio: 1248 / 776,
      flip: "/assets/work/instrument-about.jpg",
    },
    href: "https://www.figma.com/design/4jY997UGcKETv3vfQhtWab/instrument?node-id=0-1&p=f",
  },
  {
    title: "Partly Cloudy",
    description:
      "A weather app concept built on soft 3D and frosted glass — hourly forecast, sunrise arc, visibility and humidity all readable in one glance, with the whole screen taking its temperature from the sky.",
    tags: ["UI Design", "Dashboard", "Figma"],
    caption: "UI Concept · Weather",
    from: "#6fbfb8",
    to: "#e0a340",
    cover: { src: "/assets/work/weather.jpg", ratio: 1600 / 1068 },
  },
  {
    title: "Paimon Eats",
    description:
      "A food delivery app concept taken from browse to checkout — search and category browsing, a cart that keeps the food photography front and centre, and an order summary you can read without thinking.",
    tags: ["App Design", "UX/UI", "Figma"],
    caption: "App Concept · Food Delivery",
    from: "#60a5fa",
    to: "#f472b6",
    cover: { src: "/assets/work/foods.jpg", ratio: 1024 / 576 },
  },
];

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
const tileItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

const clampN = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const viewsRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-10%" });
  const inView = useInView(viewsRef, { once: true, margin: "-12%" });
  // Live (re-firing) visibility — used to dismiss the floating preview when the
  // section scrolls away faster than the pointer can leave the list.
  const sectionInView = useInView(sectionRef, { margin: "-15%" });

  const [view, setView] = useState<WorkView>("gallery");
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  // A fast scroll past the section never fires a mouseleave on the list, so the
  // preview can stay pinned after the work is out of view. Clear it on exit.
  useEffect(() => {
    if (!sectionInView && hovered !== null) setHovered(null);
  }, [sectionInView, hovered]);

  const pointer = usePointer();
  const enabled = pointer?.enabled ?? false;

  // Parallax depth for the bottom counter — shifts as the section scrolls.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const counterY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative overflow-hidden py-32 md:py-44"
    >
      <SectionLabel index="02" caption="Work" align="left" />

      {/* Movement I — client work: the live, shipped websites lead the section. */}
      <MemoClientWork />

      {/* Break into the second movement — same section, a different register:
          paid-and-shipped gives way to the off-the-clock personal work. */}
      <div
        aria-hidden
        className="relative mx-auto mt-28 flex max-w-7xl items-center gap-4 px-6 sm:px-10 md:mt-36"
      >
        <span className="h-px flex-1 bg-hairline" />
        <span className="h-1.5 w-1.5 rotate-45 bg-accent-gradient" />
        <span className="h-px flex-1 bg-hairline" />
      </div>

      {/* Movement II — off the clock: my own design, drawing & hobby work. */}
      <div className="relative mx-auto mt-14 max-w-7xl px-6 sm:px-10">
        <div
          ref={headingRef}
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-xs uppercase tracking-[0.25em] text-ink-subtle"
            >
              <span className="text-ink">[ II ]</span> &nbsp; Off the clock
            </motion.p>
            {/* Headline lines rise behind a marquee-selection sweep. */}
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <RevealLine>
                <SplitText text="Things I've" as="span" className="block" />
              </RevealLine>
              <RevealLine delay={0.14}>
                <SplitText
                  text="been making."
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
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="pt-1"
          >
            <ViewToggle view={view} onChange={setView} />
          </motion.div>
        </div>

        {/* Two layouts cross-fade through the same data: an editorial index
            (hover reveals a cover that flies with the cursor) and a bento
            gallery of those same covers. */}
        <div ref={viewsRef} className="relative mt-14">
          <AnimatePresence mode="wait" initial={false}>
            {view === "index" ? (
              <motion.div
                key="index"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <IndexView
                  hovered={hovered}
                  setHovered={setHovered}
                  open={open}
                  setOpen={setOpen}
                  enabled={enabled}
                  show={inView}
                />
              </motion.div>
            ) : (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <GalleryView show={inView} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom rail — counter shifts with scroll. Closes the project list;
            the reel below is a separate sub-block, so the 05 / 05 still counts
            only the pieces above it. */}
        <motion.div
          style={{ y: counterY }}
          className="mt-16 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-ink-faint"
        >
          <span>
            {view === "index" ? "Personal work" : "Gallery"}
          </span>
          <span className="font-numeral">05 / 05</span>
        </motion.div>

        {/* The same off-the-clock work, in motion — 3D and animation pieces on
            an editor timeline. A sub-block of this movement rather than its own
            stop, so it shares this container's width and padding. */}
        <MemoReel />
      </div>

      {/* Cursor-flown preview — desktop, index view only. Lives at the section
          root (fixed positioning) so it can float anywhere over the list.
          Not for the row that's already open: the card carries the same cover,
          title, description and tags as the expanded record, so it was landing
          on top of the very thing the click just revealed. Opening a row hands
          the reading over to the record; the card bows out. */}
      <AnimatePresence>
        {enabled &&
          view === "index" &&
          hovered !== null &&
          hovered !== open &&
          pointer && (
            <FloatingPreview
              key="floating-preview"
              project={PROJECTS[hovered]}
              index={hovered}
              pointerX={pointer.x}
              pointerY={pointer.y}
            />
          )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Index view — the editorial list                                     */
/* ------------------------------------------------------------------ */

function IndexView({
  hovered,
  setHovered,
  open,
  setOpen,
  enabled,
  show,
}: {
  hovered: number | null;
  setHovered: (i: number | null) => void;
  open: number | null;
  setOpen: (i: number | null) => void;
  enabled: boolean;
  show: boolean;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const pointer = usePointer();

  // A record opening or closing moves every row below it while the cursor sits
  // perfectly still — so the row under the pointer changes without a mouseenter
  // ever firing, and the list goes on lighting whichever row used to be there
  // (click a row, then click one below it: the first collapses, the second
  // jumps up out from under the cursor, and the highlight is left behind).
  // Ask the document who's actually under the cursor once the panel has landed.
  const resyncHovered = () => {
    if (!enabled || !pointer) return;
    const el = document.elementFromPoint(pointer.x.get(), pointer.y.get());
    const row = el?.closest<HTMLElement>("[data-work-row]");
    setHovered(
      row && listRef.current?.contains(row) ? Number(row.dataset.workRow) : null
    );
  };

  return (
    <motion.ul
      ref={listRef}
      variants={listContainer}
      initial="hidden"
      animate={show ? "show" : "hidden"}
      onMouseLeave={() => enabled && setHovered(null)}
      className="border-t border-hairline"
    >
      {PROJECTS.map((p, i) => {
        const isActive = enabled && hovered === i;
        // Was gated to touch. The expanded panel is the only way to read a
        // project's description, so it has to answer to click and keyboard on
        // every device — on desktop the cursor-flown preview rides alongside.
        const isOpen = open === i;
        // An open record is exempt: its panel doesn't dim with the header (they
        // animate separately), so dimming left a 32% title sitting above a
        // full-strength description. It's also the one row the reader asked
        // for — it stays legible while the cursor wanders.
        const dim = enabled && hovered !== null && hovered !== i && !isOpen;
        const lit = isActive || isOpen;

        return (
          <motion.li
            key={p.title}
            data-work-row={i}
            variants={rowItem}
            className="border-b border-hairline"
          >
            <motion.div
              data-cursor-hover
              onMouseEnter={enabled ? () => setHovered(i) : undefined}
              animate={{ opacity: dim ? 0.32 : 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex cursor-pointer items-center gap-4 py-6 sm:gap-6 sm:py-8"
            >
              {/* Index numeral */}
              <span className="w-7 shrink-0 font-numeral text-xs tabular-nums tracking-[0.3em] text-ink-faint sm:w-12">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Colour spine — lights up in the project's hue when active */}
              <span
                className="h-9 w-px shrink-0 transition-colors duration-300 sm:h-14"
                style={{
                  background: lit
                    ? `linear-gradient(${p.from}, ${p.to})`
                    : "var(--hairline)",
                }}
              />

              {/* Title + meta */}
              <div className="min-w-0 flex-1">
                <motion.h3
                  animate={{ x: isActive ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 26 }}
                  className={`font-serif text-2xl font-semibold tracking-tight transition-colors duration-300 sm:text-4xl md:text-5xl ${
                    lit
                      ? "text-transparent"
                      : "text-ink-subtle group-hover:text-ink"
                  }`}
                  style={
                    lit
                      ? {
                          backgroundImage: `linear-gradient(90deg, ${p.from}, ${p.to})`,
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                        }
                      : undefined
                  }
                >
                  {/* The trigger lives INSIDE the heading and stretches its hit
                      area over the whole row: the row stays clickable exactly
                      as it looks, while the accessible name is just the project
                      title and the h3 survives as a real heading (a role=button
                      wrapper would have flattened both). */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`work-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="text-left outline-none after:absolute after:inset-0 after:rounded-sm after:content-[''] focus-visible:after:ring-1 focus-visible:after:ring-inset focus-visible:after:ring-indigo-accent"
                  >
                    {p.title}
                  </button>
                </motion.h3>
                <motion.div
                  animate={{ x: isActive ? 16 : 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 26 }}
                  className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.25em] text-ink-faint"
                >
                  <span>{p.caption}</span>
                  <span className="hidden h-px w-6 bg-hairline sm:block" />
                  <span className="hidden sm:inline">
                    {p.tags.slice(0, 2).join(" · ")}
                  </span>
                </motion.div>
              </div>

              {/* Arrow */}
              <motion.span
                animate={{ x: isActive ? 4 : 0, y: isActive ? -4 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="shrink-0"
                style={{ color: isActive ? p.from : undefined }}
              >
                <ArrowUpRight
                  className={`h-5 w-5 sm:h-6 sm:w-6 ${
                    isActive ? "" : "text-ink-faint"
                  }`}
                  strokeWidth={1.5}
                />
              </motion.span>

              {/* Accent underline wipe on hover (desktop) */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 transition-transform duration-500 ease-out-expo group-hover:scale-x-100"
                style={{
                  background: `linear-gradient(90deg, ${p.from}, ${p.to})`,
                }}
              />
            </motion.div>

            {/* Expanded record — the open row's cover + full description */}
            <AnimatePresence initial={false} onExitComplete={resyncHovered}>
              {isOpen && (
                <motion.div
                  key="panel"
                  id={`work-panel-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onAnimationComplete={resyncHovered}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 pb-7 sm:flex-row">
                    {/* The box takes the piece's own proportions, so the record
                        shows the work whole rather than a fixed letterbox. */}
                    <div
                      style={{ aspectRatio: p.cover.ratio }}
                      className="relative w-full shrink-0 overflow-hidden rounded-xl border border-hairline sm:h-44 sm:w-auto"
                    >
                      <ProjectCover
                        index={i}
                        from={p.from}
                        to={p.to}
                        src={p.cover.src}
                        position={p.cover.position}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-ink-muted">
                        {p.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {p.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-hairline px-3 py-1 text-[10px] uppercase tracking-wider text-ink-subtle"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

/* ------------------------------------------------------------------ */
/* Floating preview — the cover that flies with the cursor             */
/* ------------------------------------------------------------------ */

const CARD_W = 300;
const CARD_DEPTH = 22; // visible thickness of the slab's side faces
const EDGE = 28; // gap between the cursor and the card
// Roughly the text block under the cover — the card's height varies with the
// piece's shape, and the vertical clamp needs a number to work from.
const CARD_TEXT_H = 210;

// A soft iridescent sheen over a base tone — a subtle prism reflection on the
// card's thick side, rather than a full RGB rainbow. Brightest mid-height so it
// reads as a glint catching the edge. Base/inset/shadow are themed (see
// --prism-* in globals.css) so the slab stays dark on dark but turns into a pale
// white-card edge on light.

type Side = "left" | "right";

function FloatingPreview({
  project,
  index,
  pointerX,
  pointerY,
}: {
  project: Project;
  index: number;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  // The cover pane keeps the piece's own proportions (floored and capped so a
  // tall illustration doesn't turn the card into a column), which makes the
  // whole card taller or shorter as the cursor moves down the list.
  const coverH = clampN(Math.round(CARD_W / project.cover.ratio), 172, 300);
  const cardH = coverH + CARD_TEXT_H;

  // Trail the cursor through a soft spring so the card glides rather than
  // sticking to the pointer.
  const trail = { stiffness: 350, damping: 32, mass: 0.7 };
  const sx = useSpring(pointerX, trail);
  const sy = useSpring(pointerY, trail);

  // Horizontal speed banks the card like it's being flung through space, and
  // the cover counter-shifts a touch for a parallax sense of depth.
  const vx = useVelocity(sx);
  const bank = useSpring(
    useTransform(vx, [-2200, 2200], [14, -14], { clamp: true }),
    { stiffness: 200, damping: 26 }
  );
  const coverShift = useTransform(bank, [-14, 14], [12, -12]);

  // Velocity yaw — the card faces forward at rest and turns into its motion as
  // it moves, which is what exposes the thick side. (No baked-in rest tilt.)
  const yaw = useSpring(
    useTransform(vx, [-2200, 2200], [-16, 16], { clamp: true }),
    { stiffness: 200, damping: 26 }
  );

  const [vp, setVp] = useState(() => ({
    w: typeof window === "undefined" ? 1280 : window.innerWidth,
    h: typeof window === "undefined" ? 800 : window.innerHeight,
  }));
  useEffect(() => {
    // rAF-coalesced: a window drag fires resize far faster than it can matter
    // here, and each raw event was a setState that re-rendered this 3D card
    // mid-hover. One update per frame reads the same numbers.
    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setVp({ w: window.innerWidth, h: window.innerHeight });
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Which side of the cursor the card rides on. Offset is a motion value so the
  // side-swap can glide during the flip without a React re-render.
  const offsetFor = (s: Side) => (s === "left" ? -(CARD_W + EDGE) : EDGE);
  const initialSide: Side = pointerX.get() > vp.w * 0.5 ? "left" : "right";
  const sideRef = useRef<Side>(initialSide);
  const flippingRef = useRef(false);
  const offsetX = useMotionValue(offsetFor(initialSide));
  const flip = useMotionValue(0); // rotateY, in degrees (−90…90 during a flip)

  // How "edge-on" the flip currently is (1 = face-on, 0 = thin edge). Used to
  // quiet velocity bank/yaw so the card doesn't tumble while it's spinning.
  const faceOn = useTransform(flip, (f) => {
    const t = Math.min(1, Math.abs(f) / 90);
    // Smoothstep — stays near 1 until the turn is well underway, then drops.
    return 1 - t * t * (3 - 2 * t);
  });

  // Net Y rotation: velocity yaw fades out as the flip turns edge-on.
  const rotateYTotal = useTransform([flip, yaw, faceOn], ([f, y, s]: number[]) => {
    return f + y * s;
  });

  // Bank (roll) also quiets during the flip so the arc reads as a clean toss,
  // not a card spinning on two axes at once.
  const bankTotal = useTransform([bank, faceOn], ([b, s]: number[]) => b * s);

  // Slight lift toward the camera mid-flip — depth cue that sells the 3D turn.
  const flipZ = useTransform(flip, (f) => {
    const t = Math.min(1, Math.abs(f) / 90);
    return 28 * Math.sin(t * Math.PI);
  });

  // Watch the cursor (dead-zone around centre to avoid flicker). On a half
  // cross, run one continuous flip: a single eased 0→1 progress drives rotateY
  // through a full 180° arc and glides the card to the other side of the cursor
  // in the same motion (no hard midpoint snap).
  useMotionValueEvent(sx, "change", (v) => {
    const want: Side | null =
      sideRef.current !== "left" && v > vp.w * 0.58
        ? "left"
        : sideRef.current !== "right" && v < vp.w * 0.42
          ? "right"
          : null;
    if (!want || flippingRef.current) return;
    sideRef.current = want;
    flippingRef.current = true;
    const dir = want === "left" ? 1 : -1;
    const startOff = offsetX.get();
    const endOff = offsetFor(want);

    (async () => {
      // One continuous progress drives both rotation and side offset so the
      // toss reads as a single physical motion instead of "spin, teleport, spin".
      await animate(0, 1, {
        duration: 0.52,
        // Accelerate into the edge-on moment, settle gently as it faces forward.
        ease: [0.45, 0.02, 0.2, 1],
        onUpdate: (t) => {
          // Ease the offset with the same progress — card glides while it turns.
          offsetX.set(startOff + (endOff - startOff) * t);

          // Map 0→1 onto a 180° turn of a single-sided card:
          // 0→90° face→edge, then jump the visual to the mirrored −90→0 so the
          // front stays outward (no reverse-content back face).
          const deg = t * 180;
          if (deg <= 90) {
            flip.set(dir * deg);
          } else {
            flip.set(dir * (deg - 180));
          }
        },
      }).finished;

      flip.set(0);
      offsetX.set(endOff);
      flippingRef.current = false;
    })();
  });

  const left = useTransform([sx, offsetX], ([x, off]: number[]) =>
    clampN(x + off, 16, Math.max(16, vp.w - CARD_W - 16))
  );
  const top = useTransform(sy, (y) =>
    clampN(y - cardH * 0.45, 16, Math.max(16, vp.h - cardH - 16))
  );

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[60]"
      style={{ x: left, y: top }}
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      {/* Perspective stage so the tilt, thickness and flip read in real 3D. */}
      <div className="[perspective:1400px]">
        <motion.div
          style={{
            rotateZ: bankTotal,
            rotateY: rotateYTotal,
            z: flipZ,
            transformPerspective: 1400,
          }}
          className="relative w-[300px] origin-center [transform-style:preserve-3d]"
        >
          {/* Thick sides — real faces extruded back from each vertical edge, so
              whichever edge turns away exposes a glowing prism thickness. The
              opaque front face occludes the side that isn't showing. Inset from
              the rounded corners so they sit along the straight edge. */}
          <div
            aria-hidden
            className="absolute inset-y-4 left-0 origin-left rounded-l-sm"
            style={{
              width: CARD_DEPTH,
              transform: `rotateY(90deg)`,
              // Across-depth shade: the front edge (near the card face) stays lit
              // and the back recedes into shadow, so the slab reads as a real 3D
              // thickness rather than a flat panel butted against the card.
              background:
                "linear-gradient(to right, rgba(0,0,0,0) 32%, rgba(0,0,0,0.24) 100%), var(--prism-edge)",
              boxShadow: "var(--prism-edge-inset)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-4 right-0 origin-right rounded-r-sm"
            style={{
              width: CARD_DEPTH,
              transform: `rotateY(-90deg)`,
              // Mirror of the left face — front edge lit, back recedes (see above).
              background:
                "linear-gradient(to left, rgba(0,0,0,0) 32%, rgba(0,0,0,0.24) 100%), var(--prism-edge)",
              boxShadow: "var(--prism-edge-inset)",
            }}
          />
          <motion.div
            key={index}
            initial={{ opacity: 0.35, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              boxShadow: "var(--prism-card-shadow)",
              // Hide the mirrored reverse face at the edge-on handoff so the
              // single-sided card never flashes backwards mid-flip.
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
            className="relative w-full overflow-hidden rounded-2xl border border-[var(--ring)] bg-surface [transform-style:preserve-3d]"
          >
            <div
              style={{ height: coverH }}
              className="relative overflow-hidden transition-[height] duration-300 ease-out-expo"
            >
              <motion.div
                style={{ x: coverShift }}
                className="absolute inset-0 scale-110"
              >
                <ProjectCover
                  index={index}
                  from={project.from}
                  to={project.to}
                  src={project.cover.src}
                  position={project.cover.position}
                  className="h-full w-full"
                />
              </motion.div>
            </div>
            {/* Seam — the project's gradient as a hairline between art and text */}
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(90deg, ${project.from}, ${project.to})`,
              }}
            />
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                {project.caption}
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-ink-strong">
                {project.title}
              </h3>
              <p
                className="mt-2 text-xs leading-relaxed text-ink-muted"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {project.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-hairline px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery view — asymmetric bento of the same covers                  */
/* ------------------------------------------------------------------ */

// Fixed placement on a 6-col x 3-row grid, ordered so every piece lands in a
// slot that already suits it: the widescreen Montana site leads, the portrait
// illustration takes the tall column beside it, and the three app mockups run
// along the bottom. Each tile keeps its area; only the track SIZES change on
// hover (below), so cards can expand while the whole thing stays a tidy bento
// — no overlaps, no gaps.
const COLS = 6;
const ROWS = 3;
const GAP = 20; // gap-5, the gutter at the width where the bento switches on
const TILE_AREA = [
  { col: [1, 5], row: [1, 3] }, // Montana — wide lead
  { col: [5, 7], row: [1, 3] }, // Firefly — the tall slot, for the portrait art
  { col: [1, 3], row: [3, 4] }, // DJ .instrument
  { col: [3, 5], row: [3, 4] }, // Partly Cloudy
  { col: [5, 7], row: [3, 4] }, // Paimon Eats
];

// Legibility scrims, in pixels rather than percentages: the text block is
// bottom-anchored and roughly the same height in every tile, so a percentage
// ramp either left the captions floating over a white UI mockup or swallowed
// the lead tile's artwork. The second one is a deeper wash behind an open
// description panel, which reaches further up the card than a resting title
// does — it gets its own layer because background-image can't be transitioned.
const SCRIM =
  "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.85) 96px, rgba(0,0,0,0.5) 150px, rgba(0,0,0,0.12) 220px, rgba(0,0,0,0) 280px)";
const SCRIM_FOCUS =
  "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.7) 170px, rgba(0,0,0,0.28) 270px, rgba(0,0,0,0) 350px)";

// Hovering a tile hands it its own artwork's proportions: the grid solves for
// the column and row weights that make that one box exactly `ratio` wide-to-
// tall, and the other tracks yield whatever's left. A CSS transition on the
// template tweens between the two states, so the bento reflows into the shape
// of whatever you're looking at and the piece is finally shown whole.
//
// Two guards keep the yielding tiles usable: no track drops under a pixel floor
// (a card thinner than that can't hold its own title), and no tile grows past
// MAX_GROWTH of its resting share, which keeps the reflow a swell rather than a
// takeover. The areas above are picked so each tile can still reach its ratio
// inside those limits.
const MIN_COL = 96;
const MIN_ROW = 104;
const MAX_GROWTH = 1.85;
// …and a tile may give up this much of one axis to find its shape, as long as
// it's growing on the other. Without the allowance a wide tile in a short grid
// can't reach a squarer ratio at all; with more of one it would visibly recoil
// from the cursor.
const MAX_SHRINK = 0.93;

function bentoGeometry(width: number, hovered: number | null, ratio?: number) {
  // Shallower than the width would suggest — the bento sits mid-page, so it
  // should never eat a whole tall viewport.
  const height = Math.round(clampN(width * 0.58, 520, 720));
  const availW = width - GAP * (COLS - 1);
  const availH = height - GAP * (ROWS - 1);
  const even = {
    height,
    cols: Array<number>(COLS).fill(1),
    rows: Array<number>(ROWS).fill(1),
  };
  if (hovered === null || !ratio || availW <= 0 || availH <= 0) return even;

  const area = TILE_AREA[hovered];
  const cs = area.col[1] - area.col[0];
  const rs = area.row[1] - area.row[0];
  const baseX = cs / COLS;
  const baseY = rs / ROWS;

  // The most of each axis this tile may take, then the largest box of the right
  // shape that fits inside that.
  const maxX = Math.min(
    baseX * MAX_GROWTH,
    (availW - MIN_COL * (COLS - cs)) / availW
  );
  const maxY = Math.min(
    baseY * MAX_GROWTH,
    (availH - MIN_ROW * (ROWS - rs)) / availH
  );
  const maxW = availW * maxX + GAP * (cs - 1);
  const maxH = availH * maxY + GAP * (rs - 1);
  const [w, h] =
    maxW / maxH > ratio ? [maxH * ratio, maxH] : [maxW, maxW / ratio];

  const fx = clampN((w - GAP * (cs - 1)) / availW, baseX * MAX_SHRINK, maxX);
  const fy = clampN((h - GAP * (rs - 1)) / availH, baseY * MAX_SHRINK, maxY);

  // The hovered tile's tracks split its share; everything else splits the rest.
  const spread = (n: number, start: number, span: number, share: number) =>
    Array.from({ length: n }, (_, k) =>
      k + 1 >= start && k + 1 < start + span
        ? share / span
        : (1 - share) / (n - span)
    );

  return {
    height,
    cols: spread(COLS, area.col[0], cs, fx),
    rows: spread(ROWS, area.row[0], rs, fy),
  };
}

function GalleryView({ show }: { show: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);
  // Which tile is showing its description, kept separate from `hovered` on
  // purpose: the copy used to slide out from under the cursor, so crossing the
  // bento fired five paragraphs in a row and the grid read as noise. Hover now
  // only reshapes the tile — the words wait behind a button.
  const [open, setOpen] = useState<number | null>(null);
  // The project being viewed full size, for the work that has no file to link
  // out to. Holds the project rather than an index so the viewer keeps showing
  // the right piece regardless of what the grid does behind it.
  const [zoomed, setZoomed] = useState<Project | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  // The ratio solve needs real pixels, so the grid measures itself. Width is
  // the only input — the height is derived from it, so this can't feed back.
  const [width, setWidth] = useState(0);
  // The expanding template only applies once the bento is actually side-by-side
  // (lg+ — below that the 6-col template pinched the side tiles: ~90px columns
  // at 640-767, and the fixed height crammed a portrait tablet at 768-1023). On
  // a single-column stack there's nothing to redistribute, and the hover-driven
  // expansion is mouse-only anyway.
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsWide(mq.matches);
    update(); // sync the real value on mount (avoids a missed-change race)
    mq.addEventListener("change", update);

    // Seeded here rather than in its own effect so the first wide render already
    // knows its width — measure and breakpoint land in the same commit.
    const el = gridRef.current;
    if (el) setWidth(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([entry]) =>
      setWidth(Math.round(entry.contentRect.width))
    );
    if (el) ro.observe(el);

    return () => {
      mq.removeEventListener("change", update);
      ro.disconnect();
    };
  }, []);

  // It's a popover, so it answers to what dismisses one: Escape, and a press
  // anywhere outside the bento. (Moving to another tile closes it too — see the
  // tile's onMouseEnter.)
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    const onDown = (e: PointerEvent) => {
      if (!gridRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const geo =
    isWide && width > 0
      ? bentoGeometry(
          width,
          hovered,
          hovered === null ? undefined : PROJECTS[hovered].cover.ratio
        )
      : null;
  // minmax(0, …) keeps tracks purely proportional so title text can't widen a
  // column past its share.
  const toFr = (a: number[]) => a.map((f) => `minmax(0, ${f}fr)`).join(" ");

  return (
    <>
    <motion.div
      ref={gridRef}
      variants={listContainer}
      initial="hidden"
      animate={show ? "show" : "hidden"}
      onMouseLeave={() => {
        setHovered(null);
        setOpen(null);
      }}
      className="grid grid-cols-1 gap-4 sm:gap-5"
      style={
        geo
          ? {
              gridTemplateColumns: toFr(geo.cols),
              gridTemplateRows: toFr(geo.rows),
              height: geo.height,
              transition:
                "grid-template-columns 0.55s cubic-bezier(0.16,1,0.3,1), grid-template-rows 0.55s cubic-bezier(0.16,1,0.3,1)",
            }
          : undefined
      }
    >
      {PROJECTS.map((p, i) => {
        const focused = isWide && hovered === i;
        const dim = isWide && hovered !== null && hovered !== i;
        const showing = open === i;
        return (
          <motion.div
            key={p.title}
            variants={tileItem}
            onMouseEnter={() => {
              setHovered(i);
              // A panel left open on a tile that's now yielding space would be
              // describing one project while the cursor points at another.
              setOpen((cur) => (cur === i ? cur : null));
            }}
            className="group"
            style={
              geo
                ? {
                    gridColumn: `${TILE_AREA[i].col[0]} / ${TILE_AREA[i].col[1]}`,
                    gridRow: `${TILE_AREA[i].row[0]} / ${TILE_AREA[i].row[1]}`,
                  }
                : undefined
            }
          >
            <div
              data-cursor-hover
              style={{ opacity: dim ? 0.55 : 1 }}
              className="relative h-full min-h-[300px] overflow-hidden rounded-2xl border border-hairline transition-[border-color,opacity] duration-500 ease-out-expo group-hover:border-white/25 lg:min-h-0"
            >
              {/* The cover rests slightly zoomed and settles back to 1 on hover
                  — the reverse of the usual, because the tile has just taken
                  the artwork's shape and any scale would crop it again. */}
              <div className="absolute inset-0 scale-[1.06] transition-transform duration-[1200ms] ease-out-expo group-hover:scale-100">
                <ProjectCover
                  index={i}
                  from={p.from}
                  to={p.to}
                  src={p.cover.src}
                  position={p.cover.position}
                  flip={p.cover.flip}
                  showFlip={focused}
                  className="h-full w-full"
                />
              </div>
              {/* Legibility scrim — it also lifts off a tile that isn't being
                  read, so the ones giving up space are left as plain artwork. */}
              <div
                style={{ opacity: dim ? 0.4 : 1, background: SCRIM }}
                className="absolute inset-0 transition-opacity duration-500 ease-out-expo"
              />
              <div
                style={{ opacity: showing ? 1 : 0, background: SCRIM_FOCUS }}
                className="absolute inset-0 transition-opacity duration-500 ease-out-expo"
              />

              {/* Whole-tile activation surface, stretched under the caption
                  rather than wrapped around it: the details button lives inside
                  that caption block, and interactive content nested in an <a>
                  is invalid and unreachable by keyboard. So the card's click
                  target is its own transparent layer, the caption above it is
                  pointer-transparent, and the button re-enables just itself.
                  A project with a file to show links out; one whose artwork IS
                  the piece opens the viewer. */}
              {p.href ? (
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${p.title} — open the Figma file (opens in a new tab)`}
                  className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setZoomed(p)}
                  aria-label={`${p.title} — view full size`}
                  className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
                />
              )}

              {/* The text goes with it. A yielding tile can end up short enough
                  that its caption and tags would spill past the card edge —
                  fading them out is both the fix and the better reading. */}
              <div
                style={{
                  opacity: dim ? 0 : 1,
                  transform: dim ? "translateY(10px)" : "none",
                }}
                className="pointer-events-none relative z-20 flex h-full flex-col justify-end p-6 transition-[opacity,transform] duration-300 ease-out-expo"
              >
                <div className="relative flex items-end justify-between gap-4">
                  {/* The description, on request. It floats above the standing
                      caption block rather than pushing it down, so opening one
                      doesn't shove the title the reader just aimed at. */}
                  <AnimatePresence>
                    {showing && (
                      <motion.div
                        key="panel"
                        id={`gallery-panel-${i}`}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="pointer-events-auto absolute bottom-full left-0 mb-4 w-full max-w-md origin-bottom overflow-hidden rounded-xl border border-white/15 bg-black/55 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                      >
                        {/* Same gradient seam the cursor-flown card uses — the
                            panel is still this project speaking. */}
                        <div
                          className="h-px w-full"
                          style={{
                            background: `linear-gradient(90deg, ${p.from}, ${p.to})`,
                          }}
                        />
                        {/* Slightly tighter below sm: a stacked tile is only
                            300px tall, and the longest description at full
                            size would push the panel past the card's top. */}
                        <p className="p-3.5 text-[13px] leading-relaxed text-neutral-200 sm:p-4 sm:text-sm">
                          {p.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-300">
                      {p.caption}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
                      {p.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/15 bg-black/30 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-300 backdrop-blur-sm"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* gap-4, not gap-2: the toggle is a bordered, filled circle
                      and the glyph beside it is bare strokes, so 8px of space
                      between a hard edge and a loose outline read as the two
                      touching. The extra 8px comes out of the caption block
                      next to it, which is min-w-0 and already wraps. */}
                  <div className="flex shrink-0 items-center gap-4">
                    {/* Only the wide bento hides the trigger until hover: below
                        lg the pointer never enters a tile, so a hover-gated
                        button would put the copy out of reach on touch. */}
                    <button
                      type="button"
                      aria-expanded={showing}
                      aria-controls={`gallery-panel-${i}`}
                      aria-label={`${showing ? "Hide" : "Show"} details for ${p.title}`}
                      onClick={() => setOpen(showing ? null : i)}
                      className={`pointer-events-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-black/40 text-neutral-200 backdrop-blur-sm transition-[opacity,background-color,color,border-color] duration-300 ease-out-expo hover:border-white/40 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 ${
                        isWide
                          ? "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          : "opacity-100"
                      }`}
                    >
                      <Plus
                        className={`h-4 w-4 transition-transform duration-300 ease-out-expo ${
                          showing ? "rotate-45" : ""
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                    {/* ↗ keeps its site-wide meaning of "go somewhere" — so a
                        tile that opens the piece in place gets the expand glyph
                        instead, and grows rather than flying off-corner. */}
                    {p.href ? (
                      <ArrowUpRight
                        className="h-6 w-6 shrink-0 text-neutral-300 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Maximize2
                        className="h-5 w-5 shrink-0 text-neutral-300 transition-transform duration-300 group-hover:scale-110 group-hover:text-white"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>

    {/* The viewer for the tiles with no file to link out to. Rendered once for
        the whole grid rather than per tile, and portalled to <body> from inside
        (see Lightbox) so the section's overflow-hidden and the tiles' own
        transforms can't clip or re-anchor it. `description` doubles as the
        image's alt text — it's the only account of the piece a screen reader
        gets once the artwork is the content. */}
    <Lightbox
      item={
        zoomed
          ? {
              src: zoomed.cover.src,
              alt: zoomed.description,
              title: zoomed.title,
              caption: zoomed.caption,
              from: zoomed.from,
              to: zoomed.to,
            }
          : null
      }
      onClose={() => setZoomed(null)}
    />
    </>
  );
}
