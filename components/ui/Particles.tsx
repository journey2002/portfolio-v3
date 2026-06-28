"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";

type ParticlesProps = {
  className?: string;
  /** Particle count — kept small for "subtle". */
  count?: number;
  /** Base color used for dots. Defaults to a theme-aware dust tint. */
  color?: string;
};

/**
 * Tiny canvas particle field — slow upward drift with gentle horizontal sway.
 * Designed to read as "dust" rather than "snow"; sits behind hero content at
 * low opacity. ~1.5KB of code, zero deps.
 *
 * Disabled on small screens (perf) and when prefers-reduced-motion is set.
 */
export default function Particles({
  className = "",
  count = 48,
  color,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  // Pale indigo dust on dark; a deeper, denser indigo so it still reads on the
  // warm-white canvas.
  const dustColor =
    color ??
    (theme === "light" ? "rgba(99,102,241,0.5)" : "rgba(165,180,252,0.65)");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (reduce || isMobile) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Particle = {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      a: number; // alpha multiplier (twinkle)
      aPhase: number;
    };
    const particles: Particle[] = [];

    // Cached CSS dimensions — refreshed only on resize, so the draw loop never
    // touches getBoundingClientRect() (which would force layout every frame).
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const init = () => {
      particles.length = 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * cssW,
          y: Math.random() * cssH,
          r: Math.random() * 1.4 + 0.4,
          vx: (Math.random() - 0.5) * 0.08,
          vy: -(Math.random() * 0.18 + 0.04),
          a: Math.random() * 0.6 + 0.3,
          aPhase: Math.random() * Math.PI * 2,
        });
      }
    };

    resize();
    init();

    let rafId: number | null = null;
    let lastT = performance.now();
    let isVisible = true;

    const draw = (t: number) => {
      const dt = Math.min(t - lastT, 33);
      lastT = t;

      ctx.clearRect(0, 0, cssW, cssH);

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.aPhase += dt * 0.002;

        // Wrap around the field
        if (p.y < -4) {
          p.y = cssH + 4;
          p.x = Math.random() * cssW;
        }
        if (p.x < -4) p.x = cssW + 4;
        if (p.x > cssW + 4) p.x = -4;

        const twinkle = 0.6 + Math.sin(p.aPhase) * 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = dustColor.replace(
          /rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/,
          (_m, r, g, b, a) =>
            `rgba(${r},${g},${b},${Math.min(1, parseFloat(a) * p.a * twinkle)})`
        );
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    };

    const startLoop = () => {
      if (rafId !== null) return;
      lastT = performance.now();
      rafId = requestAnimationFrame(draw);
    };
    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Only animate while the canvas is in the viewport — no point burning
    // frames behind the user.
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible) startLoop();
        else stopLoop();
      },
      { rootMargin: "100px" }
    );
    observer.observe(canvas);

    const handleResize = () => {
      resize();
      init();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [count, dustColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 hidden h-full w-full md:block ${className}`}
    />
  );
}
