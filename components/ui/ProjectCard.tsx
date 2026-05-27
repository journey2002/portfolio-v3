"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useRef, type CSSProperties } from "react";

type ProjectCardProps = {
  title: string;
  description: string;
  tags: string[];
  className?: string;
  tall?: boolean;
  // Driven by an expanding row: shrink text on the focused card, dim its sibling.
  expanded?: boolean;
  dimmed?: boolean;
  /** Index — drives reveal direction (even = from left, odd = from right). */
  index?: number;
};

const liftVariants: Variants = {
  rest: { y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  hover: { y: -8, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const borderVariants: Variants = {
  rest: { borderColor: "rgba(255,255,255,0.08)" },
  hover: { borderColor: "rgba(99,102,241,0.35)" },
};

const glowVariants: Variants = {
  rest: { opacity: 0, transition: { duration: 0.25, ease: "easeOut" } },
  hover: { opacity: 1, transition: { duration: 0.2, ease: "easeOut" } },
};

const arrowVariants: Variants = {
  rest: { rotate: 0, color: "rgb(115,115,115)" },
  hover: {
    rotate: 45,
    color: "rgb(99,102,241)",
    transition: { type: "spring", stiffness: 400, damping: 20 },
  },
};

export default function ProjectCard({
  title,
  description,
  tags,
  className = "",
  tall = false,
  expanded = false,
  dimmed = false,
}: ProjectCardProps) {
  // Cursor position is written straight to CSS custom properties on the root.
  // The browser handles gradient interpolation in the compositor — no React
  // re-renders, no framer-motion subscriptions, no per-frame string rebuilds.
  const rootRef = useRef<HTMLDivElement>(null);

  // 3D tilt — translate cursor offset to rotateX / rotateY. Springs add the
  // tasteful trailing wobble; on leave, we snap back to flat.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 250, damping: 18, mass: 0.4 });
  const rotateY = useSpring(tiltY, { stiffness: 250, damping: 18, mass: 0.4 });
  const tRotateX = useTransform(rotateX, (v) => `${v}deg`);
  const tRotateY = useTransform(rotateY, (v) => `${v}deg`);

  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    el.style.setProperty("--mx", `${px}px`);
    el.style.setProperty("--my", `${py}px`);
    // Normalize cursor offset to [-1, 1] then map to a small tilt range.
    const nx = (px / rect.width) * 2 - 1;
    const ny = (py / rect.height) * 2 - 1;
    tiltX.set(-ny * 5);
    tiltY.set(nx * 7);
  };

  const handleLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      ref={rootRef}
      data-cursor-hover
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={liftVariants}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={
        {
          opacity: dimmed ? 0.55 : 1,
          "--mx": "50%",
          "--my": "50%",
          perspective: "1200px",
        } as CSSProperties
      }
      className={`relative h-full transition-opacity duration-300 ${className}`}
    >
      {/* Outward halo — sits BEHIND the opaque card, so only the spill past the edges shows */}
      <motion.div
        aria-hidden
        variants={glowVariants}
        style={{
          background:
            "radial-gradient(300px circle at var(--mx) var(--my), rgba(99,102,241,0.55), rgba(168,85,247,0.22) 45%, transparent 72%)",
        }}
        className="pointer-events-none absolute inset-0 rounded-2xl blur-2xl"
      />

      {/* Card surface (opaque #111 masks the halo's interior).
          rotateX/rotateY drive the 3D tilt; transformStyle preserves
          children inside the 3D space so highlights track the tilt. */}
      <motion.article
        variants={borderVariants}
        style={{
          rotateX: tRotateX,
          rotateY: tRotateY,
          transformStyle: "preserve-3d",
        }}
        className={`relative flex h-full flex-col justify-between rounded-2xl border bg-surface p-7 ${
          tall ? "min-h-[420px]" : "min-h-[260px]"
        }`}
      >
        {/* Cursor-tracked outline glow — masked to the border ring only */}
        <motion.div
          aria-hidden
          variants={glowVariants}
          style={{
            background:
              "radial-gradient(220px circle at var(--mx) var(--my), rgba(165,180,252,0.9), rgba(168,85,247,0.5) 45%, transparent 70%)",
            padding: "1.5px",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
        />

        <div className="relative flex items-start justify-between">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-hairline px-3 py-1 text-xs font-medium uppercase tracking-wider text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>

          <motion.div variants={arrowVariants} className="shrink-0">
            <ArrowUpRight className="h-6 w-6" strokeWidth={1.5} />
          </motion.div>
        </div>

        <motion.div
          className="relative mt-auto pt-10"
          style={{ transformOrigin: "bottom left" }}
          animate={{ scale: expanded ? 0.8 : 1, y: expanded ? 8 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        >
          <h3 className="font-serif text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-400">
            {description}
          </p>
        </motion.div>
      </motion.article>
    </motion.div>
  );
}
