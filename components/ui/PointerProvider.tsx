"use client";

import { useMotionValue, useSpring, type MotionValue } from "framer-motion";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * A single source of truth for the cursor position.
 *
 * Previously every cursor-driven decoration (CustomCursor, each MouseParallax
 * layer, GridSpotlight) attached its own `window` mousemove listener, ran its
 * own rAF coalescer, and — for the parallax layers — its own spring. With the
 * hero alone that was 5 listeners + 5 rAF loops + 8 springs all firing on every
 * pointer move, anywhere on the page, even after scrolling past the hero.
 *
 * This provider attaches ONE listener, coalesces to ONE rAF, and exposes:
 *   - x / y      : raw client coordinates (cursor dot, grid spotlight)
 *   - snx / sny  : normalised (-0.5..0.5) position, smoothed by the shared
 *                  parallax spring — every MouseParallax used the same config
 *                  on the same input, so a single spring is identical output.
 *
 * Math and spring config are unchanged from the original components, so the
 * motion is pixel-for-pixel identical — this is purely an overhead reduction.
 */

type Pointer = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Raw normalised (-0.5..0.5) position, unsmoothed — spring it yourself if a
   *  feel other than the shared parallax spring is wanted. */
  nx: MotionValue<number>;
  ny: MotionValue<number>;
  snx: MotionValue<number>;
  sny: MotionValue<number>;
  /** True only on devices with a fine, hovering pointer (desktop). */
  enabled: boolean;
};

const PointerContext = createContext<Pointer | null>(null);

// Identical to the per-instance config MouseParallax used before.
const PARALLAX_SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

export function PointerProvider({ children }: { children: ReactNode }) {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const snx = useSpring(nx, PARALLAX_SPRING);
  const sny = useSpring(ny, PARALLAX_SPRING);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;
    setEnabled(true);

    // Cache viewport size; refresh on resize instead of reading per move.
    let vw = window.innerWidth;
    let vh = window.innerHeight;
    const onResize = () => {
      vw = window.innerWidth;
      vh = window.innerHeight;
    };

    let px = 0;
    let py = 0;
    let scheduled = false;
    const flush = () => {
      x.set(px);
      y.set(py);
      nx.set(px / vw - 0.5);
      ny.set(py / vh - 0.5);
      scheduled = false;
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    };

    // `pointermove` rather than `mousemove`: the canvas drag handlers (pen path,
    // resize handles) call preventDefault() on pointerdown, which suppresses the
    // compatibility mouse events — including mousemove — for the rest of the
    // gesture. A mousemove listener would freeze every cursor-driven decoration
    // mid-drag. Pointer events keep firing throughout, so the cursor, spotlight
    // and parallax track continuously while you reshape something. On desktop
    // (the only place this provider enables) a mouse's pointermove is equivalent.
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    };
  }, [x, y, nx, ny]);

  const value = useMemo<Pointer>(
    () => ({ x, y, nx, ny, snx, sny, enabled }),
    [x, y, nx, ny, snx, sny, enabled]
  );

  return (
    <PointerContext.Provider value={value}>{children}</PointerContext.Provider>
  );
}

export function usePointer() {
  return useContext(PointerContext);
}
