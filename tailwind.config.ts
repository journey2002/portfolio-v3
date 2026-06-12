import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: "#080808",
        surface: "#111111",
        "surface-raised": "#161616",
        indigo: {
          accent: "#6366f1",
        },
        violet: {
          accent: "#a855f7",
        },
        hairline: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        serif: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "accent-gradient":
          "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
        // Smoother aurora: many intermediate stops eliminate visible banding on dark backgrounds.
        "aurora":
          "radial-gradient(70% 70% at 80% 80%, rgba(99,102,241,0.42) 0%, rgba(124,98,232,0.36) 14%, rgba(149,93,239,0.30) 28%, rgba(168,85,247,0.24) 42%, rgba(140,103,235,0.17) 55%, rgba(99,118,228,0.11) 68%, rgba(73,128,236,0.06) 80%, rgba(59,130,246,0.02) 90%, transparent 100%)",
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
        "orbit-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
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
        "marquee": "marquee 28s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "scroll-line": "scroll-line 2.2s ease-in-out infinite",
        "orbit-slow": "orbit-slow 22s linear infinite",
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
