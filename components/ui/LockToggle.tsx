"use client";

import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";

export default function LockToggle({
  locked,
  onToggle,
}: {
  locked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={locked}
      aria-label="Lock card layout — disable hover expand"
      data-cursor-hover
      onClick={onToggle}
      className="group flex shrink-0 items-center gap-3 rounded-full border border-hairline bg-surface/60 px-4 py-2 text-xs uppercase tracking-wider text-neutral-400 transition-colors hover:border-indigo-accent/40 hover:text-neutral-200"
    >
      {locked ? (
        <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
      ) : (
        <Unlock className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
      <span className="hidden sm:inline">
        {locked ? "Layout locked" : "Hover to expand"}
      </span>

      <span
        className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${
          locked ? "bg-indigo-accent/80" : "bg-neutral-700"
        }`}
      >
        <motion.span
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white"
          animate={{ x: locked ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
        />
      </span>
    </button>
  );
}
