"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { useRef, type ReactNode, type CSSProperties } from "react";

type ParallaxProps = {
  children: ReactNode;
  /** Range traveled, in px, while the element passes through the viewport. */
  offset?: number;
  /** Direction of travel. */
  direction?: "up" | "down" | "left" | "right";
  /** Add a spring smoothing for buttery motion (slightly delayed). */
  spring?: boolean;
  className?: string;
  style?: CSSProperties;
  /** When true, also fade in toward the centre of the viewport. */
  fade?: boolean;
};

/**
 * Generic parallax wrapper. The element drifts opposite the scroll direction
 * by `offset` pixels while it is in view. Spring smoothing adds a tasteful
 * trailing feel — never blocking, just luxurious.
 */
export default function Parallax({
  children,
  offset = 80,
  direction = "up",
  spring = true,
  className = "",
  style,
  fade = false,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const sign = direction === "up" || direction === "left" ? -1 : 1;
  const axis = direction === "up" || direction === "down" ? "y" : "x";

  const rawDistance = useTransform(
    scrollYProgress,
    [0, 1],
    [sign * -offset, sign * offset]
  );
  // useSpring is always called to keep hook order stable; if `spring` is
  // disabled we just don't use its output.
  const sprungDistance = useSpring(rawDistance, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });
  const distance = spring ? sprungDistance : rawDistance;

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    fade ? [0, 1, 1, 0] : [1, 1, 1, 1]
  );

  return (
    <div ref={ref} className={className} style={style}>
      <motion.div
        style={
          axis === "y"
            ? { y: distance as MotionValue<number>, opacity }
            : { x: distance as MotionValue<number>, opacity }
        }
      >
        {children}
      </motion.div>
    </div>
  );
}
