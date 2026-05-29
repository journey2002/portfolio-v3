"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowUpRight, Eye } from "lucide-react";
import { Balancer } from "react-wrap-balancer";
import MagneticButton from "@/components/ui/MagneticButton";
import MouseParallax from "@/components/ui/MouseParallax";
import Particles from "@/components/ui/Particles";
import SplitText from "@/components/ui/SplitText";
import GridSpotlight from "@/components/ui/GridSpotlight";
import { useMarqueeSlowOnHover } from "@/components/ui/useMarqueeSlowOnHover";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

const MARQUEE_TAGS = [
  "UX/UI Designer",
  "Digital Artist",
  "Based in Thailand",
  "TNI Graduate",
  "Available for Work",
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  // Hero exits as you scroll — content lifts and fades, background scales.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const auroraScale = useTransform(scrollYProgress, [0, 1], [1, 1.4]);
  const auroraY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const gridY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  // Big-tag marker on the right edge — drifts up faster than content (deep parallax).
  const tagY = useTransform(scrollYProgress, [0, 1], [0, -260]);

  const marqueeHoverRef = useMarqueeSlowOnHover<HTMLDivElement>();

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden px-6 sm:px-10"
    >
      {/* Faint grid + cursor-glow grid — both mouse-parallaxed so the bright
          lines stay locked to the faint base lines as the layer drifts. */}
      <motion.div style={{ y: gridY }} className="absolute inset-0">
        <MouseParallax strength={16} className="absolute inset-0">
          <div className="grid-lines pointer-events-none absolute -inset-16" />
          <GridSpotlight className="-inset-16" size={620} gridSize={80} />
        </MouseParallax>
      </motion.div>

      {/* Aurora sweep — heavier mouse parallax, scroll-driven scale-up */}
      <motion.div
        aria-hidden
        style={{ y: auroraY, scale: auroraScale }}
        className="pointer-events-none absolute inset-0"
      >
        <MouseParallax strength={42} className="absolute inset-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1.6, delay: 0.8, ease: "easeOut" }}
            className="bg-aurora animate-aurora-shift absolute left-1/2 top-1/2 h-[120vh] w-[120vh] -translate-x-1/2 -translate-y-1/2 blur-3xl"
          />
        </MouseParallax>
      </motion.div>

      {/* Second, smaller orbiting accent — opposite mouse direction */}
      <motion.div
        aria-hidden
        style={{ y: auroraY }}
        className="pointer-events-none absolute inset-0"
      >
        <MouseParallax strength={28} follow className="absolute inset-0">
          <div className="absolute left-[18%] top-[24%] h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),transparent_70%)] blur-2xl" />
          <div className="absolute right-[14%] bottom-[16%] h-[36vh] w-[36vh] translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.18),transparent_70%)] blur-2xl" />
        </MouseParallax>
      </motion.div>

      {/* Drifting particle field — subtle dust above the aurora */}
      <Particles count={48} />

      {/* Smoothed vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_130%_at_50%_0%,transparent_38%,rgba(0,0,0,0.12)_58%,rgba(0,0,0,0.32)_76%,rgba(0,0,0,0.5)_90%,rgba(0,0,0,0.62)_100%)]" />
      {/* Film grain */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      {/* Asymmetric vertical guide rules — left and right tick marks */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-6 hidden flex-col items-center justify-between py-32 sm:flex sm:left-10"
      >
        <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-700 [writing-mode:vertical-rl]">
          Portfolio · 2026
        </span>
        <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-700 [writing-mode:vertical-rl]">
          Worapat Settapak
        </span>
      </div>

      {/* Side floating tag column on the right edge */}
      <motion.div
        aria-hidden
        style={{ y: tagY }}
        className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none flex-col items-end gap-4 sm:right-10 sm:flex"
      >
        <span className="font-serif text-[9rem] font-bold leading-none text-white/[0.04] sm:text-[12rem]">
          01
        </span>
        <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-600">
          Index — Hero
        </span>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto w-full max-w-6xl"
      >
        {/* Badge — top-left, breaks centered layout */}
        <motion.div
          custom={0.4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-10 flex items-center gap-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-white/[0.02] px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-neutral-400 backdrop-blur">
            <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent-gradient" />
            Worapat · Available for work
          </span>
          <span className="hidden h-px w-12 bg-hairline sm:block" />
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-neutral-600 sm:block">
            UX/UI &amp; Digital Art
          </span>
        </motion.div>

        {/* Headline — left aligned, split-text reveal */}
        <h1 className="font-serif font-bold leading-[0.94] tracking-tight text-white">
          <SplitText
            text="Designing"
            as="span"
            className="block text-[clamp(3.5rem,11vw,9rem)]"
            delay={0.5}
            stagger={0.035}
            fromY={90}
            fromRotate={5}
          />
          <SplitText
            text="experiences."
            as="span"
            className="block pb-2 text-[clamp(3.5rem,11vw,9rem)]"
            charClassName="bg-accent-gradient bg-clip-text text-transparent"
            delay={0.85}
            stagger={0.03}
            fromY={90}
            fromRotate={-4}
          />
        </h1>

        {/* Tagline — bottom-right corner of the content block */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="mt-10 grid grid-cols-1 items-end gap-10 sm:grid-cols-12 sm:gap-6"
        >
          <p className="text-base text-neutral-400 sm:col-span-5 sm:text-lg">
            <Balancer>
              UX/UI designer &amp; digital artist crafting{" "}
              <span className="text-neutral-200">interfaces people love</span> —
              from research to pixel-perfect prototype.
            </Balancer>
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-4 sm:col-span-7 sm:justify-end">
            <MagneticButton
              href="#work"
              glow
              className="px-7 py-3.5 text-sm font-medium text-white"
            >
              View my work
              <span className="relative inline-flex h-4 w-4 items-center justify-center">
                <ArrowUpRight
                  className="absolute h-4 w-4 transition-all duration-300 group-hover:rotate-45 group-hover:scale-50 group-hover:opacity-0"
                  strokeWidth={2}
                />
                <Eye
                  className="absolute h-4 w-4 scale-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
                  strokeWidth={2}
                />
              </span>
            </MagneticButton>
            <a
              href="#contact"
              className="group inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
            >
              Get in touch
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </a>
          </div>
        </motion.div>
      </motion.div>

      {/* Tagline strip — bottom marquee with diagonal markers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 1.8 }}
        className="absolute inset-x-0 bottom-0 border-t border-hairline bg-[#080808]/40 backdrop-blur"
      >
        <div ref={marqueeHoverRef} className="relative flex overflow-hidden py-3">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {MARQUEE_TAGS.concat(MARQUEE_TAGS).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="flex shrink-0 items-center gap-10 text-[11px] uppercase tracking-[0.35em] text-neutral-500"
              >
                {tag}
                <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="animate-marquee flex shrink-0 items-center gap-10 pr-10"
          >
            {MARQUEE_TAGS.concat(MARQUEE_TAGS).map((tag, i) => (
              <span
                key={`${tag}-dup-${i}`}
                className="flex shrink-0 items-center gap-10 text-[11px] uppercase tracking-[0.35em] text-neutral-500"
              >
                {tag}
                <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#about"
        aria-label="Scroll to about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-neutral-500 transition-colors hover:text-neutral-300"
      >
        <span className="flex flex-col items-center gap-3">
          Scroll
          <span className="relative h-8 w-px overflow-hidden bg-neutral-800">
            <span className="animate-scroll-line absolute inset-x-0 top-0 h-full bg-gradient-to-b from-transparent via-white to-transparent" />
          </span>
        </span>
      </motion.a>
    </section>
  );
}
