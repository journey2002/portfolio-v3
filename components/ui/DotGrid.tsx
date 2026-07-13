"use client";

import { useEffect, useRef, useState } from "react";
import { usePointer } from "@/components/ui/PointerProvider";

type DotGridProps = {
  className?: string;
  /** Glow halo radius in px — alpha fades to 0 at 72% of it, matching the old
   *  CSS mask (`radial-gradient(620px circle …, transparent 72%)`). */
  size?: number;
  /** Grid cell size in px — should match the static `.grid-dots` fallback. */
  gridSize?: number;
  /** Radius around the cursor within which dots get pushed away, in px.
   *  Sized close to the glow radius so the lit region and the bowed region
   *  read as one phenomenon. */
  repelRadius?: number;
  /** Peak outward displacement of the swell, in px — reached about a third
   *  of the way out (REPEL_PEAK), NOT at the cursor: the centre stays almost
   *  still so no evacuated hole travels with the pointer. */
  repelStrength?: number;
  /** Milliseconds between ambient raindrop pulses. */
  wavePeriod?: number;
};

// Where the swell peaks, as a fraction of repelRadius. Displacement rises
// smoothly from ~0 at the cursor to repelStrength here, then feathers to
// zero at the rim.
const REPEL_PEAK = 0.35;

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// ── Ambient "raindrop pulse" ────────────────────────────────────────────────
// Every `wavePeriod` ms a random grid dot charges up (dots gather inward,
// warming toward the accent) then releases an expanding ring: a sharp gaussian
// crest with a long exponential wake, dying out exactly as it reaches the
// farthest corner.
const WAVE_FIRST_DELAY = 2500; // ms until the very first pulse
const WAVE_CHARGE_MS = 700; // anticipation phase length
const WAVE_SPEED = 0.6; // ring expansion, px per ms
const WAVE_FRONT_W = 80; // gaussian sigma of the leading crest, px
const WAVE_TAIL_W = 260; // exponential wake length behind the crest, px
const WAVE_AMP = 16; // peak radial displacement at the crest, px
const WAVE_GATHER = 6; // inward pull during charge, px
const WAVE_GLOW = 0.9; // crest's max contribution to the accent blend
const WAVE_PEAK_MIN = 0.55; // dimmest a single pulse's brightness can roll
const WAVE_PEAK_MAX = 1.25; // brightest a single pulse's brightness can roll

type RGBA = { r: number; g: number; b: number; a: number };

/**
 * The hero's interactive dot grid, drawn on a canvas: every 80px cell gets a
 * dot; near the cursor the dots brighten toward the accent (the glow the old
 * GridSpotlight mask produced) AND bulge away from it — an annular swell
 * that is nearly still at the pointer, peaks mid-field, and feathers at the
 * rim, trailing the cursor on a lerp so the field feels liquid rather than
 * strobed. Independently of the cursor, an ambient "raindrop pulse" fires
 * every `wavePeriod` ms from a random origin — sometimes just outside a
 * random corner (a diagonal sweep across the whole field), sometimes a
 * random interior dot (a classic raindrop): the origin charges up
 * (neighbours gather inward, warming toward the accent) then releases an
 * expanding ring with a sharp leading crest and a long fading wake,
 * dissipating as it reaches the farthest corner. Each pulse also rolls its
 * own peak brightness once, held for its whole lifetime, so some flashes
 * read bold and others barely glimmer.
 * CSS backgrounds can't move
 * individual dots, hence the canvas; it replaces BOTH old layers (static
 * `.grid-dots` + masked spotlight copy) so a displaced dot never leaves a
 * static twin behind.
 *
 * Progressive enhancement: the plain `.grid-dots` div renders as the SSR/
 * fallback layer — touch devices, small screens, and prefers-reduced-motion
 * keep exactly the static grid they had before. The canvas mounts only for a
 * fine pointer, md+, motion allowed.
 *
 * Colors are resolved from the live CSS vars (`--grid-dot`, `--accent-1`) and
 * re-resolved via a MutationObserver on the html element's data-theme /
 * data-accent attributes — those swap inside a View Transition, a frame or
 * more after the React state flips, so observing the DOM is the only timing
 * that can't read stale values.
 */
export default function DotGrid({
  className = "",
  size = 620,
  gridSize = 80,
  repelRadius = 460,
  repelStrength = 15,
  wavePeriod = 10000,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = usePointer();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!pointer?.enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setActive(true);
  }, [pointer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas || !pointer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointer;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
    resize();

    // Live theme/accent colors, parsed once per change (not per frame) and a
    // pre-built fillStyle for the common far-from-cursor dot.
    let base: RGBA = { r: 255, g: 255, b: 255, a: 0.07 };
    let glow: RGBA = { r: 16, g: 185, b: 129, a: 0.5 };
    let baseStyle = "";
    let colorsDirty = true;
    const resolveColors = () => {
      const cs = getComputedStyle(document.documentElement);
      base = parseColor(ctx, cs.getPropertyValue("--grid-dot")) ?? base;
      const ch = cs.getPropertyValue("--accent-1").trim().split(/\s+/).map(Number);
      if (ch.length >= 3 && !ch.some(Number.isNaN)) {
        // Same accent alphas the old spotlight used per theme.
        const light = document.documentElement.dataset.theme === "light";
        glow = { r: ch[0], g: ch[1], b: ch[2], a: light ? 0.45 : 0.5 };
      }
      baseStyle = `rgba(${base.r},${base.g},${base.b},${base.a})`;
    };
    const mo = new MutationObserver(() => {
      colorsDirty = true;
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-accent"],
    });

    const TWO_PI = Math.PI * 2;
    const glowR = size * 0.72; // alpha hits 0 here — the old mask's 72% stop
    const half = gridSize / 2; // CSS dots sit at each tile's centre
    const baseR = 1.35; // ≈ the CSS dot's 1.2px core + soft edge

    // Cursor state: the drawn centre (sx, sy) trails the real cursor on a
    // ~90ms lerp so the bulge swells and relaxes like a viscous field rather
    // than snapping dot-by-dot. Glow + push are both scaled by
    // `presence`, which eases 0 → 1 on the first real pointer move — the old
    // 700ms opacity fade-in, and it keeps the corner from glowing while the
    // pointer still sits at its offscreen initial (-200, -200).
    let sx = -200;
    let sy = -200;
    let presence = 0;
    let moved = false;

    // Ambient wave state — at most one wave lives at a time (a full sweep
    // takes ~3.5s against a 10s period). `maxD` is the epicenter→farthest-
    // corner distance: total energy is a smoothstep of remaining life so the
    // ripple reaches zero exactly as the crest exits the canvas.
    type Wave = { cx: number; cy: number; t0: number; maxD: number; peak: number };
    let wave: Wave | null = null;
    let nextWaveAt = performance.now() + WAVE_FIRST_DELAY;

    let rafId: number | null = null;
    let lastT = performance.now();

    const draw = (t: number) => {
      const dt = Math.min(t - lastT, 33);
      lastT = t;
      if (colorsDirty) {
        colorsDirty = false;
        resolveColors();
      }

      if (t >= nextWaveAt && cssW > 0 && cssH > 0) {
        // Random pattern per pulse: half the time a corner sweep (the ring
        // enters from just outside a random corner and crosses the whole
        // field diagonally), half the time a raindrop on a random interior
        // grid dot (kept to the middle ~70% so the charge-up stays visible).
        let cx: number;
        let cy: number;
        if (Math.random() < 0.5) {
          cx = Math.random() < 0.5 ? half - gridSize : cssW - half + gridSize;
          cy = Math.random() < 0.5 ? half - gridSize : cssH - half + gridSize;
        } else {
          const cols = Math.max(1, Math.floor(cssW / gridSize));
          const rows = Math.max(1, Math.floor(cssH / gridSize));
          cx = half + Math.floor(cols * (0.15 + Math.random() * 0.7)) * gridSize;
          cy = half + Math.floor(rows * (0.15 + Math.random() * 0.7)) * gridSize;
        }
        wave = {
          cx,
          cy,
          t0: t,
          maxD: Math.hypot(Math.max(cx, cssW - cx), Math.max(cy, cssH - cy)),
          // Each pulse rolls its own brightness once, held for its whole
          // lifetime — some flashes read bright, some barely glimmer.
          peak: WAVE_PEAK_MIN + Math.random() * (WAVE_PEAK_MAX - WAVE_PEAK_MIN),
        };
        nextWaveAt = t + wavePeriod;
      }

      // Reduce the live wave to three per-frame numbers the dot loop reads:
      // chargeT (0→1 during anticipation), waveR (crest radius, -1 = not
      // rippling), waveEnergy (global decay, hits 0 at the farthest corner).
      let chargeT = 0;
      let waveR = -1;
      let waveEnergy = 0;
      if (wave) {
        const age = t - wave.t0;
        if (age < WAVE_CHARGE_MS) {
          chargeT = smoothstep(age / WAVE_CHARGE_MS);
        } else {
          waveR = (age - WAVE_CHARGE_MS) * WAVE_SPEED;
          const life = 1 - waveR / wave.maxD;
          if (life <= 0) {
            wave = null;
            waveR = -1;
          } else {
            waveEnergy = smoothstep(life);
          }
        }
      }

      // Fresh rect every frame: parallax + the hero's scroll transform move
      // this element constantly (same per-frame read the old spotlight did).
      const rect = canvas.getBoundingClientRect();
      // Self-heal a stale bitmap — background tabs can defer the
      // ResizeObserver callback until the tab is next rendered.
      if (rect.width !== cssW || rect.height !== cssH) resize();
      const tx = x.get() - rect.left;
      const ty = y.get() - rect.top;
      if (!moved && (x.get() !== -200 || y.get() !== -200)) {
        moved = true;
        sx = tx; // appear AT the cursor — only presence fades in, not position
        sy = ty;
      }
      const k = 1 - Math.exp(-dt * 0.011);
      sx += (tx - sx) * k;
      sy += (ty - sy) * k;
      presence += ((moved ? 1 : 0) - presence) * (1 - Math.exp(-dt * 0.006));

      ctx.clearRect(0, 0, cssW, cssH);
      // Dots with no glow/wave contribution (the vast majority every frame)
      // share one fixed radius + fillStyle, so they're batched into a single
      // Path2D and filled with one call instead of a beginPath/arc/fill triad
      // per dot — same pixels, far fewer draw calls. Glowing dots vary in
      // color and radius per-dot, so they keep their individual fill below.
      const restPath = new Path2D();
      for (let gx = half; gx < cssW; gx += gridSize) {
        for (let gy = half; gy < cssH; gy += gridSize) {
          const dx = gx - sx;
          const dy = gy - sy;
          const d = Math.max(Math.sqrt(dx * dx + dy * dy), 0.001);

          let px = gx;
          let py = gy;
          if (d < repelRadius) {
            // Annular swell, not a crater: push rises from ~0 at the cursor
            // to its peak at REPEL_PEAK of the radius, then feathers to zero
            // at the rim (smoothstep both ways). Max-push-at-centre profiles
            // evacuate a dot-free disc that rides the cursor — a dizzy
            // "black hole" ringed by lit dots — and dots the pointer passes
            // over slingshot from one side to the other. With the centre
            // still, the bulge reads as a calm lens in the mid-field.
            const f = d / repelRadius;
            const push =
              repelStrength *
              presence *
              (f < REPEL_PEAK
                ? smoothstep(f / REPEL_PEAK)
                : 1 - smoothstep((f - REPEL_PEAK) / (1 - REPEL_PEAK)));
            px += (dx / d) * push;
            py += (dy / d) * push;
          }

          // Ambient wave contribution — independent of `presence`: the
          // pulse runs even before the pointer ever moves. `waveGlow` is
          // `waveT` scaled by this pulse's random brightness (`wave.peak`)
          // — displacement stays consistent pulse-to-pulse, only the glow
          // color/intensity varies.
          let waveT = 0;
          let waveGlow = 0;
          if (wave) {
            const wdx = gx - wave.cx;
            const wdy = gy - wave.cy;
            const wd = Math.max(Math.hypot(wdx, wdy), 0.001);
            if (waveR >= 0) {
              // Asymmetric ring: sharp gaussian front, long exponential
              // wake — the crest hits crisply and leaves a fading trail.
              const dd = wd - waveR;
              const env =
                dd > 0
                  ? Math.exp(-(dd * dd) / (2 * WAVE_FRONT_W * WAVE_FRONT_W))
                  : Math.exp(dd / WAVE_TAIL_W);
              waveT = env * waveEnergy;
              waveGlow = waveT * wave.peak;
              if (waveT > 0.004) {
                const push = WAVE_AMP * waveT;
                px += (wdx / wd) * push;
                py += (wdy / wd) * push;
              }
            } else {
              // Charge: neighbours warm up and gather slightly INWARD —
              // surface tension before the drop — then fling outward on
              // release.
              const sigma = gridSize * 1.2;
              waveT = chargeT * Math.exp(-(wd * wd) / (2 * sigma * sigma));
              waveGlow = waveT * wave.peak;
              if (waveT > 0.004) {
                px -= (wdx / wd) * WAVE_GATHER * waveT;
                py -= (wdy / wd) * WAVE_GATHER * waveT;
              }
            }
          }

          const cursorGlow = d < glowR ? presence * (1 - d / glowR) : 0;
          const glowT = Math.min(1, cursorGlow + waveGlow * WAVE_GLOW);
          if (glowT > 0.004) {
            // Blend base → accent and swell slightly, matching the stacked
            // base-dot + masked accent-dot compositing of the CSS version.
            const cr = base.r + (glow.r - base.r) * glowT;
            const cg = base.g + (glow.g - base.g) * glowT;
            const cb = base.b + (glow.b - base.b) * glowT;
            const ca = base.a + (glow.a - base.a) * glowT;
            ctx.beginPath();
            ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${ca.toFixed(3)})`;
            ctx.arc(px, py, baseR + 0.55 * glowT + 0.35 * waveT, 0, TWO_PI);
            ctx.fill();
          } else {
            // moveTo before arc() opens a fresh subpath per dot — required so
            // each circle fills independently instead of implicitly connecting
            // to the previous one's endpoint.
            restPath.moveTo(px + baseR, py);
            restPath.arc(px, py, baseR, 0, TWO_PI);
          }
        }
      }
      ctx.fillStyle = baseStyle;
      ctx.fill(restPath);
      rafId = requestAnimationFrame(draw);
    };

    const startLoop = () => {
      if (rafId !== null) return;
      lastT = performance.now();
      // After being parked off-screen, don't fire a stale pulse the instant
      // the hero re-enters — give it a beat, then resume the normal cadence.
      if (nextWaveAt < lastT) nextWaveAt = lastT + 1500;
      // Paint synchronously (dt = 0 → rest pose) so the grid is visible from
      // the first frame; draw() self-schedules the rAF loop from there.
      draw(lastT);
    };
    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Only animate while on screen (and while the canvas is display:none below
    // md it never intersects, so the loop stays parked there too).
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) startLoop();
        else stopLoop();
      },
      { rootMargin: "80px" },
    );
    io.observe(canvas);
    // Don't wait for the observer's initial callback (hidden/background tabs
    // can defer it indefinitely) — start now, let IO stop us if off-screen.
    startLoop();

    // ResizeObserver rather than window resize: dragging the hero frame's
    // corners changes the section height, which resizes this layer without
    // any window event.
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      stopLoop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
    };
  }, [active, pointer, size, gridSize, repelRadius, repelStrength, wavePeriod]);

  return (
    <>
      {/* Static CSS grid — the SSR markup and the only layer for touch /
          reduced-motion. Once the canvas takes over (md+) this hides so a
          displaced dot never shows a static twin underneath. */}
      <div
        aria-hidden
        className={`grid-dots pointer-events-none absolute ${
          active ? "md:hidden" : ""
        } ${className}`}
      />
      {active && (
        // The wrapper div takes the inset classes because a canvas is a
        // replaced element — absolute inset offsets position it but don't
        // stretch it, so it must fill an already-stretched box instead.
        <div
          aria-hidden
          className={`pointer-events-none absolute hidden md:block ${className}`}
        >
          <canvas ref={canvasRef} className="h-full w-full" />
        </div>
      )}
    </>
  );
}

/** Parse any CSS color via the canvas itself (handles `rgba(…)`, `#hex`, and
 *  modern `rgb(r g b / a)` slash syntax without a hand-rolled grammar). */
function parseColor(ctx: CanvasRenderingContext2D, css: string): RGBA | null {
  const v = css.trim();
  if (!v) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = v;
  const s = String(ctx.fillStyle); // normalised to #rrggbb or rgba(r, g, b, a)
  if (s[0] === "#") {
    const r = parseInt(s.slice(1, 3), 16);
    const g = parseInt(s.slice(3, 5), 16);
    const b = parseInt(s.slice(5, 7), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
    return { r, g, b, a: s.length >= 9 ? parseInt(s.slice(7, 9), 16) / 255 : 1 };
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return null;
  const p = m[1].split(",").map((n) => parseFloat(n));
  if (p.length < 3 || p.some(Number.isNaN)) return null;
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
}
