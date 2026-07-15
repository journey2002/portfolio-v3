"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import NumberFlow from "@number-flow/react";
import { Balancer } from "react-wrap-balancer";
import {
  MapPin,
  Phone,
  Mail,
  Briefcase,
  ArrowUpRight,
  ArrowLeft,
  Calendar,
  Download,
  GraduationCap,
  Sparkles,
  Trophy,
  Globe2,
  Award,
  type LucideIcon,
} from "lucide-react";
import MagneticButton from "@/components/ui/MagneticButton";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";

// The downloadable PDF, served from public/. Drop the real file at
// public/Worapat-Settapak-Resume.pdf — until it exists this link 404s.
// Set to null to hide both download buttons entirely.
const RESUME_PDF: string | null = "/Worapat-Settapak-Resume.pdf";

type TimelineItem = {
  date: string;
  location: string;
  headline: string;
  subhead: string;
  bullets: string[];
};

const EXPERIENCE: TimelineItem[] = [
  {
    date: "June 2023 — May 2024",
    location: "Bangkok, TH",
    headline: "Applicad Public Company Limited",
    subhead: "3D and General Designer",
    bullets: [
      "Created precise 3D models and prototypes, showcasing strong visualisation and design skills for interactive experiences.",
      "Presented design concepts to clients, translating complex ideas into clear, user-friendly visuals.",
      "Optimised 3D printing workflows, highlighting attention to detail and iterative design processes relevant to UX/UI prototyping.",
    ],
  },
];

const EDUCATION: TimelineItem[] = [
  {
    date: "Jul 2020 — Mar 2024",
    location: "Bangkok, TH",
    headline: "Thai-Nichi International College",
    subhead: "Bachelor of Digital Engineering",
    bullets: [
      "Recognised for excellence in UX/UI web design (HTML & CSS) during the Human–Computer Interaction (HCI) program, demonstrating strong front-end and user-centred design skills.",
      "Received awards in a competitive 3D design contest, highlighting creativity, technical expertise, and innovative problem-solving.",
      "Engaged in the international project-based learning program on Solutions for Social Problems and Demands alongside students at the Osaka Institute of Technology.",
    ],
  },
  {
    date: "Mar 2017 — Nov 2019",
    location: "Auckland, NZ",
    headline: "Rosehill College",
    subhead: "High School Diploma · Digital Arts",
    bullets: [
      "Received two excellence awards in Art Design for consistently demonstrating creativity, technical skill, and innovation in design projects.",
    ],
  },
];

const TECHNICAL_SKILLS = [
  "Interaction Design",
  "Design Thinking",
  "Web Design",
  "Wireframing",
  "Prototyping",
  "HTML / CSS",
  "Digital Art",
  "Graphic Design",
  "3D Art (Blender)",
  "Animation",
  "CAD",
  "Agile Methodologies",
];

const SOFT_SKILLS = [
  "Creativity",
  "Attention to Detail",
  "Imagination",
  "Communication",
  "Teamwork",
  "Time Management",
  "Continuous Learning",
  "Fast Learner",
];

const PROFILE = [
  { icon: MapPin, label: "Location", value: "Bangkok, Thailand" },
  {
    icon: Phone,
    label: "Phone",
    value: "092-672-3004",
    href: "tel:+66926723004",
  },
  {
    icon: Mail,
    label: "Email",
    value: "Worapat2002@gmail.com",
    href: "mailto:Worapat2002@gmail.com",
  },
  { icon: Briefcase, label: "Interested in", value: "UX/UI Designer" },
];

// Quick-fire stats — the "by the numbers" strip below the profile bar.
// Half are real, half are tongue-in-cheek so it reads as personality.
type Stat = {
  /** Numeric target for animated counters; omit for non-numeric values. */
  number?: number;
  /** String shown verbatim when `number` is omitted (e.g. "TH·EN", "∞"). */
  value?: string;
  /** Suffix appended after the animated number (e.g. "+" → "04+"). */
  suffix?: string;
  /** Render with 2-digit padding (i.e. "04" not "4"). */
  pad?: boolean;
  label: string;
  note: string;
  highlight?: boolean;
};
const STATS: Stat[] = [
  { number: 4, suffix: "+", pad: true, label: "Years designing", note: "Pixels pushed daily", highlight: true },
  { number: 4, pad: true, label: "Awards won", note: "Art · 3D · HCI" },
  { value: "TH·EN", label: "Languages", note: "Plus a little JP ✱" },
  { value: "∞", label: "Doodles drawn", note: "Mostly mecha cats" },
];

// Achievements pulled directly from the experience + education content —
// makes the wins legible in a glance rather than buried in bullet lists.
type Achievement = {
  icon: LucideIcon;
  title: string;
  description: string;
  year: string;
};
const ACHIEVEMENTS: Achievement[] = [
  {
    icon: Sparkles,
    title: "UX/UI Excellence",
    description:
      "Recognised in TNI's Human–Computer Interaction program for HTML & CSS web design.",
    year: "TNI · 2022",
  },
  {
    icon: Trophy,
    title: "3D Design Contest",
    description:
      "Award winner in a competitive 3D design contest — creativity, technique, and problem-solving.",
    year: "TNI · 2023",
  },
  {
    icon: Globe2,
    title: "Osaka Collaboration",
    description:
      "International project-based learning with students at the Osaka Institute of Technology.",
    year: "TNI × OIT",
  },
  {
    icon: Award,
    title: "Art Design × 2",
    description:
      "Two excellence awards in Art Design — consistent creativity, technical skill, and innovation.",
    year: "Rosehill · 2019",
  },
];

// Playful trait/skill chips for the hero — tilted "stickers" that spring in
// and straighten on hover, echoing the interest chips on the About page.
const HERO_CHIPS = [
  "UX / UI design",
  "digital art",
  "3D · Blender",
  "motion",
  "anime-adjacent",
  "Bangkok ⇄ Auckland",
];

export default function Resume() {
  return (
    <>
      <ResumeHero />
      <ProfileBar />
      <StatsStrip />
      <TimelineSection
        index="01"
        caption="Experience"
        title1="Where I've"
        title2="been working."
        items={EXPERIENCE}
        icon={Briefcase}
        align="left"
      />
      <TimelineSection
        index="02"
        caption="Education"
        title1="Where I"
        title2="studied."
        items={EDUCATION}
        icon={GraduationCap}
        align="right"
      />
      <AchievementsGrid />
      <SkillsSection />
      <ResumeFooter />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero — playful, kinetic intro: a greeting + a headline that moves  */
/* ------------------------------------------------------------------ */
function ResumeHero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="top"
      className="relative overflow-hidden pb-12 pt-32 sm:pt-36 md:pt-40"
    >
      {/* Faint grid lines layered behind content for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
      >
        <div className="grid-lines absolute -inset-16" />
      </div>

      {/* Aurora — soft blur behind the headline. Anchored to a viewport-relative
          offset (top-[42vh]) rather than top-1/2: this hero has no fixed height,
          so it's sized by its content. Centering the glow on the section meant it
          jumped upward a beat after load, when the title/subtitle reflowed (font
          swap, Balancer re-wrap, hydration) and the section shrank. A vh anchor
          is independent of that reflow, so the glow stays put. */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
        className="bg-aurora animate-aurora-shift pointer-events-none absolute left-1/2 top-[42vh] h-[120vh] w-[120vh] -translate-x-1/2 -translate-y-1/2 blur-3xl"
      />

      {/* Accent orbs — indigo + violet, plus a pink pop up top for the
          playful palette. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[18%] top-[24%] h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent-1)/0.22),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[15%] top-[18%] h-[34vh] w-[34vh] translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent-3)/0.20),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[16%] right-[14%] h-[36vh] w-[36vh] translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(var(--accent-2)/0.18),transparent_70%)] blur-2xl"
      />

      {/* Smoothed vignette — 5 stops so the fade-to-dark has no visible edge */}
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--vignette)]" />
      {/* Grain */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      {/* Floating blob decor — soft shapes that drift, for a playful, kinetic
          backdrop. Hidden on small screens; hold still under reduced-motion. */}
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { y: [0, -18, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-[12%] top-[26%] hidden h-16 w-16 rounded-[38%_62%_63%_37%/41%_44%_56%_59%] bg-[linear-gradient(135deg,rgb(var(--accent-2)),rgb(var(--accent-3)))] opacity-30 blur-[2px] lg:block"
      />
      <motion.div
        aria-hidden
        animate={reduce ? undefined : { y: [0, 14, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="pointer-events-none absolute bottom-[20%] left-[7%] hidden h-10 w-10 rounded-[50%_50%_40%_60%/60%_40%_60%_40%] bg-[linear-gradient(135deg,rgb(var(--accent-1)),rgb(var(--accent-2)))] opacity-25 blur-[1px] lg:block"
      />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        {/* Index strip — the dossier's cover line: who, what, where. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] text-ink-faint"
        >
          <span className="whitespace-nowrap text-ink">Worapat Settapak</span>
          <span className="h-px flex-1 bg-hairline" />
          <span className="hidden whitespace-nowrap sm:inline">
            Curriculum vitae
          </span>
          <span className="hidden whitespace-nowrap md:inline">BKK ⇄ AKL</span>
        </motion.div>

        {/* Poster headline — three lines zig-zag across the full container:
            "I make" holds the left, "things that" rides a hairline to the
            right edge, then the huge kinetic "move." sweeps the bottom with
            a hand-inked "open to work" note scrawled in the right margin. */}
        <h1 className="mt-10 font-serif font-bold leading-[0.95] tracking-tight text-ink-strong sm:mt-12">
          <span className="flex items-center gap-5 text-[clamp(2.5rem,7.5vw,6.25rem)] sm:gap-8">
            <SplitText
              text="I make"
              as="span"
              stagger={0.045}
              delay={0.3}
              fromY={90}
            />
            {/* Gradient pill — carries the wave over from the old greeting. */}
            <motion.span
              aria-hidden
              initial={{ opacity: 0, scale: 0, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 170, damping: 13, delay: 0.8 }}
              className="relative hidden h-[0.62em] min-w-[1.8em] items-center justify-center overflow-hidden rounded-full bg-accent-gradient-3 sm:inline-flex"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.25] to-transparent" />
              <motion.span
                animate={reduce ? undefined : { rotate: [0, 18, -6, 18, 0] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  repeatDelay: 1.8,
                  ease: "easeInOut",
                }}
                className="inline-block origin-[70%_80%] text-[0.4em] leading-none"
              >
                👋
              </motion.span>
            </motion.span>
          </span>

          <span className="mt-2 flex items-center gap-5 text-[clamp(2.5rem,7.5vw,6.25rem)] sm:gap-8">
            <motion.span
              aria-hidden
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.85, ease: [0.16, 1, 0.3, 1] as const }}
              className="h-px flex-1 origin-left bg-hairline"
            />
            <SplitText
              text="things that"
              as="span"
              stagger={0.035}
              delay={0.5}
              fromY={90}
              fromRotate={-4}
            />
          </span>

          <span className="mt-2 flex items-center justify-between gap-8 sm:mt-0">
            <motion.span
              initial={{ opacity: 0, y: 90, rotate: -3, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 110, damping: 13, delay: 0.75 }}
              className="block text-[clamp(4.5rem,18vw,14rem)] leading-[0.9]"
            >
              <WigglyWord text="move." />
            </motion.span>
            <HandNote />
          </span>
        </h1>

        {/* Bottom deck — blurb + chips anchored left, CTAs anchored right,
            so the row underneath the poster also uses the full width. */}
        <div className="mt-10 grid grid-cols-12 items-end gap-x-8 gap-y-10 sm:mt-12">
          <div className="col-span-12 md:col-span-7">
            {/* Blurb — casual, personality-forward. */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.95, ease: [0.16, 1, 0.3, 1] as const }}
              className="max-w-xl text-base text-ink-muted sm:text-lg"
            >
              <Balancer>
                A UX/UI designer &amp; digital artist who sweats the 3am details.
                Everything behind the work lives below — every project, award, and
                redraw,{" "}
                <span className="text-ink">made between Bangkok &amp; Auckland</span>.
              </Balancer>
            </motion.p>

            {/* Tilted sticker chips — spring in, straighten on hover. */}
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 1.05 } },
              }}
              className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-3"
            >
              <motion.li
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                className="font-hand text-xl text-ink-subtle"
              >
                into:
              </motion.li>
              {HERO_CHIPS.map((chip, i) => (
                <motion.li
                  key={chip}
                  variants={{
                    hidden: { opacity: 0, y: 16, rotate: i % 2 ? 7 : -7, scale: 0.9 },
                    show: {
                      opacity: 1,
                      y: 0,
                      rotate: i % 2 ? 2 : -2,
                      scale: 1,
                      transition: { type: "spring", stiffness: 220, damping: 12 },
                    },
                  }}
                  whileHover={{ rotate: 0, y: -4, scale: 1.06 }}
                  className="cursor-default rounded-full border border-hairline bg-surface/50 px-4 py-1.5 text-sm text-ink-muted shadow-[0_2px_12px_rgba(0,0,0,0.25)] backdrop-blur transition-colors hover:border-violet-accent/50 hover:text-ink-strong"
                >
                  {chip}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* CTAs — a chunky pink→violet button + a quiet way back. */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="col-span-12 flex flex-wrap items-center gap-x-6 gap-y-4 md:col-span-5 md:justify-end"
          >
            <MagneticButton
              href="mailto:Worapat2002@gmail.com"
              glow
              className="px-7 py-3.5 text-sm font-semibold text-white"
            >
              Let&rsquo;s make something
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2.25}
              />
            </MagneticButton>
            {RESUME_PDF && (
              <a
                href={RESUME_PDF}
                download
                data-cursor-hover
                className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink-strong"
              >
                <Download
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                  strokeWidth={2}
                />
                Download PDF
              </a>
            )}
            <a
              href="/"
              data-cursor-hover
              className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink-strong"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                strokeWidth={2}
              />
              Back to portfolio
            </a>
          </motion.div>
        </div>
      </div>

    </section>
  );
}

/**
 * Kinetic word — each letter keeps bobbing in a staggered wave after it enters,
 * so the hero's punchline literally moves. The gradient runs indigo → violet →
 * pink for a playful colour pop. Honours reduced-motion by holding still, and
 * exposes the plain word to screen readers (the animated glyphs are aria-hidden).
 */
function WigglyWord({ text }: { text: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block whitespace-nowrap">
      {Array.from(text).map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block bg-clip-text text-transparent"
          style={{
            backgroundImage: "var(--accent-gradient-3)",
          }}
          animate={reduce ? undefined : { y: ["0%", "-16%", "0%"] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.14,
          }}
        >
          {ch === " " ? " " : ch}
        </motion.span>
      ))}
      <span className="sr-only">{text}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Hand note — "open to work" scrawled in the margin next to "move."   */
/* ------------------------------------------------------------------ */

/**
 * Hand-inked margin note parked at the right end of the giant "move." —
 * a designer's annotation, not a prop. The Caveat scrawl settles in once
 * the headline lands, then a loose ink arrow draws itself toward the
 * word it's commenting on. Ink rides the accent gradient (same recipe as
 * the About marginalia) so it retints with the accent switcher. Links
 * down to the contact footer like the stamp it replaced.
 */
function HandNote() {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href="#contact"
      aria-label="Open to work — jump to contact"
      data-cursor-hover
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, rotate: -8 }}
      animate={{ opacity: 1, y: 0, rotate: -4 }}
      transition={
        reduce
          ? { duration: 0.5, delay: 1.1 }
          : {
              type: "spring",
              stiffness: 160,
              damping: 15,
              delay: 1.1,
              opacity: { duration: 0.35, delay: 1.1 },
            }
      }
      whileHover={{ rotate: -1, scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className="hidden shrink-0 md:block"
    >
      <span className="block whitespace-nowrap pr-2 text-right font-hand text-3xl leading-none text-[color:var(--accent-soft)] lg:text-4xl">
        open to work
      </span>
      {/* Ink arrow — hooks out from under the note and curves down-left
          toward the period of "move.", drawn stroke-first like the About
          marginalia. Gradient def is local: /resume never mounts About,
          so its #ink-accent isn't in this document. */}
      <svg
        aria-hidden
        viewBox="0 0 150 84"
        fill="none"
        className="mt-1 h-16 w-28 overflow-visible lg:h-[4.5rem] lg:w-32"
      >
        <defs>
          <linearGradient id="note-ink" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="var(--accent-glow-1)" />
            <stop offset="100%" stopColor="var(--accent-glow-2)" />
          </linearGradient>
        </defs>
        <motion.path
          d="M132 8 C 126 36, 100 40, 72 46 C 50 50, 36 54, 22 64"
          stroke="url(#note-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.7,
            ease: "easeInOut",
            delay: 1.35,
            opacity: { duration: 0.01, delay: 1.35 },
          }}
        />
        <motion.path
          d="M39 62 L 22 64 L 30 49"
          stroke="url(#note-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            delay: 2.05,
            opacity: { duration: 0.01, delay: 2.05 },
          }}
        />
      </svg>
    </motion.a>
  );
}

/* ------------------------------------------------------------------ */
/*  Profile bar — 4 quick-facts split between two hairline dividers     */
/* ------------------------------------------------------------------ */
function ProfileBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="h-px w-full bg-hairline" />
        <motion.div
          ref={ref}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          } satisfies Variants}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 sm:grid-cols-4 sm:py-12"
        >
          {PROFILE.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                <span className="text-[10px] uppercase tracking-[0.35em] text-ink-faint">
                  {item.label}
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <Icon
                    className="h-4 w-4 shrink-0 text-indigo-accent"
                    strokeWidth={1.5}
                  />
                  <span className="break-words text-sm leading-snug text-ink sm:text-base">
                    {item.value}
                  </span>
                </div>
              </>
            );
            return (
              <motion.div
                key={item.label}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  },
                } satisfies Variants}
              >
                {item.href ? (
                  <a
                    href={item.href}
                    data-cursor-hover
                    className="group block transition-colors hover:text-ink-strong"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </motion.div>
            );
          })}
        </motion.div>
        <div className="h-px w-full bg-hairline" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats strip — quick "by the numbers" band below the profile bar    */
/* ------------------------------------------------------------------ */
function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        {/* Header hairline + tiny label */}
        <div className="flex items-center gap-3 pt-12 text-[10px] uppercase tracking-[0.4em] text-ink-faint sm:pt-16">
          <span>↳ By the numbers</span>
          <span className="h-px flex-1 bg-hairline" />
          <span>Quick stats</span>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-2 gap-x-6 gap-y-10 pb-12 pt-8 sm:grid-cols-4 sm:pb-16"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24, rotate: i % 2 === 0 ? -2 : 2 }}
              animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
              transition={{
                duration: 0.75,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className="group relative"
            >
              <span className="text-[10px] uppercase tracking-[0.35em] text-ink-faint">
                {stat.label}
              </span>
              {/* Fixed height + centred so every value lands on the same
                  vertical line whether it's a NumberFlow counter (which renders
                  taller, with its digits padded down) or plain text — keeps the
                  values, accent rules, and notes aligned across all columns. */}
              <p className="mt-3 flex h-[1.6em] items-center font-numeral text-[3.25rem] font-bold leading-none tracking-tight text-ink-strong sm:text-[3.75rem]">
                {/* NumberFlow renders its digits in a shadow DOM, which
                    `background-clip: text` can't pierce — a gradient-clipped
                    wrapper leaves the digits transparent/invisible. `color`
                    DOES inherit across the shadow boundary, so the highlight
                    stat uses a solid accent color instead of the gradient. */}
                <span
                  className={stat.highlight ? "text-violet-accent" : ""}
                >
                  {typeof stat.number === "number" ? (
                    <AnimatedStatNumber
                      target={stat.number}
                      inView={inView}
                      delay={i * 0.1 + 0.2}
                      suffix={stat.suffix}
                      pad={stat.pad}
                    />
                  ) : (
                    stat.value
                  )}
                </span>
              </p>
              <div className="mt-4 h-px w-10 origin-left bg-accent-gradient transition-transform duration-500 group-hover:scale-x-[2.5]" />
              <p className="mt-3 text-xs text-ink-subtle">{stat.note}</p>
            </motion.div>
          ))}
        </div>
        <div className="h-px w-full bg-hairline" />
      </div>
    </section>
  );
}

/**
 * Animated counter for the StatsStrip — holds at 0 until the section enters
 * the viewport, then tweens to the target via NumberFlow. Honors reduced
 * motion by snapping straight to the target without animation.
 */
function AnimatedStatNumber({
  target,
  inView,
  delay = 0,
  suffix,
  pad,
}: {
  target: number;
  inView: boolean;
  delay?: number;
  suffix?: string;
  pad?: boolean;
}) {
  const [value, setValue] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReduce(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    }
  }, []);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(target);
      return;
    }
    const id = window.setTimeout(() => setValue(target), delay * 1000);
    return () => clearTimeout(id);
  }, [inView, target, delay, reduce]);

  return (
    <>
      <NumberFlow
        value={value}
        format={pad ? { minimumIntegerDigits: 2 } : undefined}
        transformTiming={{ duration: 1100, easing: "cubic-bezier(0.16,1,0.3,1)" }}
      />
      {suffix}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Achievements grid — small medallions for the resume's wins         */
/* ------------------------------------------------------------------ */
function AchievementsGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section className="relative overflow-hidden py-20 md:py-24">
      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-ink-faint">
          <span className="h-px w-12 bg-hairline" />
          <span className="text-ink">Highlights</span>
          <span>Awards &amp; recognitions</span>
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <div
          ref={ref}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {ACHIEVEMENTS.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.title}
                initial={{
                  opacity: 0,
                  y: 28,
                  rotate: i % 2 === 0 ? -3 : 3,
                }}
                animate={inView ? { opacity: 1, y: 0, rotate: 0 } : undefined}
                transition={{
                  duration: 0.75,
                  delay: i * 0.1,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                whileHover={{ y: -6 }}
                className="group relative flex flex-col gap-3 rounded-xl border border-hairline bg-surface/40 p-5 backdrop-blur transition-colors hover:border-indigo-accent/40"
              >
                {/* Accent wash on hover */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-[rgb(var(--accent-1)/0.15)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <span className="font-numeral text-[9px] uppercase tracking-[0.4em] text-ink-faint">
                  0{i + 1}
                </span>
                <Icon
                  className="h-6 w-6 text-indigo-accent transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                  strokeWidth={1.5}
                />
                <h3 className="font-serif text-base font-semibold leading-tight text-ink-strong">
                  {a.title}
                </h3>
                <p className="text-xs leading-relaxed text-ink-muted">
                  {a.description}
                </p>
                <div className="mt-auto flex items-center gap-2 pt-2 text-[9px] uppercase tracking-[0.3em] text-ink-faint">
                  <span className="h-px w-4 bg-current transition-transform duration-500 group-hover:scale-x-150" />
                  {a.year}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline (Experience / Education)                                  */
/* ------------------------------------------------------------------ */

function TimelineSection({
  index,
  caption,
  title1,
  title2,
  items,
  icon: ItemIcon,
  align,
}: {
  index: string;
  caption: string;
  title1: string;
  title2: string;
  items: TimelineItem[];
  icon: LucideIcon;
  align: "left" | "right";
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-12%" });

  return (
    <section
      id={caption.toLowerCase()}
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <SectionLabel index={index} caption={caption} align={align} />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="grid grid-cols-12 items-end gap-6"
        >
          <div className="col-span-12 sm:col-span-8">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-subtle">
              <span className="text-ink">[{index}]</span> &nbsp;{" "}
              {caption}
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <SplitText
                text={title1}
                as="span"
                className="block"
                immediate={false}
                stagger={0.022}
                fromY={42}
              />
              <SplitText
                text={title2}
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
          </div>
          <div className="col-span-12 hidden text-right text-[10px] uppercase tracking-[0.35em] text-ink-faint sm:col-span-4 sm:block">
            ↳ {items.length.toString().padStart(2, "0")} entr
            {items.length === 1 ? "y" : "ies"}
          </div>
        </motion.div>

        <div ref={ref} className="relative mt-16 flex flex-col gap-14 sm:gap-12">
          {items.map((item, i) => (
            <TimelineEntry
              key={i}
              item={item}
              index={i}
              total={items.length}
              icon={ItemIcon}
              inView={inView}
              delay={i * 0.12}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * A single timeline record, reimagined as an archival "case-file sheet":
 *  • a drawn-in rail + accent node threads every entry onto one timeline
 *  • résumé bullets become numbered "field notes" under a grouping rule
 *  • the sheet rests at a hand-placed tilt and squares up on hover, with a
 *    rotated dashed rubber-stamp of the location for a physical-dossier feel
 */
function TimelineEntry({
  item,
  index,
  total,
  icon: ItemIcon,
  inView,
  delay,
}: {
  item: TimelineItem;
  index: number;
  total: number;
  icon: LucideIcon;
  inView: boolean;
  delay: number;
}) {
  const ease = [0.16, 1, 0.3, 1] as const;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  // Hand-placed lean — alternates per entry, squares up on hover.
  const restTilt = index % 2 === 0 ? -0.7 : 0.7;

  // Beam: a violet gradient that blooms out of the dot and fades into a faint
  // hairline as it travels down — it starts at the dot, spans the sheet, and
  // (for non-last entries) bridges the flex gap to the next dot. Positioning
  // lives on a plain wrapper; only the scaleY reveal runs on the inner motion
  // element (Framer rebuilds `transform`, so a CSS -translate on a motion node
  // would be dropped — that was the old dot/line misalignment).
  const beamGradient =
    "linear-gradient(180deg, rgb(var(--accent-2)) 0%, rgb(var(--accent-2) / 0.5) 20%, var(--hairline) 62%)";
  const beamPos: CSSProperties = {
    top: "0.5rem",
    bottom: isLast ? 0 : "-3.5rem",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 38 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, delay, ease }}
      className="relative pl-8 sm:pl-12"
    >
      {/* Faint upward connector — links the thread down from the previous
          entry into this dot (skipped on the first entry). */}
      {!isFirst && (
        <span
          aria-hidden
          className="absolute left-4 top-0 h-2 w-px -translate-x-1/2 bg-hairline"
        />
      )}
      {/* Timeline beam — wrapper carries the centring (left-4 + -translate-x-1/2);
          inner motion element only reveals via scaleY, growing down from the dot. */}
      <span
        aria-hidden
        className="absolute left-4 w-px -translate-x-1/2"
        style={beamPos}
      >
        <motion.span
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : undefined}
          transition={{ duration: 0.7, delay: delay + 0.1, ease }}
          className="block h-full w-full origin-top"
          style={{ background: beamGradient }}
        />
      </span>
      {/* Connector tick — ties the dot across to the date label */}
      <span
        aria-hidden
        className="absolute left-4 top-2 h-px w-4 -translate-y-1/2 bg-hairline sm:w-8"
      />
      {/* Node — a "waypoint beacon": crisp gradient core, a clean canvas gap,
          a thin orbit ring, and a slow radar ping swelling outward. Wrapper
          carries the centring so every rail element shares the same x; the
          inner motion element only scales in. */}
      <span
        aria-hidden
        className="absolute left-4 top-2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : undefined}
          transition={{ duration: 0.5, delay: delay + 0.25, ease }}
          className="relative block h-4 w-4"
        >
          {/* radar ping — a ring that swells out and fades, like a live beacon */}
          <span className="absolute inset-0 animate-ping rounded-full border border-violet-accent/40 [animation-duration:2.8s]" />
          {/* core — inset behind a canvas-colored gap (first shadow) so the
              orbit ring reads as a separate orbit; second shadow is the glow */}
          <span className="absolute inset-1 rounded-full bg-accent-gradient shadow-[0_0_0_3px_rgb(var(--canvas)),0_0_14px_3px_rgb(var(--accent-2)/0.5)]" />
          {/* orbit ring — painted after the core so the canvas gap never clips it */}
          <span className="absolute inset-0 rounded-full border border-violet-accent/70" />
          {/* white-hot centre */}
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </motion.span>
      </span>

      {/* Date — sits level with the node */}
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
        <Calendar className="h-3.5 w-3.5 text-indigo-accent" strokeWidth={1.5} />
        {item.date}
      </div>

      {/* The sheet */}
      <motion.article
        initial={{ rotate: restTilt }}
        whileHover={{ rotate: 0, y: -5 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
        className="group relative mt-4 overflow-hidden rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur transition-colors hover:border-indigo-accent/30 md:p-9"
      >
        {/* Top sheen */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent"
        />
        {/* Hover wash */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[rgb(var(--accent-1)/0.1)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        {/* Headline + role */}
        <div className="relative flex items-start gap-4">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-hairline bg-glass">
            <ItemIcon
              className="h-5 w-5 text-indigo-accent transition-transform duration-300 group-hover:rotate-6"
              strokeWidth={1.5}
            />
          </span>
          <div className="min-w-0">
            <h3 className="font-serif text-xl font-semibold leading-tight text-ink-strong sm:text-2xl">
              {item.headline}
            </h3>
            <p className="mt-1.5 text-sm text-ink-muted">{item.subhead}</p>
          </div>
        </div>

        {/* Field notes — numbered log lines under a grouping rule */}
        <div className="relative mt-7">
          <div className="mb-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-ink-faint">
            <span className="h-px w-5 bg-accent-gradient" />
            Field notes
          </div>
          <ul className="space-y-3.5 border-l border-hairline pl-5">
            {item.bullets.map((bullet, bi) => (
              <li
                key={bi}
                className="flex gap-3.5 text-sm leading-relaxed text-ink sm:text-[15px]"
              >
                <span className="mt-px shrink-0 font-mono text-[11px] tabular-nums text-indigo-accent/80">
                  {String(bi + 1).padStart(2, "0")}
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer — record id + rotated location stamp */}
        <div className="relative mt-7 flex items-end justify-between gap-4">
          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-faint">
            Record {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <span className="inline-flex -rotate-[7deg] items-center gap-1.5 rounded-md border border-dashed border-indigo-accent/40 px-2.5 py-1 text-[9px] uppercase tracking-[0.25em] text-indigo-accent/90 transition-transform duration-300 group-hover:-rotate-[3deg]">
            <MapPin className="h-3 w-3" strokeWidth={1.5} />
            {item.location}
          </span>
        </div>
      </motion.article>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skills section — split into Technical + Soft skill blocks          */
/* ------------------------------------------------------------------ */
function SkillsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-12%" });
  const gridInView = useInView(gridRef, { once: true, margin: "-12%" });

  return (
    <section
      id="skills"
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <SectionLabel index="03" caption="Skills" align="left" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <motion.div
          ref={headingRef}
          initial={{ opacity: 0, y: 16 }}
          animate={headingInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="grid grid-cols-12 items-end gap-6"
        >
          <div className="col-span-12 sm:col-span-8">
            <p className="text-xs uppercase tracking-[0.25em] text-ink-subtle">
              <span className="text-ink">[03]</span> &nbsp; Skills
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <SplitText
                text="Tools &"
                as="span"
                className="block"
                immediate={false}
                stagger={0.025}
                fromY={42}
              />
              <SplitText
                text="strengths."
                as="span"
                className="block"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                immediate={false}
                stagger={0.03}
                delay={0.15}
                fromY={42}
                fromRotate={-3}
              />
            </h2>
          </div>
          <div className="col-span-12 hidden text-right text-[10px] uppercase tracking-[0.35em] text-ink-faint sm:col-span-4 sm:block">
            ↳ {TECHNICAL_SKILLS.length + SOFT_SKILLS.length} skills · 02
            categories
          </div>
        </motion.div>

        <div
          ref={gridRef}
          className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2"
        >
          <SkillsBlock
            title="Technical"
            subtitle="Tools & disciplines"
            items={TECHNICAL_SKILLS}
            inView={gridInView}
          />
          <SkillsBlock
            title="Soft"
            subtitle="Mindset & approach"
            items={SOFT_SKILLS}
            inView={gridInView}
            delay={0.18}
          />
        </div>
      </div>
    </section>
  );
}

function SkillsBlock({
  title,
  subtitle,
  items,
  inView,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  items: string[];
  inView: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] as const }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur transition-[border-color,box-shadow] duration-300 hover:border-indigo-accent/40 hover:shadow-[0_18px_48px_-28px_rgb(var(--accent-1)/0.45)] sm:p-9"
    >
      {/* Top sheen — thin highlight that fades in along the upper edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      {/* Soft accent wash on hover — static fade-in, no cursor tracking */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[rgb(var(--accent-1)/0.12)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.4em] text-ink-faint">
            {subtitle}
          </span>
          <h3 className="mt-2 font-serif text-2xl font-semibold text-ink-strong">
            {title}
          </h3>
        </div>
        <span className="font-numeral text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          0{items.length}
        </span>
      </div>

      <div className="my-6 h-px w-full bg-hairline" />

      <motion.div
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.04, delayChildren: delay + 0.15 },
          },
        } satisfies Variants}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="flex flex-wrap gap-2"
      >
        {items.map((item, i) => (
          <motion.span
            key={item}
            variants={{
              hidden: { opacity: 0, y: 14, rotate: i % 2 === 0 ? -3 : 3 },
              show: {
                opacity: 1,
                y: 0,
                rotate: 0,
                transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
              },
            } satisfies Variants}
            whileHover={{ y: -2 }}
            className="cursor-default rounded-full border border-hairline bg-glass px-4 py-1.5 text-xs text-ink backdrop-blur transition-colors duration-200 hover:border-indigo-accent/40 hover:text-ink-strong"
          >
            {item}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer CTA — link back to portfolio + email                         */
/* ------------------------------------------------------------------ */
function ResumeFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-8%" });

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-t border-hairline"
    >
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      <div
        ref={ref}
        className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 sm:py-28"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-ink-faint"
        >
          <span className="text-ink">[04]</span>
          <span className="h-px w-12 bg-hairline" />
          <span>Next</span>
        </motion.div>

        <h2 className="mt-8 font-serif text-4xl font-bold leading-[1.05] text-ink-strong sm:text-6xl md:text-7xl">
          <SplitText
            text="Let's work"
            as="span"
            className="block"
            immediate={false}
            stagger={0.03}
            fromY={60}
          />
          <SplitText
            text="together."
            as="span"
            className="block"
            charClassName="bg-accent-gradient bg-clip-text text-transparent"
            immediate={false}
            stagger={0.03}
            delay={0.18}
            fromY={60}
            fromRotate={-3}
          />
        </h2>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start"
        >
          <div className="md:col-span-7">
            <p className="text-[10px] uppercase tracking-[0.35em] text-ink-faint">
              Reach me at
            </p>
            <a
              href="mailto:Worapat2002@gmail.com"
              data-cursor-hover
              className="group mt-3 inline-flex items-baseline gap-3 text-3xl text-ink transition-colors hover:text-ink-strong sm:text-4xl"
            >
              <span className="underline-wipe">Worapat2002@gmail.com</span>
              <ArrowUpRight
                className="h-6 w-6 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </a>
            <a
              href="tel:+66926723004"
              data-cursor-hover
              className="mt-3 flex w-fit items-center gap-2 text-sm text-ink-subtle transition-colors hover:text-ink-strong"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>092-672-3004</span>
            </a>
          </div>

          <div className="hidden md:col-span-5 md:flex md:justify-end md:pr-6">
            <FooterScrawl inView={inView} />
          </div>
        </motion.div>
      </div>

      {/* Footer bar — copyright on the left, utility links on the right */}
      <div className="relative border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-6 py-6 text-sm text-ink-subtle sm:flex-row sm:px-10">
          <p>
            © {new Date().getFullYear()} Worapat Settapak. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {RESUME_PDF && (
              <a
                href={RESUME_PDF}
                download
                data-cursor-hover
                className="group inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-ink-strong"
              >
                <Download
                  className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                  strokeWidth={2}
                />
                Download PDF
              </a>
            )}
            <a
              href="/#work"
              data-cursor-hover
              className="group inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-ink-strong"
            >
              See my work
              <ArrowUpRight
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </a>
            <a
              href="/"
              data-cursor-hover
              className="group inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-ink-strong"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                strokeWidth={2}
              />
              Back to portfolio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Hand-inked scrawl on the right of the contact row — the same marginalia
 * voice as the hero's "open to work" note, so the page closes on the motif
 * it opened with. The ink arrow draws itself down-left toward the email
 * once the footer scrolls into view. Gradient def gets its own id: the
 * hero's #note-ink lives in this same document.
 */
function FooterScrawl({ inView }: { inView: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.a
      href="mailto:Worapat2002@gmail.com"
      aria-label="Say hi — email me"
      data-cursor-hover
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, rotate: 8 }}
      animate={inView ? { opacity: 1, y: 0, rotate: 2 } : undefined}
      transition={
        reduce
          ? { duration: 0.5, delay: 0.45 }
          : {
              type: "spring",
              stiffness: 160,
              damping: 15,
              delay: 0.45,
              opacity: { duration: 0.35, delay: 0.45 },
            }
      }
      whileHover={{ rotate: 0, scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className="block shrink-0"
    >
      <span className="block whitespace-nowrap text-right font-hand text-3xl leading-none text-[color:var(--accent-soft)] lg:text-4xl">
        go on, say hi
      </span>
      <span className="mt-2 block whitespace-nowrap text-right font-hand text-lg leading-none text-ink-subtle lg:text-xl">
        I reply fast — promise
      </span>
      {/* Ink arrow — hooks out from under the scrawl and curves down-left
          toward the email address, drawn stroke-first like the hero note. */}
      <svg
        aria-hidden
        viewBox="0 0 150 84"
        fill="none"
        className="mt-1 h-16 w-28 overflow-visible lg:h-[4.5rem] lg:w-32"
      >
        <defs>
          <linearGradient id="footer-note-ink" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0%" stopColor="var(--accent-glow-1)" />
            <stop offset="100%" stopColor="var(--accent-glow-2)" />
          </linearGradient>
        </defs>
        <motion.path
          d="M132 8 C 126 36, 100 40, 72 46 C 50 50, 36 54, 22 64"
          stroke="url(#footer-note-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{
            duration: 0.7,
            ease: "easeInOut",
            delay: 0.75,
            opacity: { duration: 0.01, delay: 0.75 },
          }}
        />
        <motion.path
          d="M39 62 L 22 64 L 30 49"
          stroke="url(#footer-note-ink)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 1 : 0 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{
            duration: 0.3,
            ease: "easeOut",
            delay: 1.45,
            opacity: { duration: 0.01, delay: 1.45 },
          }}
        />
      </svg>
    </motion.a>
  );
}
