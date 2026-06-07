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

// A card finished like a sheet of matte metal: a faint brushed grain over a
// soft gunmetal wash, with a wide diffuse sheen that drifts across as the card
// tilts. The motion is intentionally slow and a little heavy so hovering feels
// calm rather than twitchy, and the content layers lift gently toward the eye.
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

  // The highlight glides with the cursor through that same soft spring, so it's
  // interactive but gentle — no autoplay. The near layer travels a little
  // further than the far one, so the two reflections part slightly: a soft 3D
  // parallax on top of the depth offset. (Percentages are band-relative.)
  const sheenFar = useTransform(rotateY, [-6, 6], ["-50%", "50%"]);
  const sheenNear = useTransform(rotateY, [-6, 6], ["-110%", "110%"]);

  // Dynamic glare angle — a smooth, CONTINUOUS tilt mapped linearly from the
  // cursor offset: vertical position rolls the streak (top leans one way, bottom
  // the other) and horizontal adds a smaller turn. Linear, not atan2, so there
  // is no angular wrap — sweeping top↔bottom rolls the band through the steep
  // angles continuously ("past the side") instead of snapping/flipping at the
  // centre. Clamped so it can't whip fully past horizontal; 0 at centre, so the
  // resting look is unchanged (still skewX(-14) with zero added rotation).
  const glareAngleTarget = useTransform([px, py], ([x, y]: number[]) =>
    Math.max(-80, Math.min(80, y * 130 + x * 30)),
  );
  // Soft + heavy + overdamped so the angle glides through steep top/bottom
  // sweeps instead of snapping (no overshoot). Slower natural frequency than the
  // tilt spring, so rotation eases gently while the sheen position stays prompt.
  const glareAngle = useSpring(glareAngleTarget, {
    stiffness: 55,
    damping: 24,
    mass: 1.2,
  });

  // Edge flare — the rim lights up exactly where the glare band meets it, so it
  // has to follow the band as it BOTH slides and rotates. The band's centre
  // tracks the horizontal cursor (like the near sheen: 50% ±33%), and its total
  // tilt from vertical is 14° (skew) + the dynamic glareAngle. Projecting the
  // card's half-height across its width by tan(tilt) gives where the band's
  // top/bottom ends cross each edge. (R≈41 = halfHeight/width × 100; the top end
  // sits to the +offset side, the bottom end to the −offset side.)
  const bandCenterX = useTransform(rotateY, [-6, 6], [17, 83]);
  const edgeOffset = useTransform(glareAngle, (a: number) => {
    // Clamp the tilt just shy of 90° so tan() stays finite and never flips sign
    // (past 90° it would jump the hot-spot to the wrong side of a horizontal band).
    const tilt = Math.max(-84, Math.min(84, 14 + a));
    return 41 * Math.tan((tilt * Math.PI) / 180);
  });
  const topGlowX = useTransform([bandCenterX, edgeOffset], ([c, o]: number[]) =>
    Math.max(-20, Math.min(120, c + o)),
  );
  const bottomGlowX = useTransform([bandCenterX, edgeOffset], ([c, o]: number[]) =>
    Math.max(-20, Math.min(120, c - o)),
  );
  const edgeGlow = useMotionTemplate`radial-gradient(150px 70px at ${bottomGlowX}% 100%, rgba(255,255,255,0.95), rgba(190,200,255,0.4) 34%, transparent 68%), radial-gradient(110px 52px at ${topGlowX}% 0%, rgba(255,255,255,0.7), rgba(190,200,255,0.22) 40%, transparent 72%)`;
  // A larger, cooler halo for the glow that bleeds OUTSIDE the card. It lives on
  // a blurred layer behind the card, so the bright edge spills past the rim into
  // the dark — like a metal lip throwing light. Same moving hit-points.
  const outerGlow = useMotionTemplate`radial-gradient(190px 130px at ${bottomGlowX}% 100%, rgba(176,191,255,0.6), rgba(150,170,255,0.24) 46%, transparent 72%), radial-gradient(140px 96px at ${topGlowX}% 0%, rgba(176,191,255,0.42), transparent 72%)`;

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
      {/* Outer glow — a soft cool halo behind the card that spills past the rim
          where the reflection meets the edge, like a metal lip throwing light
          into the dark. The heavy blur lets it bleed beyond the card bounds; it
          tracks the same hit-points and only shows on hover. */}
      <motion.div
        aria-hidden
        style={{ background: outerGlow }}
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
          {/* Brushed striations — faint vertical grain running down the metal */}
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 4px)",
            }}
          />
          {/* Matte micro-grain — fine noise that takes the gloss off the surface */}
          <div
            className="absolute inset-0 opacity-[0.12] mix-blend-soft-light"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='180'%20height='180'%3E%3Cfilter%20id='m'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23m)'/%3E%3C/svg%3E\")",
            }}
          />
          {/* (The reflection is intentionally NOT here — it lives outside this
              overflow-hidden clip so it can float in real 3D. See below.) */}
        </div>
        {/* 3D reflection — soft highlight bands on two depth planes (translateZ).
            They glide with the cursor through the soft tilt spring (interactive,
            not autoplay), and the depth offset makes them parallax for real 3D.
            clip-path (not overflow-hidden) rounds them without flattening 3D. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-out [transform:translateZ(22px)] group-hover:opacity-70"
          style={{ clipPath: "inset(0 round 1rem)" }}
        >
          <motion.div
            style={{ x: sheenFar, skewX: -14, rotate: glareAngle }}
            className="absolute -inset-y-full left-[25%] w-[50%] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent blur-2xl"
          />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 ease-out [transform:translateZ(90px)] group-hover:opacity-100"
          style={{ clipPath: "inset(0 round 1rem)" }}
        >
          <motion.div
            style={{ x: sheenNear, skewX: -14, rotate: glareAngle }}
            className="absolute -inset-y-full left-[35%] w-[30%] bg-gradient-to-r from-transparent via-white/[0.13] to-transparent blur-xl"
          />
        </div>
        {/* Edge flare — the card's STROKE lights up where the reflection meets
            the rim (not an inner bloom). The mask keeps the moving hot-spots on
            the ~1.5px border ring only; the drop-shadow gives the lit segment a
            soft bloom, like a metal edge catching the sun. */}
        <motion.div
          aria-hidden
          style={{
            background: edgeGlow,
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
