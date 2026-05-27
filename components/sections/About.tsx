"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
  }),
};

const BIO_WORDS_1 = [
  "Hi",
  "there!",
  "I'm",
  "Worapat",
  "Settapak —",
  "a",
  "UX/UI",
  "designer,",
  "digital",
  "artist,",
  "and",
  "anime",
  "lover",
  "based",
  "in",
  "Thailand.",
];

const BIO_WORDS_2 = [
  "I'm",
  "a",
  "proud",
  "graduate",
  "of",
  "Thai-Nichi",
  "Institute",
  "of",
  "Technology,",
  "finding",
  "joy",
  "in",
  "creating",
  "meaningful",
  "experiences",
  "through",
  "design,",
  "illustration,",
  "and",
  "3D",
  "art.",
];

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });

  // Section-level scroll progress drives the parallax movement of the TNI display
  // and the word-by-word reveal of the bio.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // TNI display floats slowly upward and gently rotates as it scrolls through.
  // Range is kept small so the card never travels far enough to overlap the
  // hairline divider above the section. Scale is capped at 1.0 so growing
  // never adds extra upward travel from the visual bounding box.
  const tniY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);
  const tniScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.97, 1, 1]);
  const tniRotate = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  // Word-by-word brightness — each word reaches full opacity in turn as the
  // section progresses, like a paragraph being "read" by the scroll.
  const totalWords = BIO_WORDS_1.length + BIO_WORDS_2.length;

  // Tag chips fly in alternating left/right based on inView.
  const tags = ["UX/UI Design", "Digital Art", "3D Art", "Anime", "Drawing"];

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden py-32 md:py-44"
    >
      <SectionLabel index="01" caption="About" align="right" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        {/* Section header */}
        <div className="grid grid-cols-12 items-end gap-6">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="col-span-12 sm:col-span-6"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              <span className="text-neutral-300">[01]</span> &nbsp; About me
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
              <SplitText
                text="A quiet designer with"
                as="span"
                className="block"
                immediate={false}
                stagger={0.022}
                fromY={42}
              />
              <SplitText
                text="loud ideas."
                as="span"
                className="block"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                immediate={false}
                stagger={0.025}
                delay={0.18}
                fromY={42}
                fromRotate={-4}
              />
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={0.2}
            initial="hidden"
            animate={inView ? "show" : "hidden"}
            className="col-span-12 hidden text-right text-[10px] uppercase tracking-[0.35em] text-neutral-600 sm:col-span-6 sm:block"
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

        <div
          ref={ref}
          className="grid grid-cols-1 gap-12 pb-16 pt-24 md:grid-cols-12 md:gap-8"
        >
          {/* Designer ID card — parallax-floating identity panel */}
          <div className="relative md:col-span-5">
            <motion.div
              style={{
                y: tniY,
                scale: tniScale,
                rotate: tniRotate,
              }}
              className="relative"
            >
              {/* Card surface */}
              <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-hairline bg-surface/50 backdrop-blur">
                {/* Subtle gradient header band */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-500/15 via-violet-500/5 to-transparent"
                />

                {/* Decorative corner ticks */}
                <span
                  aria-hidden
                  className="absolute left-2 top-2 h-3 w-3 border-l border-t border-indigo-accent/50"
                />
                <span
                  aria-hidden
                  className="absolute right-2 top-2 h-3 w-3 border-r border-t border-indigo-accent/50"
                />
                <span
                  aria-hidden
                  className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-indigo-accent/50"
                />
                <span
                  aria-hidden
                  className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-indigo-accent/50"
                />

                <div className="relative p-7">
                  {/* Header — file label + live indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.4em] text-neutral-500">
                      // Character sheet
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] text-neutral-500">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      Vibing
                    </span>
                  </div>

                  {/* Avatar mark + name */}
                  <div className="mt-6 flex items-end gap-4">
                    {/* Geometric monogram — gradient ring + initials */}
                    <div className="relative h-16 w-16 shrink-0">
                      <div className="absolute inset-0 rounded-full bg-accent-gradient" />
                      <div className="absolute inset-[2px] flex items-center justify-center rounded-full bg-base">
                        <span className="font-serif text-xl font-bold text-white">
                          WS
                        </span>
                      </div>
                      {/* Tiny orbiting dot */}
                      <motion.span
                        aria-hidden
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 9,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute inset-0"
                      >
                        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(168,85,247,0.7)]" />
                      </motion.span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-xl font-semibold leading-tight text-white">
                        Worapat S.
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                        Pixel wrangler · daydream architect
                      </p>
                    </div>
                  </div>

                  {/* Hairline divider */}
                  <div className="my-6 h-px w-full bg-hairline" />

                  {/* Vitals — key/value rows */}
                  <ul className="space-y-3 text-xs">
                    {[
                      { k: "Based", v: "Bangkok" },
                      { k: "Craft", v: "UX/UI · Illustration · 3D" },
                      { k: "Loadout", v: "Figma · Procreate · Blender" },
                      { k: "Schooled", v: "TNI · Class of '20" },
                    ].map((row) => (
                      <li key={row.k} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-[10px] uppercase tracking-[0.25em] text-neutral-600">
                          {row.k}
                        </span>
                        <span className="h-px flex-1 bg-hairline/60" />
                        <span className="shrink-0 text-neutral-300">
                          {row.v}
                        </span>
                      </li>
                    ))}
                    <li className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-[10px] uppercase tracking-[0.25em] text-neutral-600">
                        Status
                      </span>
                      <span className="h-px flex-1 bg-hairline/60" />
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-emerald-300">
                        <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Open to projects
                      </span>
                    </li>
                  </ul>

                  {/* Bottom row — version stamp + signature squiggle */}
                  <div className="mt-7 flex items-end justify-between">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-700">
                      Build · v.2
                    </span>
                    <svg
                      width="68"
                      height="22"
                      viewBox="0 0 68 22"
                      fill="none"
                      aria-hidden
                      className="text-neutral-400"
                    >
                      <path
                        d="M2 15 Q 8 4, 14 11 T 26 13 Q 32 5, 38 15 T 52 11 L 62 14"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <circle cx="64" cy="14" r="1.4" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Floating personality chips around the card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -right-4 -top-4 hidden rotate-6 rounded-full border border-hairline bg-[#0c0c0c] px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-neutral-400 backdrop-blur md:block"
              >
                ✦ Anime apologist
              </motion.div>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{
                  duration: 5.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -bottom-5 -left-5 hidden -rotate-6 rounded-full border border-hairline bg-[#0c0c0c] px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-neutral-400 backdrop-blur md:block"
              >
                🍫 Coco daily
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }}
                className="absolute -right-6 bottom-12 hidden rotate-3 rounded-full border border-indigo-accent/40 bg-[#0c0c0c] px-3 py-1 text-[9px] uppercase tracking-[0.3em] text-indigo-200 backdrop-blur lg:block"
              >
                ★ INFP
              </motion.div>
            </motion.div>
          </div>

          {/* Bio with scroll-driven word brightness */}
          <div className="space-y-6 md:col-span-7">
            <ScrollText
              words={BIO_WORDS_1}
              start={0.1}
              end={0.35}
              scrollProgress={scrollYProgress}
              totalWords={totalWords}
              wordOffset={0}
              className="text-xl leading-relaxed sm:text-2xl"
            />
            <ScrollText
              words={BIO_WORDS_2}
              start={0.25}
              end={0.55}
              scrollProgress={scrollYProgress}
              totalWords={totalWords}
              wordOffset={BIO_WORDS_1.length}
              className="text-lg leading-relaxed text-neutral-400 sm:text-xl"
            />

            {/* Interest chips */}
            <motion.div
              variants={{
                hidden: {},
                show: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.3 },
                },
              }}
              initial="hidden"
              animate={inView ? "show" : "hidden"}
              className="flex flex-wrap gap-2 pt-4"
            >
              {tags.map((tag, i) => (
                <motion.span
                  key={tag}
                  variants={{
                    hidden: {
                      opacity: 0,
                      y: 14,
                      x: i % 2 === 0 ? -14 : 14,
                      rotate: i % 2 === 0 ? -4 : 4,
                    },
                    show: {
                      opacity: 1,
                      y: 0,
                      x: 0,
                      rotate: 0,
                      transition: {
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1] as const,
                      },
                    },
                  }}
                  whileHover={{
                    y: -3,
                    borderColor: "rgba(99,102,241,0.4)",
                    color: "rgba(255,255,255,0.9)",
                  }}
                  className="cursor-default rounded-full border border-hairline bg-surface/40 px-4 py-1.5 text-xs text-neutral-400 backdrop-blur"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>

        <motion.div
          variants={fadeUp}
          custom={0.4}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="h-px w-full bg-hairline"
        />
      </div>
    </section>
  );
}

/**
 * Body paragraph whose words brighten word-by-word as the section scrolls
 * through the viewport — like a sentence being read aloud by the scroll.
 */
function ScrollText({
  words,
  start,
  end,
  scrollProgress,
  totalWords,
  wordOffset,
  className,
}: {
  words: string[];
  start: number;
  end: number;
  scrollProgress: import("framer-motion").MotionValue<number>;
  totalWords: number;
  wordOffset: number;
  className: string;
}) {
  return (
    <p className={`text-neutral-700 ${className}`}>
      {words.map((word, i) => {
        const globalIndex = wordOffset + i;
        // Each word lights up in its own narrow window.
        const wordStart = start + ((end - start) * globalIndex) / totalWords;
        const wordEnd = wordStart + (end - start) / totalWords + 0.05;
        return (
          <BrightWord
            key={i}
            scrollProgress={scrollProgress}
            start={wordStart}
            end={wordEnd}
          >
            {word}
          </BrightWord>
        );
      })}
    </p>
  );
}

function BrightWord({
  children,
  scrollProgress,
  start,
  end,
}: {
  children: React.ReactNode;
  scrollProgress: import("framer-motion").MotionValue<number>;
  start: number;
  end: number;
}) {
  const opacity = useTransform(
    scrollProgress,
    [start, end],
    [0.18, 1]
  );
  return (
    <>
      <motion.span style={{ opacity }} className="text-white">
        {children}
      </motion.span>{" "}
    </>
  );
}
