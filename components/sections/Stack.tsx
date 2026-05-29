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

// A card that tilts toward the cursor in 3D. On hover the content layers
// lift toward the viewer at staggered depths, a spotlight tracks the pointer,
// and the tool chips cascade up from the base of the card.
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // Pointer position within the card, normalised to -0.5..0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Raw pointer position in %, drives the spotlight gradient.
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [9, -9]), {
    stiffness: 180,
    damping: 16,
  });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), {
    stiffness: 180,
    damping: 16,
  });

  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${gx}% ${gy}%, rgba(99,102,241,0.22), transparent 65%)`;

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
    gx.set(nx * 100);
    gy.set(ny * 100);
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
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative flex h-full flex-col gap-5 rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur transition-colors duration-500 group-hover:border-indigo-accent/40"
      >
        {/* Static accent wash, brightens on hover */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-40 transition-opacity duration-500 group-hover:opacity-70`}
        />
        {/* Spotlight that tracks the cursor */}
        <motion.div
          aria-hidden
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Index */}
        <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-600 transition-transform duration-500 ease-out group-hover:[transform:translateZ(20px)]">
          0{index + 1}
        </span>

        {/* Icon — lifts furthest toward the viewer */}
        <div className="w-fit transition-transform duration-500 ease-out group-hover:[transform:translateZ(75px)]">
          <Icon
            className="h-7 w-7 text-indigo-accent transition-[filter,transform] duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(99,102,241,0.65)]"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="font-serif text-2xl font-semibold text-white transition-transform duration-500 ease-out group-hover:[transform:translateZ(50px)]">
          {feature.label}
        </h3>
        <p className="text-sm leading-relaxed text-neutral-400 transition-transform duration-500 ease-out group-hover:[transform:translateZ(28px)]">
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
                className="inline-flex translate-y-3 items-center gap-2 rounded-full border border-indigo-accent/30 bg-base/60 px-3 py-1 text-[11px] font-medium tracking-wide text-neutral-200 opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:[transform:translateY(0)_translateZ(55px)]"
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
