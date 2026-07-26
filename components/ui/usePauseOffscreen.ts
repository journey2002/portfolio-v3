"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Freezes CSS animations inside a subtree while it's off screen.
 *
 * The site has several ambient loops — the hero's aurora drift, the project
 * covers' floating blobs — that are `infinite` and mounted for the whole
 * session. The compositor keeps animating them long after they've scrolled
 * away, and the blob layers in particular are large `blur-3xl` gradients, so
 * they're not cheap frames to keep painting for nobody.
 *
 * Returns a ref to attach to the container and a `paused` flag; spread the
 * returned style onto each animated element:
 *
 *     const { ref, animation } = usePauseOffscreen();
 *     <div ref={ref}>
 *       <div className="animate-float-card" style={{ ...animation }} />
 *     </div>
 *
 * Same idea as the marquee's WAAPI pause in useMarqueeSlowOnHover, but for
 * decorative loops that no hook already owns. It only ever pauses ambient
 * drift, where a resumed loop picks up at a different phase than it would
 * have — invisible for a slow ambient wander, so don't reach for this on
 * anything whose phase carries meaning.
 *
 * The generous rootMargin means the loop is already running well before the
 * element can be seen, so nothing is ever caught mid-freeze.
 */
export function usePauseOffscreen<T extends HTMLElement = HTMLDivElement>(
  rootMargin = "200px",
) {
  const ref = useRef<T>(null);
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
  }, [rootMargin]);

  return {
    ref,
    paused,
    animation: { animationPlayState: paused ? "paused" : "running" } as const,
  };
}
