"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useVelocity,
  useSpring,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";
import { Layers, PenTool, MousePointer2 } from "lucide-react";
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
  },
  {
    icon: PenTool,
    label: "Digital Illustration",
    description:
      "Character art, fan art, and visual storytelling crafted in Procreate and Photoshop — where imagination meets technique.",
    accent: "from-violet-500/30 to-transparent",
  },
  {
    icon: MousePointer2,
    label: "Interaction Design",
    description:
      "Thoughtful micro-interactions and prototypes that put the user's experience first — because every click should feel right.",
    accent: "from-fuchsia-500/30 to-transparent",
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
          <div className="animate-marquee flex shrink-0 items-center gap-14 pr-14">
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
            className="animate-marquee flex shrink-0 items-center gap-14 pr-14"
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
          <motion.div
            key={feature.label}
            variants={featureItem(i)}
            whileHover={{ y: -8 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            className="group relative flex flex-col gap-5 rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur transition-colors hover:border-indigo-accent/30"
          >
            {/* Accent wash that flares on hover */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${feature.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
            />

            {/* Index */}
            <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-600">
              0{i + 1}
            </span>

            <feature.icon
              className="h-7 w-7 text-indigo-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
              strokeWidth={1.5}
            />
            <h3 className="font-serif text-2xl font-semibold text-white">
              {feature.label}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-400">
              {feature.description}
            </p>

            {/* Bottom hairline arrow that wipes in on hover */}
            <span className="mt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-neutral-600 transition-colors duration-300 group-hover:text-white">
              <span className="block h-px w-6 origin-left bg-current transition-transform duration-500 group-hover:scale-x-150" />
              Discipline
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
