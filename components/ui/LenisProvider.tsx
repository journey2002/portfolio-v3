"use client";

import { useEffect } from "react";

export default function LenisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let lenis: import("lenis").default | undefined;
    let rafId: number | undefined;
    let handleAnchor: ((e: MouseEvent) => void) | undefined;
    let unsubScroll: (() => void) | undefined;
    let kick: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      lenis = new Lenis({
        // Shorter duration → much less perceived input lag. 1.2s felt heavy.
        duration: 0.9,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 1,
        // Touch smoothing intentionally off (default in Lenis 1.3+).
        touchMultiplier: 2,
      });

      // Only burn rAF frames while Lenis is actually animating a scroll.
      // The previous always-on loop ran ~60fps forever even when the page sat
      // still — same feel, far less idle CPU/GPU.
      const raf = (time: number) => {
        if (!lenis) return;
        lenis.raf(time);
        if (lenis.isScrolling) {
          rafId = requestAnimationFrame(raf);
        } else {
          rafId = undefined;
        }
      };

      kick = () => {
        if (rafId === undefined && lenis) {
          rafId = requestAnimationFrame(raf);
        }
      };

      unsubScroll = lenis.on("scroll", kick);
      // First wheel/touch may land before isScrolling flips — arm the loop.
      window.addEventListener("wheel", kick, { passive: true });
      window.addEventListener("touchstart", kick, { passive: true });

      handleAnchor = (e: MouseEvent) => {
        const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>(
          'a[href^="#"]'
        );
        if (!anchor) return;
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const el = document.querySelector(href);
        if (!el) return;
        e.preventDefault();
        // Offset accounts for the floating pill nav height (~72px) + breathing room
        kick?.();
        lenis?.scrollTo(el as HTMLElement, { offset: -96 });
      };

      document.addEventListener("click", handleAnchor);
    })();

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      unsubScroll?.();
      if (kick) {
        window.removeEventListener("wheel", kick);
        window.removeEventListener("touchstart", kick);
      }
      if (handleAnchor) document.removeEventListener("click", handleAnchor);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
