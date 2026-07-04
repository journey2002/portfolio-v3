"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";

/** Planet mark (planet-svgrepo-com), recoloured to the brand gradient. */
function PlanetLogo() {
  return (
    <motion.svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="block shrink-0"
      whileHover={{ rotate: -12, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
    >
      <defs>
        <linearGradient id="planet-grad" x1="2" y1="4" x2="22" y2="20">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <path
        d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z"
        stroke="url(#planet-grad)"
        strokeWidth="1.6"
      />
      <path
        d="M17.8486 6.19085C19.8605 5.81929 21.3391 5.98001 21.8291 6.76327C22.8403 8.37947 19.2594 12.0342 13.8309 14.9264C8.40242 17.8185 3.18203 18.8529 2.17085 17.2367C1.63758 16.3844 2.38148 14.9651 4 13.3897"
        stroke="url(#planet-grad)"
        strokeWidth="1.6"
      />
    </motion.svg>
  );
}

/** Brand-gradient colour for one glyph: lerps indigo-400 → purple-400 across
    the word so a hovered label lands as a letter-by-letter gradient. */
function glyphColor(i: number, n: number) {
  const t = n <= 1 ? 0 : i / (n - 1);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${mix(129, 192)}, ${mix(140, 132)}, ${mix(248, 252)})`;
}

/** Split-flap nav label: on hover each glyph rolls up while its brand-tinted
    twin rolls in from below, staggered left→right. The two layers cross-FADE
    as they roll so a half-rolled letter is soft rather than a hard clipped
    glyph, and the whole label scales up a touch on hover. Pure CSS
    transitions, so the global reduced-motion rule stills it automatically.
    Needs a `group/link` ancestor to drive the hover. */
function RollingLabel({ text }: { text: string }) {
  const chars = Array.from(text);
  const EASE = "cubic-bezier(0.34,1.3,0.4,1)";
  return (
    <span className="relative block overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.34,1.3,0.4,1)] group-hover/link:scale-[1.07]">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex">
        {chars.map((c, i) => {
          const delay = `${i * 16}ms`;
          return (
            <span
              key={i}
              className="relative inline-block transition-transform duration-[420ms] group-hover/link:-translate-y-full"
              style={{ transitionDelay: delay, transitionTimingFunction: EASE }}
            >
              {/* Outgoing default glyph — fades as it rolls up and out. */}
              <span
                className="inline-block transition-opacity duration-[420ms] group-hover/link:opacity-0"
                style={{ transitionDelay: delay, transitionTimingFunction: EASE }}
              >
                {c}
              </span>
              {/* Incoming brand-tinted twin — fades in as it arrives. */}
              <span
                className="absolute left-0 top-full opacity-0 transition-opacity duration-[420ms] group-hover/link:opacity-100"
                style={{
                  color: glyphColor(i, chars.length),
                  transitionDelay: delay,
                  transitionTimingFunction: EASE,
                }}
              >
                {c}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** Scroll-progress ring that sits just OUTSIDE the header outline.
    pathLength is normalised to 100 so it traces the real shape (pill or
    circle), and the whole ring fades in with progress (hidden at the top). */
function ProgressRing({ w, h }: { w: number; h: number }) {
  // Progress changes on every scroll frame, so it lives HERE rather than in
  // Nav: only this small SVG re-renders at scroll speed instead of the whole
  // header tree (logo, link row, CTA, toggle — all motion components).
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      scheduled = false;
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (w <= 0 || h <= 0) return null;
  const gap = 5; // distance outside the header edge
  const sw = 2.5;
  const W = w + gap * 2;
  const H = h + gap * 2;
  const rx = Math.max(0, (H - sw) / 2);
  const common = {
    x: sw / 2,
    y: sw / 2,
    width: W - sw,
    height: H - sw,
    rx,
    fill: "none" as const,
  };
  const p = Math.max(0, Math.min(100, progress * 100));
  const vis = Math.min(1, progress * 30); // invisible at the very top, fades in fast

  // Soft "comet tail": the leading edge fades out instead of ending in a
  // solid cap. The fade shrinks to zero over the final `snapZone` units so the
  // arc closes solidly onto the start point when complete.
  const snapZone = 9;
  const tail = Math.min(12, p) * Math.min(1, (100 - p) / snapZone);
  const body = p - tail;
  const segs = 6; // overlapping layers — enough for a smooth gradient, far cheaper
  const step = tail / segs;

  return (
    <svg
      width={W}
      height={H}
      aria-hidden
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -gap, top: -gap, opacity: vis, transition: "opacity 0.3s ease" }}
    >
      <defs>
        <linearGradient id="nav-progress" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Faint full track so it reads as a complete ring — themed so it stays
          visible on the warm-white page (a hardcoded white was invisible). */}
      <rect {...common} stroke="var(--hairline)" strokeWidth={sw} />
      {/* Progress arc body (full opacity). drop-shadow filter removed — it
          forced a costly filter pass on every scroll tick. */}
      {body > 0 && (
        <rect
          {...common}
          stroke="url(#nav-progress)"
          strokeWidth={sw}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${body} ${100 - body}`}
        />
      )}
      {/* Fading tail: overlapping layers that each extend to the tip. Stacked
          translucency makes a continuous gradient — opaque near the body,
          faint at the leading edge — with no dotted gaps. */}
      {tail > 0.01 &&
        Array.from({ length: segs }).map((_, i) => {
          // Every layer starts at the body and reaches a progressively shorter
          // end, so coverage is densest at the body (opaque) and thins toward
          // the tip (faint) — a single, continuous fade with no mid gap.
          const len = tail - i * step;
          if (len <= 0) return null;
          return (
            <rect
              key={i}
              {...common}
              stroke="url(#nav-progress)"
              strokeWidth={sw}
              strokeLinecap="butt"
              pathLength={100}
              strokeDasharray={`0 ${body} ${len} ${100}`}
              style={{ opacity: 0.28 }}
            />
          );
        })}
    </svg>
  );
}

/** Mobile hamburger that morphs into an X. The three brand-gradient lines
    rotate and shrink into an X via animated SVG line coordinates, and a soft
    indigo→violet glow fades in behind the button while the menu is open. */
function MenuToggle({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      aria-expanded={open}
      aria-controls="mobile-nav-panel"
      aria-label={open ? "Close menu" : "Open menu"}
      data-cursor-hover
      className="relative z-10 ml-3 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-glass ring-1 ring-inset ring-[var(--ring)] transition-colors hover:bg-glass-strong md:hidden"
    >
      <motion.span
        aria-hidden
        initial={false}
        animate={{ opacity: open ? 0.85 : 0, scale: open ? 1.25 : 0.7 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/45 to-violet-500/45 blur-md"
      />
      <svg width="18" height="18" viewBox="0 0 18 18" className="relative">
        <defs>
          <linearGradient id="menu-grad" x1="0" x2="18" y1="0" y2="18">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#d8b4fe" />
          </linearGradient>
        </defs>
        <motion.line
          initial={false}
          animate={
            open ? { x1: 4, y1: 4, x2: 14, y2: 14 } : { x1: 3, y1: 5, x2: 15, y2: 5 }
          }
          stroke="url(#menu-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.line
          initial={false}
          animate={
            open ? { opacity: 0, x1: 9, x2: 9 } : { opacity: 1, x1: 3, x2: 11 }
          }
          y1="9"
          y2="9"
          stroke="url(#menu-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          transition={{ duration: 0.25 }}
        />
        <motion.line
          initial={false}
          animate={
            open ? { x1: 4, y1: 14, x2: 14, y2: 4 } : { x1: 3, y1: 13, x2: 15, y2: 13 }
          }
          stroke="url(#menu-grad)"
          strokeWidth="1.8"
          strokeLinecap="round"
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    </motion.button>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Once expanded by hover it stays open until the next scroll-down,
  // so leaving the header doesn't snap it shut.
  const [userExpanded, setUserExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Tracks the section currently in view so the mobile menu can mark it.
  const [activeSection, setActiveSection] = useState("");
  // The pill only visibly shrinks at md+ (the link row + CTA are desktop-only).
  const [isDesktop, setIsDesktop] = useState(false);

  const navRef = useRef<HTMLElement | null>(null);
  const lastY = useRef(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  // Hash anchors must be prefixed with `/` when navigating from any page
  // other than the home route, so the browser navigates back to `/` first
  // and then scrolls to the section. Lenis only intercepts plain `#`
  // anchors, so this preserves smooth scroll on home while keeping
  // cross-page navigation functional from /resume.
  const pathname = usePathname();
  const isHome = pathname === "/" || !pathname;
  const LINKS = [
    { label: "About", id: "about", href: isHome ? "#about" : "/#about" },
    { label: "Work", id: "work", href: isHome ? "#work" : "/#work" },
    { label: "Stack", id: "stack", href: isHome ? "#stack" : "/#stack" },
    { label: "Contact", id: "contact", href: isHome ? "#contact" : "/#contact" },
    { label: "Resume", id: "resume", href: "/resume" },
  ];
  const ctaHref = isHome ? "#contact" : "/#contact";
  const logoHref = isHome ? "#top" : "/";

  // Expanded near the top, while scrolling up, or after a hover (until next scroll-down)
  const isCollapsed = collapsed && !userExpanded;
  // On desktop the shrunk pill drops to just the logo, so the theme toggle
  // collapses with it. On mobile it stays — the slide-out menu has no toggle,
  // so this is the only way to switch themes there.
  const hideToggle = isDesktop && isCollapsed;

  // Close mobile menu when the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Scroll-spy: track which section sits in the middle band of the viewport so
  // the mobile menu can show a "you are here" highlight. Sections are
  // server-rendered (dynamic() keeps SSR on), so they exist on mount. Off the
  // home route there are no sections — flag the current page instead.
  useEffect(() => {
    if (!isHome) {
      setActiveSection("resume");
      return;
    }
    const order = ["about", "work", "stack", "contact"];
    const els = order
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!els.length) return;
    // Track which sections currently cross the viewport's centre band. The thin
    // ±48% margin means usually exactly one qualifies; the first in document
    // order wins, and nothing is flagged above the first / below the last.
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        setActiveSection(order.find((id) => visible.has(id)) ?? "");
      },
      { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [isHome]);

  // Close mobile menu on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      const y = window.scrollY;
      // These setters fire every frame but the values are booleans that
      // rarely flip, so React bails out without re-rendering.
      setScrolled(y > 24);
      if (y < 120) {
        setCollapsed(false);
      } else if (y > lastY.current + 4) {
        setCollapsed(true);
        setUserExpanded(false);
      } else if (y < lastY.current - 4) {
        setCollapsed(false);
      }
      lastY.current = y;
      scheduled = false;
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track the md breakpoint so the toggle only collapses where the pill does.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Measure the header so the progress ring traces its real (changing) shape
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
        <motion.nav
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ref={navRef as any}
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
          onMouseEnter={() => setUserExpanded(true)}
          className={`group/nav pointer-events-auto relative flex h-14 items-center rounded-full px-3.5 backdrop-blur-xl transition-[background,box-shadow] duration-300 ${
            scrolled
              ? "bg-panel-strong shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]"
              : "bg-panel shadow-[0_4px_24px_-10px_rgba(0,0,0,0.5)]"
          }`}
        >
          {/* Top-lit gradient hairline border */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full opacity-80 transition-opacity duration-300 group-hover/nav:opacity-100"
            style={{
              padding: 1,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.06) 45%, rgba(99,102,241,0.14) 100%)",
              WebkitMask:
                "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          {/* Soft sheen line across the top edge */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent"
          />

          {/* Scroll-progress ring, sitting outside the header */}
          <ProgressRing w={dims.w} h={dims.h} />

          {/* Planet logo + mobile wordmark. The wordmark gives the collapsed
              mobile pill a real identity instead of two lone icons; it's hidden
              on desktop where the full link row takes over. */}
          <a
            href={logoHref}
            aria-label="Back to top"
            data-cursor-hover
            className="relative z-10 flex shrink-0 items-center gap-2.5"
          >
            <PlanetLogo />
            <span className="flex flex-col leading-none md:hidden">
              <span className="font-serif text-sm font-semibold leading-none tracking-tight text-ink-strong">
                Worapat
              </span>
              <span className="mt-1 text-[8.5px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
                UX/UI · Digital Art
              </span>
            </span>
          </a>

          {/* Collapsible content — desktop only. Links + CTA shrink away on
              scroll. overflow:clip + clip-margin lets the CTA glow bleed out
              while still clipping the content as the width animates to 0. */}
          <motion.div
            animate={{
              width: isCollapsed ? 0 : "auto",
              opacity: isCollapsed ? 0 : 1,
              marginLeft: isCollapsed ? 0 : 36,
            }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }}
            style={{ overflow: "clip", overflowClipMargin: "24px" }}
            className="relative z-10 hidden items-center md:flex"
          >
            {/* Links — split-flap hover: glyphs roll up into brand-gradient
                twins (see RollingLabel). */}
            <ul className="ml-5 hidden items-center gap-0.5 text-sm text-ink-muted md:flex">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <motion.a
                    href={link.href}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="group/link relative z-10 block whitespace-nowrap rounded-full px-3.5 py-1.5"
                  >
                    <RollingLabel text={link.label} />
                  </motion.a>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <motion.a
              href={ctaHref}
              data-cursor-hover
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="group relative ml-5 shrink-0 overflow-hidden whitespace-nowrap rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_18px_-4px_rgba(99,102,241,0.7)] transition-colors duration-300 hover:bg-violet-500"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">Let&apos;s talk</span>
            </motion.a>
          </motion.div>

          {/* Theme switch — sits at the right end of the pill. On desktop it
              collapses away with the rest when the pill shrinks; on mobile it
              stays put (always visible). overflow:clip lets the hover glow bleed
              past the edge while the width animates to 0. */}
          <motion.div
            animate={{
              width: hideToggle ? 0 : "auto",
              opacity: hideToggle ? 0 : 1,
              marginLeft: hideToggle ? 0 : 12,
            }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }}
            style={{ overflow: "clip", overflowClipMargin: "24px" }}
            className="relative z-10 flex shrink-0 items-center"
          >
            <ThemeToggle />
          </motion.div>

          {/* Hairline divider between the brand and the toggle (mobile only) */}
          <span aria-hidden className="ml-3 h-5 w-px bg-[var(--ring)] md:hidden" />

          {/* Mobile menu toggle */}
          <MenuToggle open={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
        </motion.nav>
      </header>

      {/* Mobile dropdown — an editorial command sheet that unfolds from the
          toggle: numbered links in the brand serif, a live scroll-spy "you are
          here" highlight, drifting aurora, and a CTA + signature footer so the
          panel reads as finished rather than a bare list. */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Dim + blur backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            />

            {/* Glass panel */}
            <motion.div
              id="mobile-nav-panel"
              key="mobile-panel"
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: -12,
                scale: 0.96,
                transition: { duration: 0.2, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 340, damping: 32, mass: 0.8 }}
              style={{ transformOrigin: "top right" }}
              className="fixed inset-x-4 top-[5.25rem] z-50 overflow-hidden rounded-[26px] bg-panel-strong shadow-[0_28px_70px_-14px_rgba(0,0,0,0.75)] backdrop-blur-2xl md:hidden"
            >
              {/* Gradient hairline border */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[26px]"
                style={{
                  padding: 1,
                  background:
                    "linear-gradient(160deg, rgba(129,140,248,0.5) 0%, rgba(255,255,255,0.06) 38%, rgba(192,132,252,0.3) 100%)",
                  WebkitMask:
                    "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              {/* Top sheen */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent"
              />
              {/* Drifting aurora glows — CSS keyframes, so they auto-still under
                  prefers-reduced-motion via the global media query. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <span className="animate-drift-x absolute -top-28 left-8 h-52 w-52 rounded-full bg-indigo-500/25 blur-3xl" />
                <span className="animate-float-card absolute -bottom-24 -right-10 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
              </div>

              {/* Content */}
              <div className="relative p-3">
                {/* Panel header — frames the menu as the site's index and
                    surfaces the live availability signal. */}
                <div className="mb-1 flex items-center justify-between px-2.5 pt-1">
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink-subtle">
                    Index
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.28em] text-ink-subtle">
                    <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-accent-gradient" />
                    Open to work
                  </span>
                </div>
                <span
                  aria-hidden
                  className="mx-2.5 mb-1 block h-px bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent"
                />

                {/* Links */}
                <ul className="flex flex-col">
                  {LINKS.map((link, i) => {
                    const active = activeSection === link.id;
                    return (
                      <motion.li
                        key={link.href}
                        initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{
                          opacity: 0,
                          y: 8,
                          filter: "blur(3px)",
                          transition: { duration: 0.12 },
                        }}
                        transition={{
                          delay: 0.07 + i * 0.06,
                          duration: 0.5,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <a
                          href={link.href}
                          onClick={() => setMenuOpen(false)}
                          aria-current={active ? "true" : undefined}
                          className={`group/item relative flex items-center gap-4 overflow-hidden rounded-2xl px-3 py-3 transition-colors duration-300 ${
                            active
                              ? "text-ink-strong"
                              : "text-ink hover:text-ink-strong"
                          }`}
                        >
                          {/* Hover / active fill sweep */}
                          <span
                            aria-hidden
                            className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-glass-strong via-glass to-transparent transition-opacity duration-300 ${
                              active
                                ? "opacity-100"
                                : "opacity-0 group-hover/item:opacity-100"
                            }`}
                          />
                          {/* Active marker bar */}
                          <span
                            aria-hidden
                            className={`pointer-events-none absolute left-0 top-1/2 h-7 -translate-y-1/2 rounded-full bg-gradient-to-b from-indigo-400 to-violet-400 transition-all duration-300 ${
                              active ? "w-[3px] opacity-100" : "w-0 opacity-0"
                            }`}
                          />
                          {/* Index number — echoes the hero's "01" numbering */}
                          <span
                            className={`relative w-5 shrink-0 text-[10px] font-medium tabular-nums tracking-[0.15em] transition-colors duration-300 ${
                              active
                                ? "text-indigo-300"
                                : "text-ink-faint group-hover/item:text-indigo-300"
                            }`}
                          >
                            0{i + 1}
                          </span>
                          {/* Label */}
                          <span className="relative font-serif text-lg tracking-tight">
                            {link.label}
                          </span>
                          {/* Arrow */}
                          <span
                            aria-hidden
                            className={`relative ml-auto text-base transition-all duration-300 ${
                              active
                                ? "translate-x-0.5 text-ink-strong"
                                : "text-ink-faint group-hover/item:translate-x-0.5 group-hover/item:text-ink-strong"
                            }`}
                          >
                            →
                          </span>
                        </a>
                      </motion.li>
                    );
                  })}
                </ul>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6, transition: { duration: 0.12 } }}
                  transition={{
                    delay: 0.07 + LINKS.length * 0.06,
                    duration: 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="mt-2.5 px-1"
                >
                  <a
                    href={ctaHref}
                    onClick={() => setMenuOpen(false)}
                    data-cursor-hover
                    className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_12px_34px_-10px_rgba(99,102,241,0.8)] transition-colors hover:bg-violet-500"
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[var(--sheen)] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative">Let&apos;s talk</span>
                    <span className="relative transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                  </a>
                </motion.div>

                {/* Signature footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  transition={{ delay: 0.14 + LINKS.length * 0.06, duration: 0.5 }}
                  className="mt-3 flex items-center justify-between border-t border-[var(--ring)] px-2.5 pb-1 pt-3 text-[9.5px] font-medium uppercase tracking-[0.25em] text-ink-faint"
                >
                  <span>Worapat Settapak</span>
                  <span>Bangkok · 2026</span>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

