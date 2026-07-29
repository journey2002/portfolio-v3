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
import { RevealLine } from "@/components/ui/Reveal";

const SOCIALS = [
  {
    icon: Github,
    label: "GitHub",
    href: "https://github.com/journey2002",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/worapat-settapak-562192212",
  },
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/pun20202020/",
  },
];

const BANGKOK_TZ = "Asia/Bangkok";

const bangkokTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: BANGKOK_TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const bangkokParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: BANGKOK_TZ,
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
  hourCycle: "h23",
});

function readBangkokHMS(date = new Date()) {
  const bag = Object.fromEntries(
    bangkokParts.formatToParts(date).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return {
    hour: Number(bag.hour),
    minute: Number(bag.minute),
    second: Number(bag.second),
  };
}

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

/* Analog face for the location tile — hairline ring + hands, no glow orb.
   Ticks every second so the minute hand eases with real ICT time. The timer
   only runs while the face is on-screen (and the tab is visible). */
function BangkokFaceClock({ size = 96 }: { size?: number }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hms, setHms] = useState(() => readBangkokHMS());

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let id: number | undefined;
    let onScreen = false;

    const stop = () => {
      if (id !== undefined) {
        window.clearTimeout(id);
        id = undefined;
      }
    };

    const tick = () => {
      setHms(readBangkokHMS());
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 16);
    };

    const start = () => {
      if (id !== undefined || document.hidden || !onScreen) return;
      tick();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = !!entry?.isIntersecting;
        if (onScreen) start();
        else stop();
      },
      { rootMargin: "100px" }
    );
    io.observe(el);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const { hour, minute, second } = hms;
  // 12h face: hour hand sweeps between hours; minute includes seconds.
  const hourAngle = ((hour % 12) + minute / 60 + second / 3600) * 30;
  const minuteAngle = (minute + second / 60) * 6;
  const secondAngle = second * 6;

  const cx = 50;
  const cy = 50;

  return (
    <div
      ref={rootRef}
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full text-ink-strong"
        suppressHydrationWarning
      >
        {/* Face */}
        <circle
          cx={cx}
          cy={cy}
          r="46"
          fill="var(--glass, rgba(255,255,255,0.03))"
          stroke="var(--hairline, rgba(255,255,255,0.12))"
          strokeWidth="1.25"
        />
        {/* Hour ticks. Math.sin/cos may differ in the last bit between the
            server and browser engines, so round the coordinates or hydration
            flags a y1 mismatch on every load. */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          const outer = 40;
          const inner = i % 3 === 0 ? 33 : 36;
          const round = (v: number) => Number(v.toFixed(2));
          return (
            <line
              key={i}
              x1={round(cx + Math.cos(a) * inner)}
              y1={round(cy + Math.sin(a) * inner)}
              x2={round(cx + Math.cos(a) * outer)}
              y2={round(cy + Math.sin(a) * outer)}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? 1.6 : 1}
              strokeOpacity={i % 3 === 0 ? 0.55 : 0.28}
              strokeLinecap="round"
            />
          );
        })}
        {/* Hands carry suppressHydrationWarning (it doesn't cascade from the
            svg): hydration can land a second or two after SSR, so the rotate
            angles legitimately differ. The mount tick re-syncs them. */}
        {/* Hour hand */}
        <line
          suppressHydrationWarning
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 22}
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          transform={`rotate(${hourAngle} ${cx} ${cy})`}
        />
        {/* Minute hand */}
        <line
          suppressHydrationWarning
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 32}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          transform={`rotate(${minuteAngle} ${cx} ${cy})`}
        />
        {/* Second hand — thin accent, no glow */}
        <line
          suppressHydrationWarning
          x1={cx}
          y1={cy + 6}
          x2={cx}
          y2={cy - 36}
          stroke="rgb(var(--accent-1))"
          strokeWidth="1"
          strokeLinecap="round"
          transform={`rotate(${secondAngle} ${cx} ${cy})`}
        />
        {/* Hub */}
        <circle cx={cx} cy={cy} r="2.2" fill="currentColor" />
        <circle cx={cx} cy={cy} r="1" fill="rgb(var(--canvas))" />
      </svg>
    </div>
  );
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
      <SectionLabel index="04" caption="Contact" align="right" />

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

        {/* Heading — the sign-off gets the same marquee-selection reveal as
            every section headline, at its biggest scale. */}
        {/* text-8xl waits for lg: at 768-1023 a 96px "something good." nearly
            filled the content column and wrapped ugly.
            The base tier is fluid rather than a flat text-5xl: "something" is
            one unbreakable 48px word, ~275px wide, and a 320px phone only
            offers 272px of column — so it was being shaved by the footer's
            overflow-hidden. The clamp holds 48px everywhere from ~400px up
            (identical to before) and eases down to 40px on the narrowest
            handsets. */}
        <h2 className="mt-8 font-serif text-[clamp(2.5rem,12vw,3rem)] font-bold leading-[1.02] text-ink-strong sm:text-7xl lg:text-8xl">
          <RevealLine>
            <SplitText text="Let's make" as="span" className="block" />
          </RevealLine>
          <RevealLine delay={0.16}>
            <SplitText
              text="something good."
              as="span"
              className="block"
              charClassName="bg-accent-gradient bg-clip-text text-transparent"
            />
          </RevealLine>
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
              href="mailto:worapat2002@gmail.com"
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
              <span className="underline-wipe">worapat2002@gmail.com</span>
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
            {/* Location tile — live Bangkok clock face (ICT) */}
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
              <BangkokFaceClock size={96} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                  Currently in
                </p>
                <p className="mt-1 font-serif text-lg font-semibold leading-tight text-ink-strong sm:text-xl">
                  Bangkok, Thailand
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-ink-subtle">
                  UTC+7 · ICT · <BangkokClock />
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
                  className="group relative flex aspect-square flex-col justify-between rounded-2xl border border-hairline bg-surface/40 p-4 text-ink-muted backdrop-blur transition-colors duration-300 hover:border-indigo-accent/40 hover:text-ink-strong max-[359px]:p-3 sm:p-5"
                >
                  <social.icon className="h-6 w-6" strokeWidth={1.5} />
                  <div className="flex items-end justify-between">
                    {/* Compact type below sm — a ~100px tile can't carry 10px
                        glyphs at 0.3em tracking ("INSTAGRAM" clipped). Below
                        360px the tile is only ~87px and even 0.14em still
                        clipped it, hence the second step down. */}
                    <span className="text-[9px] uppercase tracking-[0.14em] max-[359px]:tracking-[0.02em] sm:text-[10px] sm:tracking-[0.3em]">
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
          continuous line. viewBox (439×108) matches the text's aspect at font
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
          <p>
            Bangkok · <BangkokClock /> ICT
          </p>
        </div>
      </div>
    </footer>
  );
}
