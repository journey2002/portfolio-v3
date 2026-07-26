"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Freezes CSS animations inside a subtree while it's off screen.
 *
 * The site runs a lot of ambient loops — the hero's aurora and its floating
 * artwork cards, the project covers' blobs, the resume's aurora — and all of
 * them are `infinite` and mounted for the whole session. The compositor keeps
 * animating them long after they've scrolled away, and the big blurred
 * gradient layers are not cheap frames to keep painting for nobody.
 *
 * One observer can gate a whole section: point it at the section and spread
 * `animation` onto every animated element inside it.
 *
 *     const pause = usePauseOffscreen();
 *     <section ref={pause.ref}>
 *       <div className="animate-float-card" style={{ ...pause.animation }} />
 *       <div className="animate-aurora-shift" style={{ ...pause.animation }} />
 *     </section>
 *
 * Pass `target` when the element you want to watch already owns a ref:
 *
 *     const pause = usePauseOffscreen({ target: sectionRef });
 *
 * Same idea as the marquee's WAAPI pause in useMarqueeSlowOnHover, but for
 * decorative loops that no hook already owns. Pausing shifts where a loop
 * resumes in its cycle, which is invisible for ambient drift and a blinking
 * caret but would be wrong for anything whose phase carries meaning — so
 * don't reach for this on progress or state indicators.
 *
 * The generous rootMargin means a loop is running well before its element can
 * be seen, so nothing is ever caught mid-freeze on the way in.
 */
export function usePauseOffscreen<T extends HTMLElement = HTMLDivElement>({
  rootMargin = "200px",
  target,
}: { rootMargin?: string; target?: RefObject<T> } = {}) {
  const ownRef = useRef<T>(null);
  const ref: RefObject<T> = target ?? ownRef;
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // Without IntersectionObserver, never pause — the animation is the
    // baseline behaviour and stopping it is the risk, not leaving it running.
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => setPaused(!(entries[0]?.isIntersecting ?? true)),
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);

  return {
    ref,
    paused,
    animation: { animationPlayState: paused ? "paused" : "running" } as const,
  };
}
