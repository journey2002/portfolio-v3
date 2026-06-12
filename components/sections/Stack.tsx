"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useVelocity,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";
import { Layers, PenTool, MousePointer2, type LucideIcon } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import { useMarqueeSlowOnHover } from "@/components/ui/useMarqueeSlowOnHover";

const TICKER = [
  "Figma",
  "Photoshop",
  "Procreate",
  "Framer",
  "HTML & CSS",
  "JavaScript",
  "3D Art",
  "Illustrator",
  "After Effects",
];

const FEATURES = [
  {
    icon: Layers,
    label: "UX/UI Design",
    description:
      "Research-driven design from wireframe to pixel-perfect prototype, built to feel intuitive and effortless for the people using it.",
    accent: "from-indigo-500/30 to-transparent",
    tools: ["Figma", "HTML & CSS", "JavaScript"],
  },
  {
    icon: PenTool,
    label: "Digital Illustration",
    description:
      "Character art, fan art, and visual storytelling crafted in Procreate and Photoshop — where imagination meets technique.",
    accent: "from-violet-500/30 to-transparent",
    tools: ["Procreate", "Photoshop", "Illustrator"],
  },
  {
    icon: MousePointer2,
    label: "Interaction Design",
    description:
      "Thoughtful micro-interactions and prototypes that put the user's experience first — because every click should feel right.",
    accent: "from-fuchsia-500/30 to-transparent",
    tools: ["Framer", "After Effects", "JavaScript"],
  },
];

const featureVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

// Feature items rise on a diagonal, alternating sides.
const featureItem = (i: number): Variants => ({
  hidden: { opacity: 0, y: 36, x: i % 2 === 0 ? -24 : 24, rotate: i % 2 === 0 ? -2 : 2 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
});

type Feature = {
  icon: LucideIcon;
  label: string;
  description: string;
  accent: string;
  tools: string[];
};

// A card finished like a sheet of satin metal under a fixed studio light: a
// soft gunmetal wash with a fine matte grain. Rock the card and the rising
// side catches the light — face, rim and outer spill all answer to the tilt
// alone; nothing chases the cursor. The motion is intentionally slow and a
// little heavy so hovering feels calm rather than twitchy, and the content
// layers lift gently toward the eye.
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Pointer position within the card, normalised to -0.5..0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Gentle tilt — a soft, slightly heavy spring smooths small cursor movements
  // instead of snapping the card around.
  const spring = { stiffness: 110, damping: 26, mass: 1.1 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), spring);

  // ---- Reflection, modelled on a FIXED studio light above the viewer — the
  // card tilts beneath it. Nothing tracks the cursor: the response derives
  // purely from the tilt springs, so the highlight glides toward whichever
  // side RISES (opposite the cursor), the way a real card flashes when you
  // rock it.
  // ONE continuous pool of light, not four edge zones: its centre sits just
  // past the rim on the rising side, and its strength follows the overall
  // tilt magnitude. Position and strength are both continuous, so the light
  // sweeps smoothly through corners and diagonals — no quadrant switching,
  // no hard hand-offs through the centre.
  const lightPosX = useTransform(rotateY, [-6, 6], [110, -10]);
  const lightPosY = useTransform(rotateX, [-6, 6], [-10, 110]);
  const lightA = useTransform([rotateX, rotateY], ([rx, ry]: number[]) =>
    Math.min(1, Math.hypot(rx, ry) / 6),
  );
  // Face, rim and halo all scale from the same strength, so the three layers
  // always agree.
  const faceA = useTransform(lightA, (a) => a * 0.1);
  const faceA2 = useTransform(lightA, (a) => a * 0.045);
  const rimA = useTransform(lightA, (a) => a * 0.5);
  const rimA2 = useTransform(lightA, (a) => a * 0.16);
  const haloA = useTransform(lightA, (a) => a * 0.34);

  // Face sheen — the pool's soft lap onto the surface. Multi-stop falloff so
  // it reads as light, not a slab with an edge.
  const sheen = useMotionTemplate`radial-gradient(130% 130% at ${lightPosX}% ${lightPosY}%, rgba(238,242,255,${faceA}), rgba(203,213,255,${faceA2}) 35%, transparent 68%)`;
  // Rim light — the border ring catching the same pool, hottest where the
  // ring passes closest to its centre.
  const rim = useMotionTemplate`radial-gradient(95% 95% at ${lightPosX}% ${lightPosY}%, rgba(255,255,255,${rimA}), rgba(190,200,255,${rimA2}) 40%, transparent 72%)`;
  // Outer halo — the same pool on a blurred layer behind the card, so the
  // lit edge throws a little light past the rim into the dark.
  const halo = useMotionTemplate`radial-gradient(105% 105% at ${lightPosX}% ${lightPosY}%, rgba(176,191,255,${haloA}), transparent 66%)`;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  const Icon = feature.icon;

  return (
    <motion.div
      variants={featureItem(index)}
      className="group relative [perspective:1100px]"
    >
      {/* Outer halo — the same tilt response on a blurred layer behind the
          card, so a lit edge throws a little light past the rim into the dark.
          Hover-only. */}
      <motion.div
        aria-hidden
        style={{ background: halo }}
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 ease-out group-hover:opacity-100"
      />
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative flex h-full flex-col gap-5 rounded-2xl border border-hairline bg-surface/30 p-7 backdrop-blur-xl transition-colors duration-500 group-hover:border-white/20"
      >
        {/* Glass reflections — clipped to the rounded card via this wrapper.
            overflow-hidden lives here (not on the card) so the card keeps its
            preserve-3d context and the content can still lift toward the viewer. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        >
          {/* Resting accent wash — keeps each card's colour identity */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-30`}
          />
          {/* Metallic volume — soft light off the top, shading toward the base,
              so the surface reads like a slightly lit sheet of metal */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.07] via-transparent to-black/20" />
          {/* Light falloff — a soft overhead pool of light plus a corner
              vignette, so the face reads as a gently curved sheet instead of
              a flat digital fill. No pattern layers beyond this: the surface
              stays a clean satin, and the fine grain below just kills gloss. */}
          <div className="absolute inset-0 bg-[radial-gradient(130%_110%_at_50%_-10%,rgba(255,255,255,0.05),transparent_55%),radial-gradient(150%_140%_at_50%_55%,transparent_52%,rgba(0,0,0,0.26)_100%)]" />
          {/* Matte micro-grain — fine noise that takes the gloss off the
              surface; per-card seed so the sheets aren't clones. */}
          <div
            className="absolute inset-0 opacity-[0.1] mix-blend-soft-light"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='180'%20height='180'%3E%3Cfilter%20id='m'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='1.25'%20numOctaves='2'%20seed='${2 + index * 9}'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23m)'/%3E%3C/svg%3E")`,
            }}
          />
          {/* (The face sheen is intentionally NOT here — it lives outside
              this overflow-hidden clip on a raised depth plane so it can
              float in real 3D. See below.) */}
        </div>
        {/* Face sheen — light pooling along whichever side rises toward the
            fixed light. It rides a slightly raised depth plane (translateZ),
            so the perspective tilt keeps it reading as light on glass rather
            than a decal. clip-path (not overflow-hidden) rounds it without
            flattening the card's 3D context. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-out [transform:translateZ(40px)] group-hover:opacity-100"
          style={{ clipPath: "inset(0 round 1rem)" }}
        >
          <motion.div style={{ background: sheen }} className="absolute inset-0" />
        </div>
        {/* Rim light — the card's STROKE catching the light (not an inner
            bloom). The mask keeps it on the ~1.5px border ring only; the
            edges rising toward the light brighten, and the drop-shadow gives
            the lit segment a soft bloom, like a metal edge catching the sun. */}
        <motion.div
          aria-hidden
          style={{
            background: rim,
            padding: "1.5px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            // Tight white rim bloom so the lit stroke reads crisp; the wider
            // outward halo is handled by the dedicated outer-glow layer behind
            // the card (so it can actually bleed past the rim into the dark).
            filter: "drop-shadow(0 0 3px rgba(255,255,255,0.5))",
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
        />
        {/* Soft highlight skimming the top edge — diffuse, not a glossy line */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 blur-[1px] transition-opacity duration-700 group-hover:opacity-100"
        />

        {/* Index */}
        <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 transition-transform duration-700 ease-out group-hover:[transform:translateZ(12px)]">
          0{index + 1}
        </span>

        {/* Icon — lifts furthest toward the viewer */}
        <div className="w-fit transition-transform duration-700 ease-out group-hover:[transform:translateZ(42px)]">
          <Icon
            className="h-7 w-7 text-indigo-accent transition-transform duration-500 group-hover:scale-110"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="font-serif text-2xl font-semibold text-white transition-transform duration-700 ease-out group-hover:[transform:translateZ(30px)]">
          {feature.label}
        </h3>
        <p className="text-sm leading-relaxed text-neutral-400 transition-transform duration-700 ease-out group-hover:[transform:translateZ(16px)]">
          {feature.description}
        </p>

        {/* Footer zone — swaps the discipline hint for the tool chips */}
        <div className="relative mt-2 min-h-[34px] [transform-style:preserve-3d]">
          {/* Resting hint */}
          <span className="absolute inset-0 flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-neutral-600 transition-all duration-300 group-hover:-translate-y-1 group-hover:opacity-0">
            <span className="block h-px w-6 bg-current" />
            Discipline
          </span>
          {/* Tool chips that cascade up on hover */}
          <div className="absolute inset-0 flex flex-wrap items-center gap-2 [transform-style:preserve-3d]">
            {feature.tools.map((tool, t) => (
              <span
                key={tool}
                style={{ transitionDelay: `${80 + t * 70}ms` }}
                className="inline-flex translate-y-3 items-center gap-2 rounded-full border border-indigo-accent/30 bg-base/60 px-3 py-1 text-[11px] font-medium tracking-wide text-neutral-200 opacity-0 transition-all duration-700 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:[transform:translateY(0)_translateZ(30px)]"
              >
                <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
                {tool}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Stack() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-10%" });
  const gridInView = useInView(gridRef, { once: true, margin: "-10%" });

  // Velocity-aware marquee — fast scroll skews it, fast scrolling reverses it.
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  // Convert velocity to a small skew (px/s → deg).
  const skew = useTransform(smoothVelocity, [-2000, 0, 2000], [-12, 0, 12], {
    clamp: true,
  });
  // Direction multiplier — flipped briefly while scrolling fast in reverse.
  const directionRef = useRef(1);
  useMotionValueEvent(smoothVelocity, "change", (v) => {
    if (v < -50) directionRef.current = -1;
    else if (v > 50) directionRef.current = 1;
  });

  // Section-level parallax for the marquee strip — it slides slightly faster
  // than scroll, giving the impression of depth behind the feature grid.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const marqueeX = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  const marqueeHoverRef = useMarqueeSlowOnHover<HTMLDivElement>();

  return (
    <section
      id="stack"
      ref={sectionRef}
      className="relative overflow-hidden py-32 md:py-44"
    >
      <SectionLabel index="03" caption="Skills" align="right" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-12 items-end gap-6">
          <motion.div
            ref={headingRef}
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="col-span-12 sm:col-span-8"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              <span className="text-neutral-300">[03]</span> &nbsp; Skills &amp;
              tools
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              <SplitText
                text="A toolkit"
                as="span"
                className="block"
                immediate={false}
                stagger={0.025}
                fromY={42}
              />
              <SplitText
                text="for craft."
                as="span"
                className="block"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                immediate={false}
                stagger={0.03}
                delay={0.12}
                fromY={42}
                fromRotate={-3}
              />
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={headingInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-12 hidden text-right text-[10px] uppercase tracking-[0.35em] text-neutral-600 sm:col-span-4 sm:block"
          >
            ↳ 09 tools · 03 disciplines
          </motion.div>
        </div>
      </div>

      {/* Velocity-skewed marquee */}
      <motion.div
        ref={marqueeHoverRef}
        style={{ x: marqueeX }}
        className="relative mt-16 flex overflow-hidden border-y border-hairline py-8"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-40 bg-gradient-to-r from-base via-base/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-40 bg-gradient-to-l from-base via-base/80 to-transparent" />
        <motion.div
          style={{ skewX: skew }}
          className="flex w-full origin-center"
        >
          <div className="animate-marquee flex shrink-0 items-center">
            <div className="flex shrink-0 items-center gap-14 pr-14">
              {TICKER.map((item) => (
                <span
                  key={item}
                  className="inline-flex shrink-0 items-center gap-14 font-serif text-3xl font-medium text-neutral-600 transition-colors duration-200 hover:text-white sm:text-4xl md:text-5xl"
                >
                  {item}
                  <span className="h-1.5 w-1.5 rotate-45 bg-accent-gradient" />
                </span>
              ))}
            </div>
            <div
              aria-hidden
              className="flex shrink-0 items-center gap-14 pr-14"
            >
              {TICKER.map((item) => (
                <span
                  key={`${item}-dup`}
                  className="inline-flex shrink-0 items-center gap-14 font-serif text-3xl font-medium text-neutral-600 transition-colors duration-200 hover:text-white sm:text-4xl md:text-5xl"
                >
                  {item}
                  <span className="h-1.5 w-1.5 rotate-45 bg-accent-gradient" />
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Feature grid */}
      <motion.div
        ref={gridRef}
        variants={featureVariants}
        initial="hidden"
        animate={gridInView ? "show" : "hidden"}
        className="relative mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-6 px-6 sm:px-10 md:grid-cols-3"
      >
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.label} feature={feature} index={i} />
        ))}
      </motion.div>
    </section>
  );
}
