import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces + ink are theme tokens: the value is a CSS variable holding
        // RGB CHANNELS, wrapped so Tailwind's `/alpha` modifier still works
        // (e.g. bg-surface/40 → rgb(var(--surface) / 0.4)). The actual values
        // live in app/globals.css and swap with [data-theme]. See that file.

        // Deepest background tone. Named `night` (not `base`) on purpose:
        // a color token called `base` makes Tailwind emit `text-base` as a
        // color utility, which collides with the built-in `text-base`
        // font-size utility and silently paints text invisible.
        night: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        // Semantic text ladder, strong → faint.
        ink: {
          strong: "rgb(var(--ink-strong) / <alpha-value>)",
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          subtle: "rgb(var(--ink-subtle) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        // Accent stays a literal brand color in both themes.
        indigo: {
          accent: "#6366f1",
        },
        violet: {
          accent: "#a855f7",
        },
        // Alpha-baked decorative tokens (theme-swapped full colors).
        hairline: "var(--hairline)",
        ring: "var(--ring)",
        glass: {
          DEFAULT: "var(--glass)",
          strong: "var(--glass-strong)",
        },
        sheen: "var(--sheen)",
        panel: {
          weak: "var(--panel-weak)",
          DEFAULT: "var(--panel)",
          strong: "var(--panel-strong)",
        },
      },
      fontFamily: {
        serif: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        hand: ["var(--font-caveat)", "ui-rounded", "cursive"],
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        // Aurora wash gradient is themed in globals.css (--aurora): the dark
        // theme keeps the original many-stop gradient; the light theme uses a
        // more saturated, lower-alpha variant so it reads on white.
        "aurora": "var(--aurora)",
      },
      keyframes: {
        // Transform-only so the giant blurred aurora layers stay on the GPU
        // compositor. backgroundPosition was dropped: gradient backgrounds
        // default to background-size 100%, so animating position never moved
        // anything — it only forced a repaint (and re-blur) of the whole
        // layer every frame.
        "aurora-shift": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)" },
        },
        "float-card": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
        "scroll-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "drift-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(12px)" },
        },
      },
      animation: {
        "aurora-shift": "aurora-shift 8s ease-in-out infinite",
        "float-card": "float-card 5s ease-in-out infinite",
        "reveal-up": "reveal-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "marquee": "marquee 65s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "scroll-line": "scroll-line 2.2s ease-in-out infinite",
        "drift-x": "drift-x 7s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [],
};

export default config;
