"use client";

import { useRef } from "react";
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

const SOCIALS = [
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://linkedin.com",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://instagram.com",
  },
];

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

      {/* Aurora. No scroll-driven scale here: the aurora-shift CSS animation
          owns `transform` (keyframes beat inline styles in the cascade), so a
          framer scale on this element never rendered — only cost a style
          write per scroll frame. */}
      <div
        aria-hidden
        className="bg-aurora animate-aurora-shift pointer-events-none absolute -top-1/2 left-1/2 h-[90vh] w-[90vh] -translate-x-1/2 opacity-25 blur-3xl"
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
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-neutral-600"
        >
          <span className="text-neutral-300">[04]</span>
          <span className="h-px w-12 bg-hairline" />
          <span>Get in touch</span>
        </motion.div>

        {/* Heading */}
        <h2 className="mt-8 font-serif text-5xl font-bold leading-[1.02] text-white sm:text-7xl md:text-8xl">
          <SplitText
            text="Let's create"
            as="span"
            className="block"
            immediate={false}
            stagger={0.03}
            fromY={70}
          />
          <SplitText
            text="something amazing."
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

        {/* Two-column layout — email/phone left, social tile grid right */}
        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-xs uppercase tracking-[0.35em] text-neutral-600"
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
              className="group mt-3 inline-flex items-baseline gap-3 text-2xl text-neutral-300 transition-colors duration-200 hover:text-white sm:text-3xl"
            >
              <span className="underline-wipe">Worapat2002@gmail.com</span>
              <ArrowUpRight
                className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={2}
              />
            </motion.a>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.4,
              }}
              className="mt-4 flex items-center gap-2 text-sm text-neutral-500"
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>092-672-3004</span>
            </motion.div>
          </div>

          {/* Right column: location + social tiles */}
          <div className="flex flex-col gap-3 md:col-span-5">
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
                <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
                  Currently in
                </p>
                <p className="mt-1 font-serif text-lg font-semibold leading-tight text-white sm:text-xl">
                  Bangkok, Thailand
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
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
                  className="group relative flex aspect-square flex-col justify-between rounded-2xl border border-hairline bg-surface/40 p-5 text-neutral-400 backdrop-blur transition-colors duration-300 hover:border-indigo-accent/40 hover:text-white"
                >
                  <social.icon className="h-6 w-6" strokeWidth={1.5} />
                  <div className="flex items-end justify-between">
                    <span className="text-[10px] uppercase tracking-[0.3em]">
                      {social.label}
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.5}
                    />
                  </div>
                </motion.a>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Giant horizontal wordmark — parallax sweeps across the bottom */}
      <div className="pointer-events-none relative -mt-10 overflow-hidden pb-10 sm:-mt-20 sm:pb-16">
        <motion.div
          style={{ x: wordmarkX }}
          aria-hidden
          className="select-none whitespace-nowrap font-serif text-[28vw] font-bold leading-[0.85] tracking-tight"
        >
          <span
            style={{
              WebkitTextStroke: "1px rgba(255,255,255,0.08)",
              color: "transparent",
            }}
          >
            WORAPAT&nbsp;·&nbsp;SETTAPAK&nbsp;·&nbsp;
          </span>
        </motion.div>
      </div>

      {/* Footer bar */}
      <div className="relative border-t border-hairline">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-neutral-500 sm:flex-row sm:px-10">
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
    </footer>
  );
}
