"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, type Variants } from "framer-motion";
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
  GraduationCap,
  Sparkles,
  Trophy,
  Globe2,
  Award,
  type LucideIcon,
} from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";

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
    href: "tel:0926723004",
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

// Marquee strip in the footer — light personality phrases that match the home page tone.
const FOOTER_MARQUEE = [
  "Bangkok, Thailand",
  "UX/UI · Digital Art",
  "Class of '24",
  "Always sketching",
  "Anime-adjacent",
  "Available for work",
];

// Contents index for the hero's right column. Each row is a real `#` anchor;
// LenisProvider intercepts the click and smooth-scrolls to the section below.
type IndexEntry = {
  num: string;
  label: string;
  href: string;
  note: string;
};
const RESUME_INDEX: IndexEntry[] = [
  {
    num: "01",
    label: "Experience",
    href: "#experience",
    note: "Applicad · 2023–24",
  },
  {
    num: "02",
    label: "Education",
    href: "#education",
    note: "TNI · Rosehill College",
  },
  {
    num: "03",
    label: "Skills",
    href: "#skills",
    note: "20 skills · 2 categories",
  },
  {
    num: "04",
    label: "Contact",
    href: "#contact",
    note: "Let’s work together",
  },
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
/*  Hero — dossier cover: title + a navigable contents index          */
/* ------------------------------------------------------------------ */
function ResumeHero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pb-12 pt-40 sm:pt-44 md:pt-48"
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

      {/* Secondary accent orbs — opposite corners, softer */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[18%] top-[24%] h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[16%] right-[14%] h-[36vh] w-[36vh] translate-x-1/2 translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(168,85,247,0.18),transparent_70%)] blur-2xl"
      />

      {/* Smoothed vignette — 5 stops so the fade-to-dark has no visible edge */}
      <div className="pointer-events-none absolute inset-0 bg-[image:var(--vignette)]" />
      {/* Grain */}
      <div
        aria-hidden
        className="noise-overlay pointer-events-none absolute inset-0"
      />

      {/* Side vertical rules — match the hero on /  */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-6 hidden flex-col items-center justify-between py-32 sm:flex sm:left-10"
      >
        <span className="text-[10px] uppercase tracking-[0.35em] text-ink-faint [writing-mode:vertical-rl]">
          Curriculum vitae · 2026
        </span>
        <span className="text-[10px] uppercase tracking-[0.35em] text-ink-faint [writing-mode:vertical-rl]">
          Worapat Settapak
        </span>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        {/* Badge row */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            ease: [0.16, 1, 0.3, 1] as const,
            delay: 0.3,
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-glass px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-ink-muted backdrop-blur">
            <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent-gradient" />
            Curriculum vitae · 2026
          </span>
          <span className="hidden h-px w-12 bg-hairline sm:block" />
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-ink-faint sm:block">
            Worapat Settapak
          </span>
        </motion.div>

        {/* Two columns — dossier cover: title block + navigable contents */}
        <div className="mt-10 grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-10">
          {/* Left — title, blurb, CTAs */}
          <div className="lg:col-span-7">
            <h1 className="font-serif font-bold leading-[0.94] tracking-tight text-ink-strong">
              <SplitText
                text="The full"
                as="span"
                className="block text-[clamp(3rem,8.5vw,6.75rem)]"
                delay={0.4}
                stagger={0.045}
                fromY={100}
                fromRotate={5}
              />
              <SplitText
                text="file."
                as="span"
                className="block pb-2 text-[clamp(3rem,8.5vw,6.75rem)]"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                delay={0.7}
                stagger={0.04}
                fromY={100}
                fromRotate={-4}
              />
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                delay: 1.2,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className="mt-8 max-w-xl"
            >
              <p className="text-base text-ink-muted sm:text-lg">
                <Balancer>
                  Everything behind my work — experience, education, and the
                  tools I use —{" "}
                  <span className="text-ink">
                    built between Bangkok and Auckland
                  </span>{" "}
                  over the last few years.
                </Balancer>
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href="mailto:Worapat2002@gmail.com"
                  data-cursor-hover
                  className="group relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(168,85,247,0.95))] px-6 py-3 text-sm font-medium text-white shadow-[0_8px_24px_-10px_rgba(139,92,246,0.45)] transition-[box-shadow,filter] duration-300 hover:brightness-110 hover:shadow-[0_14px_40px_-10px_rgba(139,92,246,0.55)]"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-gradient-to-b from-white/[0.18] to-transparent" />
                  Get in touch
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </a>
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
              </div>
            </motion.div>
          </div>

          {/* Right — navigable contents index */}
          <ContentsIndex />
        </div>
      </div>

    </section>
  );
}

/**
 * Hero contents index — the right column of the dossier cover. Each row is a
 * real `#` anchor; LenisProvider intercepts the click and smooth-scrolls to the
 * matching section below (with an offset for the floating nav). Rows stagger in
 * after the headline finishes its reveal.
 */
function ContentsIndex() {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <motion.nav
      aria-label="Resume contents"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09, delayChildren: 1.15 } },
      }}
      className="lg:col-span-5 lg:border-l lg:border-hairline lg:pl-10"
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 14 },
          show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
        }}
        className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-ink-faint"
      >
        <span className="text-ink">Contents</span>
        <span className="h-px flex-1 bg-hairline" />
        <span>Jump to</span>
      </motion.div>

      <ul className="mt-2 border-b border-hairline">
        {RESUME_INDEX.map((item) => (
          <motion.li
            key={item.href}
            variants={{
              hidden: { opacity: 0, y: 18 },
              show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
            }}
          >
            <a
              href={item.href}
              data-cursor-hover
              className="group relative isolate flex items-center gap-5 border-t border-hairline py-5 transition-colors"
            >
              {/* Accent wash on hover — a soft rounded glow inset from the row
                  dividers and bled out past the number/arrow so nothing sits
                  flush against its edge. */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-1.5 -inset-x-4 -z-10 rounded-xl bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <span className="font-serif text-sm tabular-nums text-indigo-accent/80 transition-colors group-hover:text-indigo-accent">
                {item.num}
              </span>
              <span className="flex-1">
                <span className="block font-serif text-xl font-semibold leading-tight text-ink transition-colors group-hover:text-ink-strong sm:text-2xl">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs text-ink-faint transition-colors group-hover:text-ink-muted">
                  {item.note}
                </span>
              </span>
              <ArrowUpRight
                className="h-5 w-5 shrink-0 text-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-accent"
                strokeWidth={1.75}
              />
            </a>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
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
              {/* min-h pins every value box to the same height regardless of
                  whether it holds a NumberFlow counter (which renders taller
                  than plain text) so the accent rule + note below stay aligned
                  across all four columns. */}
              <p className="mt-3 min-h-[1.55em] font-serif text-[3.25rem] font-bold leading-none tracking-tight text-ink-strong sm:text-[3.75rem]">
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
                  className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                <span className="text-[9px] uppercase tracking-[0.4em] text-ink-faint">
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

        <div ref={ref} className="mt-16 flex flex-col gap-6">
          {items.map((item, i) => (
            <motion.article
              key={i}
              initial={{
                opacity: 0,
                y: 32,
                x: i % 2 === 0 ? -24 : 24,
                rotate: i % 2 === 0 ? -1.5 : 1.5,
              }}
              animate={
                inView ? { opacity: 1, y: 0, x: 0, rotate: 0 } : undefined
              }
              transition={{
                duration: 0.85,
                delay: i * 0.12,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              whileHover={{ y: -4 }}
              className="group relative grid grid-cols-1 gap-6 rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur transition-colors hover:border-indigo-accent/30 md:grid-cols-12 md:gap-10 md:p-10"
            >
              {/* Decorative corner ticks */}
              <span
                aria-hidden
                className="absolute left-3 top-3 h-3 w-3 border-l border-t border-indigo-accent/40 transition-colors group-hover:border-indigo-accent/80"
              />
              <span
                aria-hidden
                className="absolute right-3 top-3 h-3 w-3 border-r border-t border-indigo-accent/40 transition-colors group-hover:border-indigo-accent/80"
              />
              <span
                aria-hidden
                className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-indigo-accent/40 transition-colors group-hover:border-indigo-accent/80"
              />
              <span
                aria-hidden
                className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-indigo-accent/40 transition-colors group-hover:border-indigo-accent/80"
              />

              {/* Index stamp */}
              <span
                aria-hidden
                className="absolute right-6 top-6 text-[9px] uppercase tracking-[0.35em] text-ink-faint md:right-10 md:top-10"
              >
                0{i + 1} / 0{items.length}
              </span>

              {/* Date column */}
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                  <Calendar
                    className="h-3.5 w-3.5 text-indigo-accent"
                    strokeWidth={1.5}
                  />
                  {item.date}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-ink-faint">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {item.location}
                </div>
                <div className="mt-6 h-px w-14 bg-accent-gradient" />
              </div>

              {/* Content column */}
              <div className="md:col-span-8">
                <div className="flex items-start gap-3">
                  <ItemIcon
                    className="mt-1 h-5 w-5 shrink-0 text-indigo-accent transition-transform duration-300 group-hover:rotate-3"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="font-serif text-xl font-semibold leading-tight text-ink-strong sm:text-2xl">
                      {item.headline}
                    </h3>
                    <p className="mt-1.5 text-sm text-ink-muted">
                      {item.subhead}
                    </p>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {item.bullets.map((bullet, bi) => (
                    <li
                      key={bi}
                      className="flex items-start gap-3 text-sm leading-relaxed text-ink sm:text-[15px]"
                    >
                      <span
                        aria-hidden
                        className="mt-[0.55rem] inline-block h-1 w-1 shrink-0 rotate-45 bg-accent-gradient"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
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
      className="group relative overflow-hidden rounded-2xl border border-hairline bg-surface/40 p-7 backdrop-blur transition-colors hover:border-indigo-accent/30 sm:p-9"
    >
      {/* Soft accent wash on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
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
        <span className="text-[10px] uppercase tracking-[0.3em] text-ink-faint">
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
            whileHover={{ y: -3 }}
            className="cursor-default rounded-full border border-hairline bg-glass px-4 py-1.5 text-xs text-ink backdrop-blur transition-colors hover:border-indigo-accent/40 hover:text-ink-strong"
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
        className="bg-aurora pointer-events-none absolute -top-1/3 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 opacity-25 blur-3xl"
      />
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
          className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end"
        >
          <div className="md:col-span-7">
            <p className="text-[10px] uppercase tracking-[0.35em] text-ink-faint">
              Reach me at
            </p>
            <a
              href="mailto:Worapat2002@gmail.com"
              data-cursor-hover
              className="group mt-3 inline-flex items-baseline gap-3 text-2xl text-ink transition-colors hover:text-ink-strong sm:text-3xl"
            >
              <span className="underline-wipe">Worapat2002@gmail.com</span>
              <ArrowUpRight
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </a>
            <div className="mt-3 flex items-center gap-2 text-sm text-ink-subtle">
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>092-672-3004</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 md:col-span-5 md:justify-end">
            <a
              href="/#work"
              data-cursor-hover
              className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink-strong"
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
              className="group inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink-strong"
            >
              <ArrowLeft
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5"
                strokeWidth={2}
              />
              Back to portfolio
            </a>
          </div>
        </motion.div>
      </div>

      {/* Personality marquee — light-touch ticker before the copyright bar */}
      <div className="group relative overflow-hidden border-t border-hairline bg-panel-weak backdrop-blur">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-night via-night/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-night via-night/80 to-transparent" />
        <div className="relative flex py-3">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10 group-hover:[animation-play-state:paused]">
            {FOOTER_MARQUEE.concat(FOOTER_MARQUEE).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="flex shrink-0 items-center gap-10 text-[11px] uppercase tracking-[0.35em] text-ink-subtle"
              >
                {tag}
                <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
              </span>
            ))}
          </div>
          <div
            aria-hidden
            className="animate-marquee flex shrink-0 items-center gap-10 pr-10 group-hover:[animation-play-state:paused]"
          >
            {FOOTER_MARQUEE.concat(FOOTER_MARQUEE).map((tag, i) => (
              <span
                key={`dup-${tag}-${i}`}
                className="flex shrink-0 items-center gap-10 text-[11px] uppercase tracking-[0.35em] text-ink-subtle"
              >
                {tag}
                <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
              </span>
            ))}
          </div>
        </div>
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
            Available for freelance
          </p>
        </div>
      </div>
    </section>
  );
}
