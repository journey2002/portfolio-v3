"use client";

import { useEffect, useRef } from "react";

/**
 * Eases the playbackRate of every `.animate-marquee` descendant down on hover
 * and back up on leave. Uses Web Animations API instead of transitioning
 * `animation-duration`, which would re-map the animation's current time and
 * cause the contents to snap to a different position mid-loop.
 */
export function useMarqueeSlowOnHover<T extends HTMLElement = HTMLDivElement>(
  slowRate = 0.25,
  enterMs = 600,
  leaveMs = 450,
) {
  const groupRef = useRef<T>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tracks = Array.from(
      group.querySelectorAll<HTMLElement>(".animate-marquee"),
    );
    if (!tracks.length) return;

    const getAnims = () =>
      tracks.flatMap((t) =>
        t.getAnimations().filter((a) => {
          const name = (a as unknown as { animationName?: string })
            .animationName;
          return name === "marquee";
        }),
      );

    let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const rampTo = (target: number, ms: number) => {
      cancelAnimationFrame(raf);
      const anims = getAnims();
      if (!anims.length) return;
      const start = anims[0].playbackRate;
      if (start === target) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / ms);
        const rate = start + (target - start) * ease(k);
        for (const a of anims) a.playbackRate = rate;
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const onEnter = () => rampTo(slowRate, enterMs);
    const onLeave = () => rampTo(1, leaveMs);

    // Pause the marquee entirely while the strip is offscreen — the loop has
    // no meaningful "position", so resuming later is indistinguishable, and
    // the compositor stops animating a layer nobody can see.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting ?? true;
        for (const a of getAnims()) {
          if (visible) a.play();
          else a.pause();
        }
      },
      { rootMargin: "100px" },
    );
    io.observe(group);

    group.addEventListener("pointerenter", onEnter);
    group.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      group.removeEventListener("pointerenter", onEnter);
      group.removeEventListener("pointerleave", onLeave);
      for (const a of getAnims()) {
        a.playbackRate = 1;
        a.play();
      }
    };
  }, [slowRate, enterMs, leaveMs]);

  return groupRef;
}
