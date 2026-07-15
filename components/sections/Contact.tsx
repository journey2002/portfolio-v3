"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { Github, Linkedin, Instagram, Phone, ArrowUpRight } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import Globe from "@/components/ui/Globe";

// TODO: replace each href with the real profile URL — these are still platform
// homepages, which read as broken links to visitors. (GitHub is likely
// github.com/journey2002 or github.com/worapat2002 — use the public-facing one.)
const SOCIALS = [
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com", // TODO: real profile URL
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://linkedin.com", // TODO: real profile URL
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com", // TODO: real profile URL
  },
];

const bangkokTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  hour: "2-digit",
  minute: "2-digit",
});

/* Live Bangkok clock for the footer bar. Isolated in its own component so the
   per-minute tick re-renders just this span, not the whole (heavy) section.
   SSR bakes in the build-time value, hence suppressHydrationWarning + an
   immediate tick on mount; timeouts align to the minute boundary so it never
   shows a stale minute. */
function BangkokClock() {
  const [time, setTime] = useState(() => bangkokTime.format(new Date()));

  useEffect(() => {
    let id: number;
    const tick = () => {
      setTime(bangkokTime.format(new Date()));
      id = window.setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50);
    };
    tick();
    return () => window.clearTimeout(id);
  }, []);

  return <span suppressHydrationWarning>{time}</span>;
}

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });

  // Giant wordmark slides horizontally as the section scrolls into view.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const wordmarkX = useTransform(scrollYProgress, [0, 1], ["20%", "-40%"]);

  return (
    <footer
      id="contact"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-hairline bg-night"
    >
      <SectionLabel index="04" caption="Contact" align="left" />

      {/* Aurora — deliberately static. Don't re-add animate-aurora-shift: its
          keyframes own `transform` outright (animations beat the cascade), so
          they discard this element's -translate-x-1/2 — the glow sat with its
          left edge on the centerline — and, hard-clipped by the footer's
          overflow at border-t, the scale pulse read as the glow resizing
          rather than ambient drift. Static, the centering utility applies
          again. No blur filter, same reasoning as the hero's aurora (see
          Hero.tsx): the gradient is already smooth and a measured pixel-diff
          against a blurred render is imperceptible. */}
      <div
        aria-hidden
        className="bg-aurora pointer-events-none absolute -top-1/2 left-1/2 h-[90vh] w-[90vh] -translate-x-1/2 opacity-25"
      />
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      <div
        ref={ref}
        className="relative mx-auto max-w-7xl px-6 py-32 sm:px-10 md:py-40"
      >
        {/* Pre-heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-ink-faint"
        >
          <span className="text-ink">[04]</span>
          <span className="h-px w-12 bg-hairline" />
          <span>Get in touch</span>
        </motion.div>

        {/* Heading */}
        <h2 className="mt-8 font-serif text-5xl font-bold leading-[1.02] text-ink-strong sm:text-7xl md:text-8xl">
          <SplitText
            text="Let's make"
            as="span"
            className="block"
            immediate={false}
            stagger={0.03}
            fromY={70}
          />
          <SplitText
            text="something good."
            as="span"
            className="block"
            charClassName="bg-accent-gradient bg-clip-text text-transparent"
            immediate={false}
            stagger={0.025}
            delay={0.2}
            fromY={70}
            fromRotate={-3}
          />
        </h2>

        {/* Two-column layout — email/phone left, social tile grid right. The
            split waits for lg: at md the right column is ~260px, which pinched
            the social tiles to 80px and clipped their labels. */}
        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-xs uppercase tracking-[0.35em] text-ink-faint"
            >
              Reach me at
            </motion.p>
            <motion.a
              href="mailto:Worapat2002@gmail.com"
              data-cursor-hover
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1] as const,
                delay: 0.3,
              }}
              className="group mt-3 inline-flex items-baseline gap-3 text-2xl text-ink transition-colors duration-200 hover:text-ink-strong sm:text-3xl"
            >
              <span className="underline-wipe">Worapat2002@gmail.com</span>
              <ArrowUpRight
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </motion.a>
            <motion.a
              href="tel:+66926723004"
              data-cursor-hover
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.4,
              }}
              className="mt-4 flex w-fit items-center gap-2 text-sm text-ink-subtle transition-colors duration-200 hover:text-ink-strong"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>092-672-3004</span>
            </motion.a>
          </div>

          {/* Right column: location + social tiles */}
          <div className="flex flex-col gap-3 lg:col-span-5">
            {/* Location tile — rotating globe + Bangkok marker */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.4,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-hairline bg-surface/40 p-5 backdrop-blur transition-colors duration-300 hover:border-indigo-accent/40"
            >
              <div className="shrink-0">
                <Globe size={96} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                  Currently in
                </p>
                <p className="mt-1 font-serif text-lg font-semibold leading-tight text-ink-strong sm:text-xl">
                  Bangkok, Thailand
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  UTC+7 · ICT
                </p>
              </div>
            </motion.div>

            {/* Social tile grid */}
            <motion.div
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.08, delayChildren: 0.55 },
                },
              } satisfies Variants}
              className="grid grid-cols-3 gap-3"
            >
              {SOCIALS.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  data-cursor-hover
                  variants={{
                    hidden: { opacity: 0, y: 20, rotate: -3 },
                    show: {
                      opacity: 1,
                      y: 0,
                      rotate: 0,
                      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                    },
                  } satisfies Variants}
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="group relative flex aspect-square flex-col justify-between rounded-2xl border border-hairline bg-surface/40 p-4 text-ink-muted backdrop-blur transition-colors duration-300 hover:border-indigo-accent/40 hover:text-ink-strong sm:p-5"
                >
                  <social.icon className="h-6 w-6" strokeWidth={1.5} />
                  <div className="flex items-end justify-between">
                    {/* Compact type below sm — a ~100px tile can't carry 10px
                        glyphs at 0.3em tracking ("INSTAGRAM" clipped). */}
                    <span className="text-[9px] uppercase tracking-[0.14em] sm:text-[10px] sm:tracking-[0.3em]">
                      {social.label}
                    </span>
                    <ArrowUpRight
                      className="hidden h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block"
                      strokeWidth={1.5}
                    />
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Giant horizontal wordmark — parallax sweeps across the bottom.
          Rendered as SVG stroked text (not CSS -webkit-text-stroke): at this
          size the CSS stroke has no antialiasing, so its 1px outline stair-steps
          and breaks into blocky, disconnected segments — a jagged "lego" edge.
          An SVG stroke is vector-antialiased, so the outline stays one smooth,
          continuous line. viewBox (1143×108) matches the text's aspect at font
          100, so `h-[30vw] w-auto` reproduces the previous 28vw glyph size and
          the % parallax still sweeps over the same distance. `non-scaling-stroke`
          keeps the hairline a true device pixel regardless of the viewBox scale. */}
      <div className="pointer-events-none relative -mt-10 overflow-hidden pb-10 sm:-mt-20 sm:pb-16">
        <motion.svg
          style={{ x: wordmarkX }}
          aria-hidden
          viewBox="0 0 439 108"
          className="block h-[30vw] w-auto max-w-none select-none overflow-visible"
        >
          <text
            x="0"
            y="100"
            xmlSpace="preserve"
            fontSize="100"
            letterSpacing="-2.5"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="font-numeral font-bold"
            style={{ stroke: "var(--wordmark-stroke)", strokeWidth: 1.25 }}
          >
            WORAPAT
          </text>
        </motion.svg>
      </div>

      {/* Footer bar */}
      <div className="relative border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-ink-subtle sm:flex-row sm:px-10">
          <p>
            © {new Date().getFullYear()} Worapat Settapak. All rights reserved.
          </p>
          <p className="inline-flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <span>
              Bangkok · <BangkokClock /> ICT
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
