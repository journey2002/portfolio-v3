"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Menu, X } from "lucide-react";

export type SectionLink = { label: string; href: string };

const HOME_SECTIONS: SectionLink[] = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Stack", href: "#stack" },
  { label: "Contact", href: "#contact" },
];

/**
 * The resume's own stops. Every one of these anchors already existed in the
 * markup — ResumeHero's #top, the two TimelineSections (#experience /
 * #education), SkillsSection and ResumeFooter — but nothing ever linked to
 * them, and the page had no way back up short of scrolling its full length.
 */
export const RESUME_SECTIONS: SectionLink[] = [
  { label: "Experience", href: "#experience" },
  { label: "Education", href: "#education" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

export default function SectionMenu({
  sections = HOME_SECTIONS,
}: {
  sections?: SectionLink[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Detect touch / coarse-pointer devices once on mount — they don't fire
  // mouseenter/mouseleave, so the desktop hover behavior would leave the
  // menu unreachable. On those devices we rely on tap/click + outside-tap
  // to close. On fine-pointer devices we keep the hover-to-open behavior.
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: none), (pointer: coarse)");
    setIsTouch(mq.matches);
  }, []);

  // Close on outside tap when in touch mode
  useEffect(() => {
    if (!isTouch || !open) return;
    const handler = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [isTouch, open]);

  // Close after navigating to a section (any link click)
  const handleLinkClick = () => setOpen(false);

  const hoverHandlers = isTouch
    ? {}
    : {
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
      };

  return (
    <div
      ref={containerRef}
      // Safe-area offsets keep the cluster clear of the iOS home indicator /
      // landscape notch; env() is 0 elsewhere so this stays bottom-6 right-6.
      className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-[max(1.5rem,env(safe-area-inset-right))] z-40 flex flex-col items-end"
      {...hoverHandlers}
    >
      <ul
        aria-hidden={!open}
        className={`mb-3 flex flex-col items-end gap-2 ${open ? "" : "pointer-events-none"}`}
      >
        {sections.map((section, i) => {
          // Bottom-up reveal: items closest to the button animate first on open,
          // first to leave on close.
          const total = sections.length;
          const delay = open ? (total - 1 - i) * 55 : i * 30;
          return (
            <li
              key={section.href}
              style={{ transitionDelay: `${delay}ms` }}
              className={`transition-[opacity,transform] duration-300 ease-out-expo ${
                open
                  ? "translate-y-0 scale-100 opacity-100"
                  : "translate-y-3 scale-90 opacity-0"
              }`}
            >
              <a
                href={section.href}
                tabIndex={open ? 0 : -1}
                data-cursor-hover
                onClick={handleLinkClick}
                className="block whitespace-nowrap rounded-full border border-hairline bg-panel-strong px-4 py-2 text-sm text-ink backdrop-blur-md transition-colors duration-200 hover:border-[var(--ring)] hover:text-ink-strong"
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        aria-label={open ? "Close section menu" : "Open section menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-panel-strong text-ink backdrop-blur-md transition-[border-color,color,transform] duration-200 hover:border-[var(--ring)] hover:text-ink-strong active:scale-95"
      >
        <span className="pointer-events-none absolute -inset-px rounded-full bg-accent-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-40" />
        <span className="relative inline-flex h-5 w-5">
          <Menu
            strokeWidth={2}
            className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${
              open ? "rotate-90 opacity-0" : "rotate-0 opacity-100"
            }`}
          />
          <X
            strokeWidth={2}
            className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${
              open ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"
            }`}
          />
        </span>
      </button>

      <button
        type="button"
        aria-label="Scroll to top"
        onClick={scrollToTop}
        className="group absolute bottom-0 right-[3.75rem] flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-panel-strong text-ink backdrop-blur-md transition-[border-color,color,transform] duration-200 hover:border-[var(--ring)] hover:text-ink-strong active:scale-95"
      >
        <span className="pointer-events-none absolute -inset-px rounded-full bg-accent-gradient opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-40" />
        <ArrowUp strokeWidth={2} className="relative h-5 w-5" />
      </button>
    </div>
  );
}
