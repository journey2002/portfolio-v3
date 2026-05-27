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

      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

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
        lenis?.scrollTo(el as HTMLElement, { offset: -96 });
      };

      document.addEventListener("click", handleAnchor);
    })();

    return () => {
      cancelled = true;
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      if (handleAnchor) document.removeEventListener("click", handleAnchor);
      lenis?.destroy();
    };
  }, []);

  return <>{children}</>;
}
