"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

const SECTIONS = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Stack", href: "#stack" },
  { label: "Contact", href: "#contact" },
];

export default function SectionMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <ul
        aria-hidden={!open}
        className={`mb-3 flex flex-col items-end gap-2 ${open ? "" : "pointer-events-none"}`}
      >
        {SECTIONS.map((section, i) => {
          // Bottom-up reveal: items closest to the button animate first on open,
          // first to leave on close.
          const total = SECTIONS.length;
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
                className="block whitespace-nowrap rounded-full border border-hairline bg-[#0c0c0c]/90 px-4 py-2 text-sm text-neutral-300 backdrop-blur-md transition-colors duration-200 hover:border-white/20 hover:text-white"
              >
                {section.label}
              </a>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        aria-label="Open section menu"
        aria-expanded={open}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-[#0c0c0c]/90 text-neutral-300 backdrop-blur-md transition-[border-color,color,transform] duration-200 hover:border-white/20 hover:text-white active:scale-95"
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
    </div>
  );
}
