"use client";

import { useRef, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";

// Shared viewport options for whileInView triggers — only fire once, with a
// generous root margin so reveals start before the row reaches centre.
const viewportOpts = { once: true, amount: 0.2 } as const;
import ProjectCard from "@/components/ui/ProjectCard";
import ExpandingProjectRow from "@/components/ui/ExpandingProjectRow";
import LockToggle from "@/components/ui/LockToggle";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";

const PROJECTS = [
  {
    title: "Work & Travel — Montana",
    description:
      "A digital design project highlighting user experience and visual storytelling while showcasing the beauty of the Rocky Mountains, created during a work and travel program in Montana.",
    tags: ["UX Design", "Visual Design", "Figma", "Procreate"],
  },
  {
    title: "Honkai Star Rail: Firefly",
    description:
      "Fan art digital illustration of Firefly from Honkai: Star Rail — exploring character design, light and shadow, and detailed digital painting.",
    tags: ["Digital Art", "Illustration", "Photoshop"],
  },
  {
    title: "E-commerce Website Mockup",
    description:
      "Final project for the Intelligent Human-Computer Interaction course — a fully designed and coded online store applying UX principles, user-centered design, and front-end implementation.",
    tags: ["UX/UI", "HTML / CSS / JS", "Figma"],
  },
  {
    title: "Journey",
    description:
      "A visual storytelling and motion design project exploring emotional narrative through typography, composition, and layered imagery.",
    tags: ["Visual Design", "Motion", "Procreate"],
  },
  {
    title: "Da Donut",
    description:
      "A playful branding and visual identity concept — character design, color theory, and packaging aesthetics combined into a cohesive creative direction.",
    tags: ["Branding", "Illustration", "Figma"],
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

// Reveal animations are declared inline (no variants) so framer-motion
// doesn't propagate "hidden"/"show" labels to nested motion components
// inside ProjectCard / ExpandingProjectRow — variant propagation was
// suppressing those children's own `animate` props (notably flexGrow on
// the expanding-row items).
const cardFromLeftInitial = { opacity: 0, x: -64, y: 24, rotate: -2 };
const cardFromRightInitial = { opacity: 0, x: 64, y: 24, rotate: 2 };
const cardSettled = { opacity: 1, x: 0, y: 0, rotate: 0 };
const cardTransition = { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const };

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const [locked, setLocked] = useState(false);

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
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
              <span className="text-neutral-300">[02]</span> &nbsp; Selected work
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
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
            <LockToggle locked={locked} onToggle={() => setLocked((v) => !v)} />
          </div>
        </motion.div>

        {/* Decorative side-rail removed — it overlapped the wide case-study
            card. Same info still appears in the section footer counter below. */}

        {/* Editorial grid — every card aligns to the same container edges.
            Each row uses inline initial/whileInView (NO variants) so the
            animation triggers as each row scrolls into view, without
            cascading variant labels down to ProjectCard/ExpandingProjectRow's
            own motion children. */}
        <div
          ref={ref}
          className="relative mt-16 flex flex-col gap-10 md:gap-6"
        >
          {/* Row 1: expanding pair — 2 equal-width cards. */}
          <motion.div
            initial={cardFromLeftInitial}
            whileInView={cardSettled}
            viewport={viewportOpts}
            transition={cardTransition}
          >
            <RowLabel index="01 — 02" label="Featured pair" />
            <ExpandingProjectRow
              projects={[PROJECTS[0], PROJECTS[1]]}
              locked={locked}
            />
          </motion.div>

          {/* Row 2: full-width hero card (the case study) */}
          <motion.div
            initial={cardFromRightInitial}
            whileInView={cardSettled}
            viewport={viewportOpts}
            transition={cardTransition}
          >
            <RowLabel index="03" label="Case study" />
            <ProjectCard {...PROJECTS[2]} tall />
          </motion.div>

          {/* Row 3: 2 equal-width cards */}
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-6">
            <motion.div
              initial={cardFromLeftInitial}
              whileInView={cardSettled}
              viewport={viewportOpts}
              transition={cardTransition}
            >
              <RowLabel index="04" label="Visual" />
              <ProjectCard {...PROJECTS[3]} />
            </motion.div>
            <motion.div
              initial={cardFromRightInitial}
              whileInView={cardSettled}
              viewport={viewportOpts}
              transition={cardTransition}
            >
              <RowLabel index="05" label="Branding" />
              <ProjectCard {...PROJECTS[4]} />
            </motion.div>
          </div>
        </div>

        {/* Bottom rail — counter shifts with scroll */}
        <motion.div
          style={{ y: counterY }}
          className="mt-16 flex items-center justify-between text-[10px] uppercase tracking-[0.35em] text-neutral-600"
        >
          <span>↳ End of selected work</span>
          <span>05 / 05</span>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Small ribbon shown above each row: project index + a short category label
 * joined by a hairline. Kept low-contrast so it reads as marginalia rather
 * than competing with the card.
 */
function RowLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-neutral-600">
      <span>{index}</span>
      <span className="h-px w-10 bg-hairline" />
      <span>{label}</span>
    </div>
  );
}
