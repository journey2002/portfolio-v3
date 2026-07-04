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
 * Theme state for the dark/light toggle.
 *
 * The actual `data-theme` attribute on <html> is set *before paint* by a tiny
 * blocking script in app/layout.tsx (reading localStorage, defaulting to dark)
 * so there's no flash. This provider just mirrors that into React state, exposes
 * a setter/toggle, and keeps localStorage + the <meta name="theme-color">
 * tag in sync. Dark is the default; the OS `prefers-color-scheme` is
 * intentionally NOT auto-followed — a stored choice always wins.
 */

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Matches --canvas in globals.css; used for the mobile browser chrome color.
const THEME_COLOR: Record<Theme, string> = {
  dark: "#080808",
  light: "#f6f5f3",
};

// Last theme handed to applyTheme. The dataset itself can lag a frame behind
// (the swap runs inside the view-transition callback), so re-entrant calls —
// React strict mode double-invokes the toggle's state updater in dev — are
// deduped against the requested value, not the painted one.
let requestedTheme: Theme | null = null;

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* private mode / storage disabled — the in-memory state still works */
  }
  const root = document.documentElement;
  if ((requestedTheme ?? root.dataset.theme) === theme) return;
  requestedTheme = theme;

  const swap = () => {
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[theme]);
  };

  // Swap through the View Transitions API where available: the browser
  // snapshots the page before/after the change and cross-fades the two on the
  // compositor. Without this, the swap live-animates colors on every element
  // for 500ms (body transition + every `transition-colors` utility picking up
  // the new CSS variables), which forces a full-page style/paint pass per
  // frame — the source of the toggle jank. The `theme-switching` class (see
  // globals.css) suppresses those per-element transitions during the swap so
  // the "new" snapshot is captured already at its final colors; the crossfade
  // supplies the same 0.5s ease the body transition used to.
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  if (
    !doc.startViewTransition ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    // Fallback: the body CSS transition eases the page tone, as before.
    swap();
    return;
  }
  root.classList.add("theme-switching");
  doc
    .startViewTransition(swap)
    .finished.finally(() => root.classList.remove("theme-switching"))
    .catch(() => {});
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR renders the default; the mount effect below corrects to whatever the
  // no-flash script already applied to <html>.
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setThemeState(current);
    // Keep the chrome color honest for a stored choice on first load.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLOR[current]);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Read/control the theme. Falls back to a no-op dark default if used outside the
 * provider, so theme-aware decorations never crash.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: "dark", setTheme: () => {}, toggle: () => {} };
  }
  return ctx;
}
