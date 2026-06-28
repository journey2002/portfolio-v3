"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ui/ThemeProvider";

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
 * auto-rotate, monochrome indigo.
 *
 * A static glow + marker is always rendered underneath the canvas and is the
 * only thing visible until cobe actually paints its first frame. That keeps the
 * tile from showing an empty box whenever the WebGL globe can't draw — touch
 * mobile, prefers-reduced-motion, a missing/blocked WebGL context, or a tab
 * that's still hidden (rAF is paused, so cobe never gets to render).
 */
export default function Globe({ className = "", size = 240 }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  // Mount the WebGL canvas only when motion is allowed and we're not on a small
  // screen — otherwise the static marker below is the permanent treatment.
  const [enabled, setEnabled] = useState(false);
  // Flip true on cobe's first painted frame; until then the static marker shows.
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (!reduce && !isMobile) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let isVisible = false;
    let hasPainted = false;
    // Light theme: a pale globe on the white tile; dark theme: the original
    // moody indigo sphere.
    const light = theme === "light";
    let globe: { destroy: () => void };
    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: size * dpr,
        height: size * dpr,
        phi: 0,
        theta: 0.25,
        dark: light ? 0 : 1,
        diffuse: light ? 1.6 : 1.2,
        mapSamples: 12000,
        mapBrightness: light ? 8 : 5,
        baseColor: light ? [0.82, 0.82, 0.88] : [0.28, 0.28, 0.32],
        markerColor: [0.65, 0.55, 1.0],
        glowColor: light ? [0.92, 0.9, 1.0] : [0.45, 0.4, 0.85],
        markers: [
          // Bangkok
          { location: [13.7563, 100.5018], size: 0.06 },
        ],
        onRender: (state) => {
          // Reveal the canvas and retire the fallback once (and only once)
          // cobe has actually drawn a frame.
          if (!hasPainted) {
            hasPainted = true;
            setPainted(true);
          }
          state.phi = phi;
          // Only advance rotation while the globe is on-screen.
          if (isVisible) phi += 0.0035;
        },
      });
    } catch {
      // No WebGL context — leave the static marker in place.
      return;
    }

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
  }, [enabled, size, theme]);

  return (
    <div
      aria-hidden
      style={{ width: size, height: size }}
      className={`relative ${className}`}
    >
      {/* Static glow + marker: the base layer, and the permanent fallback when
          the WebGL globe never paints. Fades out once cobe takes over. */}
      <div
        className={`absolute inset-0 rounded-full border border-hairline bg-[radial-gradient(closest-side,rgba(99,102,241,0.22),rgba(168,85,247,0.06)_60%,transparent_75%)] transition-opacity duration-500 ${
          painted ? "opacity-0" : "opacity-100"
        }`}
      >
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300 shadow-[0_0_10px_2px_rgba(139,92,246,0.55)]" />
      </div>
      {enabled && (
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size, aspectRatio: 1 }}
          className={`absolute left-0 top-0 transition-opacity duration-500 ${
            painted ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
