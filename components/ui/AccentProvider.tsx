"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Accent-palette state — orthogonal to the dark/light theme.
 *
 * The `data-accent` attribute on <html> is set *before paint* by the no-flash
 * script in app/layout.tsx (reading localStorage, defaulting to "sunset"), so
 * the accent applies with no flash exactly like the theme. This provider mirrors
 * that into React state, exposes a setter, and keeps localStorage in sync. The
 * actual hues live in app/globals.css keyed by `data-accent`; swapping the
 * attribute retints the whole site (see tailwind.config.ts token repoint).
 */

export type Accent = "sunset" | "violet" | "emerald";

export const ACCENTS: {
  id: Accent;
  label: string;
  /** Static gradient for the swatch — mirrors the palette in globals.css. */
  swatch: string;
  /** Primary hex (= --accent-1) for JS consumers that can't read a CSS var —
     e.g. framer color interpolation, which parses colours numerically. */
  primary: string;
}[] = [
  { id: "emerald", label: "Emerald", swatch: "linear-gradient(135deg,#10b981,#06b6d4)", primary: "#10b981" },
  { id: "sunset", label: "Sunset", swatch: "linear-gradient(135deg,#f97316,#f43f5e)", primary: "#f97316" },
  { id: "violet", label: "Violet", swatch: "linear-gradient(135deg,#6366f1,#a855f7)", primary: "#6366f1" },
];

/** Primary hex keyed by accent id — for framer/JS color math. */
export const ACCENT_PRIMARY: Record<Accent, string> = {
  sunset: "#f97316",
  violet: "#6366f1",
  emerald: "#10b981",
};

/** Primary as "r, g, b" — for building rgba() strings framer can interpolate
    (it can't parse `rgb(var(--accent-1)/a)`). Mirrors --accent-1 per palette. */
export const ACCENT_CHANNELS: Record<Accent, string> = {
  sunset: "249, 115, 22",
  violet: "99, 102, 241",
  emerald: "16, 185, 129",
};

const DEFAULT_ACCENT: Accent = "emerald";

function isAccent(v: string | null): v is Accent {
  return v === "sunset" || v === "violet" || v === "emerald";
}

type AccentContextValue = {
  accent: Accent;
  setAccent: (a: Accent) => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

// See ThemeProvider: the dataset can lag a frame behind the view-transition
// callback, so re-entrant calls are deduped against the requested value.
let requestedAccent: Accent | null = null;

function applyAccent(accent: Accent) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem("accent", accent);
  } catch {
    /* private mode / storage disabled — in-memory state still works */
  }
  const root = document.documentElement;
  if ((requestedAccent ?? (root.dataset.accent as Accent)) === accent) return;
  requestedAccent = accent;

  const swap = () => {
    root.dataset.accent = accent;
  };

  // Same jank-free path as the theme toggle: snapshot + crossfade via the View
  // Transitions API, suppressing per-element transitions during capture (the
  // `theme-switching` class in globals.css) so the new snapshot is grabbed at
  // its final colors instead of live-animating every accent surface for 500ms.
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  if (
    !doc.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    swap();
    return;
  }
  root.classList.add("theme-switching");
  doc
    .startViewTransition(swap)
    .finished.finally(() => root.classList.remove("theme-switching"))
    .catch(() => {});
}

export function AccentProvider({ children }: { children: ReactNode }) {
  // SSR renders the default; the mount effect corrects to whatever the no-flash
  // script already applied to <html>.
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);

  useEffect(() => {
    const current = document.documentElement.dataset.accent;
    if (isAccent(current)) setAccentState(current);
  }, []);

  const setAccent = useCallback((a: Accent) => {
    setAccentState(a);
    applyAccent(a);
  }, []);

  const value = useMemo<AccentContextValue>(
    () => ({ accent, setAccent }),
    [accent, setAccent]
  );

  return (
    <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
  );
}

/**
 * Read/control the accent. Falls back to a no-op default outside the provider so
 * accent-aware decorations never crash.
 */
export function useAccent(): AccentContextValue {
  const ctx = useContext(AccentContext);
  if (!ctx) return { accent: DEFAULT_ACCENT, setAccent: () => {} };
  return ctx;
}
