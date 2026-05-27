"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

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

/** Scroll-progress ring that sits just OUTSIDE the header outline.
    pathLength is normalised to 100 so it traces the real shape (pill or
    circle), and the whole ring fades in with progress (hidden at the top). */
function ProgressRing({
  w,
  h,
  progress,
}: {
  w: number;
  h: number;
  progress: number;
}) {
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
      {/* Faint full track so it reads as a complete ring */}
      <rect {...common} stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
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

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Once expanded by hover it stays open until the next scroll-down,
  // so leaving the header doesn't snap it shut.
  const [userExpanded, setUserExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [lastHovered, setLastHovered] = useState<string | null>(null);

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
    { label: "About", href: isHome ? "#about" : "/#about" },
    { label: "Work", href: isHome ? "#work" : "/#work" },
    { label: "Stack", href: isHome ? "#stack" : "/#stack" },
    { label: "Contact", href: isHome ? "#contact" : "/#contact" },
    { label: "Resume", href: "/resume" },
  ];
  const ctaHref = isHome ? "#contact" : "/#contact";
  const logoHref = isHome ? "#top" : "/";

  // Expanded near the top, while scrolling up, or after a hover (until next scroll-down)
  const isCollapsed = collapsed && !userExpanded;

  useEffect(() => {
    let scheduled = false;
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, y / max) : 0);
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
            ? "bg-[#0c0c0c]/90 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)]"
            : "bg-[#080808]/55 shadow-[0_4px_24px_-10px_rgba(0,0,0,0.5)]"
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
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
        />

        {/* Scroll-progress ring, sitting outside the header */}
        <ProgressRing w={dims.w} h={dims.h} progress={progress} />

        {/* Planet logo — always visible; the only thing left when collapsed */}
        <a
          href={logoHref}
          aria-label="Back to top"
          data-cursor-hover
          className="relative z-10 flex shrink-0 items-center"
        >
          <PlanetLogo />
        </a>

        {/* Collapsible content — links + CTA shrink away on scroll.
            overflow:clip + clip-margin lets the CTA glow bleed out while
            still clipping the content as the width animates to 0. */}
        <motion.div
          animate={{
            width: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
            marginLeft: isCollapsed ? 0 : 36,
          }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as const }}
          style={{ overflow: "clip", overflowClipMargin: "24px" }}
          className="relative z-10 flex items-center"
        >
          {/* Links */}
          <ul
            className="ml-5 hidden items-center gap-0.5 text-sm text-neutral-400 md:flex"
            onMouseLeave={() => setHovered(null)}
          >
            {LINKS.map((link) => (
              <li key={link.href} className="relative">
                <motion.a
                  href={link.href}
                  onMouseEnter={() => {
                    setHovered(link.href);
                    setLastHovered(link.href);
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className={`relative z-10 block whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors duration-200 ${
                    hovered === link.href ? "text-white" : "hover:text-white"
                  }`}
                >
                  {link.label}
                </motion.a>
                {/* Liquid-glass pill — stays mounted at the last-hovered link
                    and fades out smoothly when nothing is hovered. */}
                {(hovered === link.href ||
                  (!hovered && lastHovered === link.href)) && (
                  <motion.span
                    layoutId="nav-pill"
                    initial={false}
                    animate={{ opacity: hovered === link.href ? 1 : 0 }}
                    transition={{
                      opacity: {
                        duration: hovered === link.href ? 0.2 : 0.3,
                        ease: "easeOut",
                      },
                      layout: { type: "spring", stiffness: 320, damping: 34, mass: 0.9 },
                    }}
                    className="absolute inset-0 rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/10 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                  />
                )}
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
      </motion.nav>
    </header>
  );
}
