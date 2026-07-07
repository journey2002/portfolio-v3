"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePointer } from "@/components/ui/PointerProvider";

const SPRING = { stiffness: 150, damping: 20, mass: 0.5 };
const FADE = { duration: 0.2, ease: "easeOut" } as const;

type Variant = "default" | "link" | "move" | "resize";
type CursorState = { variant: Variant; angle: number };

const DEFAULT_STATE: CursorState = { variant: "default", angle: 0 };

// Decide which cursor the element under the pointer wants. A `data-cursor`
// attribute (set on the hero's draggable canvas controls) wins and may carry a
// rotation via `data-cursor-angle`; otherwise plain links/buttons just grow the
// ring as before.
function resolveCursor(el: EventTarget | null): CursorState {
  if (el instanceof Element) {
    const dc = el.closest<HTMLElement>("[data-cursor]");
    if (dc) {
      return {
        variant: (dc.dataset.cursor as Variant) || "default",
        angle: Number(dc.dataset.cursorAngle) || 0,
      };
    }
    if (el.closest("a, button, [data-cursor-hover]")) {
      return { variant: "link", angle: 0 };
    }
  }
  return DEFAULT_STATE;
}

export default function CustomCursor() {
  const pointer = usePointer();
  const enabled = pointer?.enabled ?? false;

  // Raw cursor position comes from the shared PointerProvider (one listener for
  // the whole page). Fallback keeps hook order stable if used without a provider.
  const fallback = useMotionValue(-200);
  const mouseX = pointer?.x ?? fallback;
  const mouseY = pointer?.y ?? fallback;

  const springX = useSpring(mouseX, SPRING);
  const springY = useSpring(mouseY, SPRING);

  // Appearance is variant-driven React state; position stays on MotionValues so
  // pointer movement never triggers a re-render.
  const [cursor, setCursor] = useState<CursorState>(DEFAULT_STATE);
  // A drag carries the pointer far outside the tiny handle, so the variant is
  // LOCKED on pointerdown over a control and released on pointerup — otherwise
  // the indicator would snap back to default the instant the drag began.
  const locked = useRef(false);

  const ringSize = useMotionValue(30);
  const dotSize = useMotionValue(6);
  const dotOpacity = useMotionValue(1);
  const ringOpacity = useMotionValue(1);

  // Center dot and ring dynamically using their current half-widths
  const dotHalf = useTransform(dotSize, (s) => s / 2);
  const dotX = useTransform(
    [mouseX, dotHalf] as const,
    ([x, h]: number[]) => x - h
  );
  const dotY = useTransform(
    [mouseY, dotHalf] as const,
    ([y, h]: number[]) => y - h
  );
  const ringX = useTransform(
    [springX, ringSize] as const,
    ([x, s]: number[]) => x - s / 2
  );
  const ringY = useTransform(
    [springY, ringSize] as const,
    ([y, s]: number[]) => y - s / 2
  );

  // Track what's under the pointer via pointer events (not mouse events): a
  // drag handler's preventDefault() on pointerdown suppresses compatibility
  // mouse events, so mouseover/out would go silent mid-interaction.
  useEffect(() => {
    if (!enabled) return;

    const apply = (next: CursorState) =>
      setCursor((prev) =>
        prev.variant === next.variant && prev.angle === next.angle ? prev : next
      );

    const onOver = (e: PointerEvent) => {
      if (!locked.current) apply(resolveCursor(e.target));
    };
    const onDown = (e: PointerEvent) => {
      const next = resolveCursor(e.target);
      if (next.variant === "move" || next.variant === "resize") {
        locked.current = true;
        apply(next);
      }
    };
    const release = (e: PointerEvent) => {
      if (!locked.current) return;
      locked.current = false;
      apply(resolveCursor(document.elementFromPoint(e.clientX, e.clientY)));
    };

    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [enabled]);

  // On links the ring grows and the center dot hides — leaving just the ring
  // so it frames small targets (e.g. nav labels) instead of sitting on top of
  // them. On canvas controls both fade out and the glyph takes over. The glyph
  // itself is animated declaratively in the JSX.
  useEffect(() => {
    const glyph = cursor.variant === "move" || cursor.variant === "resize";
    const link = cursor.variant === "link";
    animate(ringSize, link ? 44 : 30, FADE);
    animate(dotSize, link ? 11 : 6, FADE);
    animate(ringOpacity, glyph ? 0 : 1, FADE);
    animate(dotOpacity, glyph || link ? 0 : 1, FADE);
  }, [cursor.variant, ringSize, dotSize, ringOpacity, dotOpacity]);

  if (!enabled) return null;

  const showGlyph = cursor.variant === "move" || cursor.variant === "resize";

  return (
    <>
      {/* Dot — grows on interactive hover. mix-blend-difference inverts the
          color beneath so the dot always reads against any background. */}
      <motion.div
        aria-hidden
        style={{
          x: dotX,
          y: dotY,
          width: dotSize,
          height: dotSize,
          opacity: dotOpacity,
        }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-white mix-blend-difference"
      />
      {/* Ring — spring trail with its indigo glow restored. */}
      <motion.div
        aria-hidden
        style={{
          x: ringX,
          y: ringY,
          width: ringSize,
          height: ringSize,
          opacity: ringOpacity,
        }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] rounded-full border border-indigo-accent/60 shadow-[0_0_16px_3px_rgb(var(--accent-1)/0.35)]"
      />
      {/* Canvas-control indicator — a custom move/resize glyph that stands in for
          the OS cursor on the hero's draggable handles. Rides the RAW pointer so
          it sits exactly on the handle, and swivels to the handle's axis. */}
      <motion.div
        aria-hidden
        style={{ x: mouseX, y: mouseY }}
        className="pointer-events-none fixed left-0 top-0 z-[9999]"
      >
        <motion.svg
          width="30"
          height="30"
          viewBox="0 0 30 30"
          fill="none"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-0 top-0"
          style={{
            marginLeft: -15,
            marginTop: -15,
            transformOrigin: "center",
            stroke: "var(--accent-soft)",
            filter: "drop-shadow(0 0 5px rgb(var(--accent-1) / 0.55))",
          }}
          initial={false}
          animate={{
            opacity: showGlyph ? 1 : 0,
            scale: showGlyph ? 1 : 0.4,
            rotate: cursor.variant === "resize" ? cursor.angle : 0,
          }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {cursor.variant === "move" ? (
            // 4-way move arrow — these points drag freely in 2D.
            <>
              <path d="M15 4 V26 M4 15 H26" />
              <path d="M15 4 l-3 3.4 M15 4 l3 3.4" />
              <path d="M15 26 l-3 -3.4 M15 26 l3 -3.4" />
              <path d="M4 15 l3.4 -3 M4 15 l3.4 3" />
              <path d="M26 15 l-3.4 -3 M26 15 l-3.4 3" />
            </>
          ) : (
            // Double-headed resize arrow — rotated to the handle's axis.
            <>
              <path d="M5 15 H25" />
              <path d="M5 15 l4 -3.4 M5 15 l4 3.4" />
              <path d="M25 15 l-4 -3.4 M25 15 l-4 3.4" />
            </>
          )}
        </motion.svg>
      </motion.div>
    </>
  );
}
