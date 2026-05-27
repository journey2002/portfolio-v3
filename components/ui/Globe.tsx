"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";

declare module "cobe" {
  interface COBEOptions {
    onRender?: (state: Record<string, number>) => void;
  }
}

type GlobeProps = {
  className?: string;
  /** CSS pixel size of the rendered globe. */
  size?: number;
};

/**
 * Tiny WebGL globe rendered via cobe (~1.7KB). One marker on Bangkok, slow
 * auto-rotate, monochrome indigo. Falls back to a static placeholder on
 * touch-only mobile (where the WebGL cost isn't worth the decoration) and
 * when prefers-reduced-motion is set.
 */
export default function Globe({ className = "", size = 240 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStatic, setIsStatic] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (reduce || isMobile) {
      setIsStatic(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let isVisible = false;
    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 12000,
      mapBrightness: 5,
      baseColor: [0.28, 0.28, 0.32],
      markerColor: [0.65, 0.55, 1.0],
      glowColor: [0.45, 0.4, 0.85],
      markers: [
        // Bangkok
        { location: [13.7563, 100.5018], size: 0.06 },
      ],
      onRender: (state) => {
        state.phi = phi;
        // Only advance rotation while the globe is on-screen.
        if (isVisible) phi += 0.0035;
      },
    });

    // Pause rotation while the canvas is off-screen.
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
      },
      { rootMargin: "100px" }
    );
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      globe.destroy();
    };
  }, [size]);

  if (isStatic) {
    return (
      <div
        aria-hidden
        style={{ width: size, height: size }}
        className={`relative rounded-full border border-hairline bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),rgba(168,85,247,0.06)_60%,transparent_75%)] ${className}`}
      >
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300 shadow-[0_0_10px_2px_rgba(139,92,246,0.55)]" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ width: size, height: size, aspectRatio: 1 }}
      className={className}
    />
  );
}
