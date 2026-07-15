"use client";

import { createContext, useCallback, useContext, useState } from "react";

/**
 * True when the on-load intro should never play this session: already seen,
 * or the visitor prefers reduced motion. Mirrors the inline `data-intro`
 * script in app/layout.tsx — keep the two predicates in sync.
 */
export function shouldSkipIntro() {
  if (typeof window === "undefined") return false;
  try {
    if (sessionStorage.getItem("intro-seen") === "1") return true;
  } catch {
    /* storage unavailable → treat as a first visit */
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const IntroContext = createContext<{
  introDone: boolean;
  finishIntro: () => void;
}>({
  // Default (no provider) behaves as if the intro already finished, so
  // entrance animations play on mount exactly as they did pre-intro.
  introDone: true,
  finishIntro: () => {},
});

/**
 * Coordinates the intro overlay with the page's entrance animations. On a
 * first visit `introDone` starts false — Hero/Nav hold their hidden pose —
 * and PageIntro flips it the moment its reveal begins, so the overlay opening
 * and the hero rising read as one continuous motion. When the intro is
 * skipped (repeat visit, reduced motion) it starts true and everything
 * animates on mount as before.
 */
export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [introDone, setIntroDone] = useState(shouldSkipIntro);
  const finishIntro = useCallback(() => setIntroDone(true), []);
  return (
    <IntroContext.Provider value={{ introDone, finishIntro }}>
      {children}
    </IntroContext.Provider>
  );
}

export function useIntro() {
  return useContext(IntroContext);
}
