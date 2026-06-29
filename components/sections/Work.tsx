"use client";

import { useEffect, useRef, useState } from "react";
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
import { ArrowUpRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import ProjectCover from "@/components/ui/ProjectCover";
import ViewToggle, { type WorkView } from "@/components/ui/ViewToggle";
import { usePointer } from "@/components/ui/PointerProvider";

type Project = {
  title: string;
  description: string;
  tags: string[];
  /** Short discipline caption shown under the title / in the preview. */
  caption: string;
  /** Per-project colour identity — drives the cover, spine and title fill. */
  from: string;
  to: string;
};

const PROJECTS: Project[] = [
  {
    title: "Work & Travel — Montana",
    description:
      "A digital design project highlighting user experience and visual storytelling while showcasing the beauty of the Rocky Mountains, created during a work and travel program in Montana.",
    tags: ["UX Design", "Visual Design", "Figma", "Procreate"],
    caption: "Digital Design · Montana",
    from: "#6366f1",
    to: "#38bdf8",
  },
  {
    title: "Honkai Star Rail: Firefly",
    description:
      "Fan art digital illustration of Firefly from Honkai: Star Rail — exploring character design, light and shadow, and detailed digital painting.",
    tags: ["Digital Art", "Illustration", "Photoshop"],
    caption: "Fan Art · Illustration",
    from: "#fbbf24",
    to: "#fb7185",
  },
  {
    title: "E-commerce Website Mockup",
    description:
      "Final project for the Intelligent Human-Computer Interaction course — a fully designed and coded online store applying UX principles, user-centered design, and front-end implementation.",
    tags: ["UX/UI", "HTML / CSS / JS", "Figma"],
    caption: "UX/UI · Coursework",
    from: "#2dd4bf",
    to: "#6366f1",
  },
  {
    title: "Journey",
    description:
      "A visual storytelling and motion design project exploring emotional narrative through typography, composition, and layered imagery.",
    tags: ["Visual Design", "Motion", "Procreate"],
    caption: "Visual · Motion",
    from: "#a855f7",
    to: "#ec4899",
  },
  {
    title: "Da Donut",
    description:
      "A playful branding and visual identity concept — character design, color theory, and packaging aesthetics combined into a cohesive creative direction.",
    tags: ["Branding", "Illustration", "Figma"],
    caption: "Branding · Concept",
    from: "#f472b6",
    to: "#fbbf24",
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

  const [view, setView] = useState<WorkView>("index");
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
      <SectionLabel index="02" caption="Selected work" align="left" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ink-subtle">
              <span className="text-ink">[02]</span> &nbsp; Selected work
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <SplitText
                text="Things I've"
                as="span"
                className="block"
                immediate={false}
                stagger={0.025}
                fromY={42}
              />
              <SplitText
                text="been making."
                as="span"
                className="block"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                immediate={false}
                stagger={0.025}
                delay={0.15}
                fromY={42}
                fromRotate={-3}
              />
            </h2>
          </div>
          <div className="pt-1">
            <ViewToggle view={view} onChange={setView} />
          </div>
        </motion.div>

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

        {/* Bottom rail — counter shifts with scroll */}
        <motion.div
          style={{ y: counterY }}
          className="mt-16 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-ink-faint"
        >
          <span>
            {view === "index"
              ? enabled
                ? "↳ Hover a project to preview"
                : "↳ Tap a project to expand"
              : "↳ Selected work"}
          </span>
          <span>05 / 05</span>
        </motion.div>
      </div>

      {/* Cursor-flown preview — desktop, index view only. Lives at the section
          root (fixed positioning) so it can float anywhere over the list. */}
      <AnimatePresence>
        {enabled && view === "index" && hovered !== null && pointer && (
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
  return (
    <motion.ul
      variants={listContainer}
      initial="hidden"
      animate={show ? "show" : "hidden"}
      onMouseLeave={() => enabled && setHovered(null)}
      className="border-t border-hairline"
    >
      {PROJECTS.map((p, i) => {
        const isActive = enabled && hovered === i;
        const dim = enabled && hovered !== null && hovered !== i;
        const isOpen = !enabled && open === i;
        const lit = isActive || isOpen;

        return (
          <motion.li
            key={p.title}
            variants={rowItem}
            className="border-b border-hairline"
          >
            <motion.div
              data-cursor-hover
              onMouseEnter={enabled ? () => setHovered(i) : undefined}
              onClick={enabled ? undefined : () => setOpen(isOpen ? null : i)}
              animate={{ opacity: dim ? 0.32 : 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="group relative flex cursor-pointer items-center gap-4 py-6 sm:gap-6 sm:py-8"
            >
              {/* Index numeral */}
              <span className="w-7 shrink-0 text-xs tabular-nums tracking-[0.3em] text-ink-faint sm:w-12">
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
                  {p.title}
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

            {/* Touch fallback — tapping a row expands the cover + details */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col gap-4 pb-7 sm:flex-row">
                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-hairline sm:w-60">
                      <ProjectCover
                        index={i}
                        from={p.from}
                        to={p.to}
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
const CARD_H = 392;
const CARD_DEPTH = 34; // visible thickness of the slab's side faces
const EDGE = 28; // gap between the cursor and the card

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
    const onResize = () =>
      setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Which side of the cursor the card rides on. The offset is a motion value
  // (not React state) so the side-swap can happen WITHOUT a re-render — letting
  // us snap it at the exact midpoint of the flip, while the card is turned
  // edge-on and effectively invisible.
  const offsetFor = (s: Side) => (s === "left" ? -(CARD_W + EDGE) : EDGE);
  const initialSide: Side = pointerX.get() > vp.w * 0.5 ? "left" : "right";
  const sideRef = useRef<Side>(initialSide);
  const flippingRef = useRef(false);
  const offsetX = useMotionValue(offsetFor(initialSide));
  const flip = useMotionValue(0); // rotateY, in degrees

  // Net Y rotation: the velocity yaw, plus the flip's swing. The yaw fades to
  // nothing at the flip's edge-on midpoint (×settle) so the side-swap still
  // hides cleanly, then eases back. At rest this is 0 — the card faces forward.
  const rotateYTotal = useTransform([flip, yaw], ([f, y]: number[]) => {
    const settle = 1 - Math.min(1, Math.abs(f) / 90);
    return f + y * settle;
  });

  // Watch the cursor (dead-zone around centre to avoid flicker) and, when it
  // crosses to the other half, run a 3D flip: turn edge-on, swap sides while
  // invisible, then turn back to face the viewer on the new side.
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
    (async () => {
      await animate(flip, dir * 90, { duration: 0.16, ease: [0.4, 0, 1, 1] })
        .finished;
      offsetX.set(offsetFor(want)); // reposition while edge-on (hidden)
      flip.set(-dir * 90);
      await animate(flip, 0, { duration: 0.26, ease: [0, 0, 0.2, 1] }).finished;
      flippingRef.current = false;
    })();
  });

  const left = useTransform([sx, offsetX], ([x, off]: number[]) =>
    clampN(x + off, 16, Math.max(16, vp.w - CARD_W - 16))
  );
  const top = useTransform(sy, (y) =>
    clampN(y - CARD_H * 0.45, 16, Math.max(16, vp.h - CARD_H - 16))
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
      <div className="[perspective:1200px]">
        <motion.div
          style={{ rotateZ: bank, rotateY: rotateYTotal }}
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
              background: "var(--prism-edge)",
              boxShadow: "var(--prism-edge-inset)",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-y-4 right-0 origin-right rounded-r-sm"
            style={{
              width: CARD_DEPTH,
              transform: `rotateY(-90deg)`,
              background: "var(--prism-edge)",
              boxShadow: "var(--prism-edge-inset)",
            }}
          />
          <motion.div
            key={index}
            initial={{ opacity: 0.35, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{ boxShadow: "var(--prism-card-shadow)" }}
            className="relative w-full overflow-hidden rounded-2xl border border-[var(--ring)] bg-surface"
          >
            <div className="relative h-[188px] overflow-hidden">
              <motion.div
                style={{ x: coverShift }}
                className="absolute inset-0 scale-110"
              >
                <ProjectCover
                  index={index}
                  from={project.from}
                  to={project.to}
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

// Fixed placement on a 6-col x 3-row grid. Each tile keeps its area; only the
// track SIZES change on hover (below), so cards can expand while the whole
// thing stays a tidy bento — no overlaps, no gaps.
const TILE_AREA = [
  { col: "1 / 5", row: "1 / 3" }, // Montana — tall lead
  { col: "5 / 7", row: "1 / 2" }, // Firefly — top right
  { col: "5 / 7", row: "2 / 3" }, // E-commerce — under Firefly
  { col: "1 / 4", row: "3 / 4" }, // Journey — bottom left
  { col: "4 / 7", row: "3 / 4" }, // Da Donut — bottom right
];

// Column/row weights (fr). On hover, the hovered tile's tracks swell and the
// others yield; a CSS transition on the grid template tweens between them.
const BASE_TEMPLATE = { cols: [1, 1, 1, 1, 1, 1], rows: [1, 1, 1] };
const GALLERY_TEMPLATES = [
  { cols: [1.22, 1.22, 1.22, 1.22, 0.78, 0.78], rows: [1.12, 1.12, 0.76] }, // Montana
  { cols: [0.86, 0.86, 0.86, 0.86, 1.55, 1.55], rows: [1.42, 0.82, 0.76] }, // Firefly
  { cols: [0.86, 0.86, 0.86, 0.86, 1.55, 1.55], rows: [0.82, 1.42, 0.76] }, // E-commerce
  { cols: [1.32, 1.32, 1.32, 0.78, 0.78, 0.78], rows: [0.8, 0.8, 1.4] }, // Journey
  { cols: [0.78, 0.78, 0.78, 1.32, 1.32, 1.32], rows: [0.8, 0.8, 1.4] }, // Da Donut
];

function GalleryView({ show }: { show: boolean }) {
  const [hovered, setHovered] = useState<number | null>(null);
  // The expanding template only applies once the bento is actually side-by-side
  // (sm+). On a single-column stack there's nothing to redistribute.
  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const update = () => setIsWide(mq.matches);
    update(); // sync the real value on mount (avoids a missed-change race)
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const tpl =
    isWide && hovered !== null ? GALLERY_TEMPLATES[hovered] : BASE_TEMPLATE;
  // minmax(0, …) keeps tracks purely proportional so title text can't widen a
  // column past its share.
  const toFr = (a: number[]) => a.map((f) => `minmax(0, ${f}fr)`).join(" ");

  return (
    <motion.div
      variants={listContainer}
      initial="hidden"
      animate={show ? "show" : "hidden"}
      onMouseLeave={() => setHovered(null)}
      className="grid grid-cols-1 gap-4 sm:gap-5"
      style={
        isWide
          ? {
              gridTemplateColumns: toFr(tpl.cols),
              gridTemplateRows: toFr(tpl.rows),
              height: 620,
              transition:
                "grid-template-columns 0.55s cubic-bezier(0.16,1,0.3,1), grid-template-rows 0.55s cubic-bezier(0.16,1,0.3,1)",
            }
          : undefined
      }
    >
      {PROJECTS.map((p, i) => {
        const dim = isWide && hovered !== null && hovered !== i;
        return (
          <motion.div
            key={p.title}
            variants={tileItem}
            onMouseEnter={() => setHovered(i)}
            className="group"
            style={
              isWide
                ? { gridColumn: TILE_AREA[i].col, gridRow: TILE_AREA[i].row }
                : undefined
            }
          >
            <div
              data-cursor-hover
              style={{ opacity: dim ? 0.5 : 1 }}
              className="relative h-full min-h-[300px] overflow-hidden rounded-2xl border border-hairline transition-[border-color,opacity] duration-500 ease-out-expo group-hover:border-white/25 sm:min-h-0"
            >
              {/* Cover slowly drifts in scale as the tile grows */}
              <div className="absolute inset-0 transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.07]">
                <ProjectCover
                  index={i}
                  from={p.from}
                  to={p.to}
                  className="h-full w-full"
                />
              </div>
              {/* Legibility scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

              <div className="relative flex h-full flex-col justify-end p-6">
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
                      {p.caption}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-semibold text-white sm:text-3xl">
                      {p.title}
                    </h3>
                    {/* Description fades/expands in only on the focused tile */}
                    <div
                      className="grid transition-all duration-500 ease-out-expo"
                      style={{
                        gridTemplateRows: hovered === i ? "1fr" : "0fr",
                        opacity: hovered === i ? 1 : 0,
                      }}
                    >
                      <p className="overflow-hidden text-sm leading-relaxed text-neutral-300/90">
                        <span className="mt-3 block max-w-md">
                          {p.description}
                        </span>
                      </p>
                    </div>
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
                  <ArrowUpRight
                    className="h-6 w-6 shrink-0 text-neutral-300 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
