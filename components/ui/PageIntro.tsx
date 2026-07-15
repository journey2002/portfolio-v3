"use client";

import {
  animate,
  motion,
  useMotionValue,
  type AnimationPlaybackControls,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MousePointer2 } from "lucide-react";
import { shouldSkipIntro, useIntro } from "@/components/ui/IntroProvider";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_DRAW = [0.7, 0, 0.3, 1] as const;

/** Shortest time the overlay stays up (ms from mount) — enough for the
    marquee draw plus a beat to read the selected frame. */
const MIN_HOLD = 1550;
/** Hard exit even if the fonts promise never settles (ms from mount). */
const CAP = 3500;

const CORNERS = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
] as const;

type Stage = "boot" | "draw" | "hold" | "open";

/**
 * On-load intro, staged in the site's design-tool language: a collaborator
 * cursor drag-draws a selection marquee around the monogram — the file being
 * opened — while a status line reports real load progress (document.fonts).
 * Once the fonts are in (min hold MIN_HOLD, hard cap CAP) the selection box
 * expands past the viewport edges and becomes the page, and finishIntro()
 * releases the hero's held entrance so the reveal and the hero rising read
 * as one continuous motion.
 *
 * The pasteboard backdrop is server-rendered (static import in layout.tsx),
 * so the very first paint on a first visit is the intro — no flash of the
 * page before the overlay hydrates. Repeat visits and reduced motion skip it
 * before paint: the inline script in layout.tsx stamps data-intro="done" on
 * <html> and globals.css hides #page-intro under that attribute.
 */
export default function PageIntro() {
  const { finishIntro } = useIntro();
  const [stage, setStage] = useState<Stage>("boot");
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);
  // Box geometry frozen at draw time. The content block is positioned off
  // these plain numbers so it does NOT ride the box's exit expansion.
  const [box, setBox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Selection box + cursor run on motion values driven imperatively, so the
  // draw never re-renders React. The draw animates width/height — layout
  // props, but the box is tiny (≤360×216) so the repaint region is cheap.
  // The exit expansion is the expensive moment (full viewport, concurrent
  // with the hero's entrance), so it rides scaleX/scaleY instead: compositor
  // only, no per-frame layout. The 1px border thickening as it scales past
  // the viewport edge reads as acceleration, not distortion.
  const bw = useMotionValue(0);
  const bh = useMotionValue(0);
  const sx = useMotionValue(1);
  const sy = useMotionValue(1);
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const cursorO = useMotionValue(0);

  // Counter ticks every frame right when the main thread is busiest, so it
  // writes textContent instead of setState (same reasoning as before).
  const countRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (shouldSkipIntro()) {
      document.documentElement.dataset.intro = "done";
      setGone(true);
      return;
    }

    let cancelled = false;
    const anims: AnimationPlaybackControls[] = [];
    const track = (c: AnimationPlaybackControls) => {
      anims.push(c);
      return c;
    };
    const wait = (ms: number) =>
      new Promise<void>((r) => window.setTimeout(r, ms));

    // Counter: crawls asymptotically toward ~93 while waiting on the real
    // signal, then ramps to 100 in 200ms once readyRef flips.
    const t0 = performance.now();
    let rampStart = 0;
    let rampFrom = 0;
    let raf = 0;
    let lastText = "";
    const crawl = (t: number) => 93 * (1 - Math.exp(-(t - t0) / 1100));
    const tick = (t: number) => {
      let v: number;
      if (readyRef.current) {
        if (!rampStart) {
          rampStart = t;
          rampFrom = crawl(t);
        }
        v = Math.min(100, rampFrom + (100 - rampFrom) * ((t - rampStart) / 200));
      } else {
        v = crawl(t);
      }
      // Write only when the displayed digits actually change — a same-text
      // write still invalidates layout, and this runs alongside the draw.
      const text = String(Math.round(v)).padStart(3, "0");
      if (countRef.current && text !== lastText) {
        lastText = text;
        countRef.current.textContent = text;
      }
      if (v < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const seq = async () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(360, vw - 64);
      const h = 216;
      const x = (vw - w) / 2;
      const y = (vh - h) / 2 - 12;
      setBox({ x, y, w, h });
      bw.set(0);
      bh.set(0);
      sx.set(1);
      sy.set(1);
      cx.set(x + w * 0.7);
      cy.set(y + h * 0.85);
      // Let hydration's first paint settle before anything moves — starting
      // the draw while the main thread is still committing the page is the
      // difference between a confident stroke and a stuttering one.
      await wait(140);
      if (cancelled) return;
      setStage("draw");

      // The cursor arrives at the box's top-left corner…
      await Promise.all([
        track(animate(cursorO, 1, { duration: 0.22, ease: "easeOut" })),
        track(animate(cx, x, { duration: 0.38, ease: "easeOut" })),
        track(animate(cy, y, { duration: 0.38, ease: "easeOut" })),
      ]);
      if (cancelled) return;

      // …and drag-draws the selection marquee to the bottom-right.
      const drag = { duration: 0.62, ease: EASE_DRAW };
      await Promise.all([
        track(animate(cx, x + w, drag)),
        track(animate(cy, y + h, drag)),
        track(animate(bw, w, drag)),
        track(animate(bh, h, drag)),
      ]);
      if (cancelled) return;
      setStage("hold");
      // Release: the cursor parks just outside the selected frame.
      track(animate(cx, x + w + 30, { duration: 0.8, ease: "easeOut" }));
      track(animate(cy, y + h + 20, { duration: 0.8, ease: "easeOut" }));

      // Real readiness: fonts loaded + the minimum stay, hard-capped so a
      // stalled font request can never strand the visitor behind the overlay.
      const elapsed = performance.now() - t0;
      await Promise.race([
        Promise.all([
          document.fonts.ready,
          wait(Math.max(0, MIN_HOLD - elapsed)),
        ]),
        wait(Math.max(0, CAP - elapsed)),
      ]);
      if (cancelled) return;

      readyRef.current = true;
      setReady(true);
      await wait(240); // let the counter land on 100
      if (cancelled) return;

      // Open the file: the selection box becomes the viewport. The hero's
      // entrance is released NOW so it rises while the box is still opening.
      setStage("open");
      finishIntro();
      try {
        sessionStorage.setItem("intro-seen", "1");
      } catch {
        /* private mode — the intro just replays next visit */
      }
      track(animate(cursorO, 0, { duration: 0.3, ease: "easeOut" }));
      // Scale from the box's centre until the border clears every viewport
      // edge (+112 of margin) — transform-only, so the busiest moment of the
      // whole intro never touches layout.
      const grow = { duration: 0.85, ease: [0.76, 0, 0.24, 1] as const };
      track(animate(sx, (window.innerWidth + 112) / w, grow));
      track(animate(sy, (window.innerHeight + 112) / h, grow));
      await wait(900);
      if (cancelled) return;
      document.documentElement.dataset.intro = "done";
      setGone(true);
    };
    seq();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      anims.forEach((a) => a.stop());
    };
  }, [bw, bh, sx, sy, cx, cy, cursorO, finishIntro]);

  if (gone) return null;

  return (
    <div
      id="page-intro"
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {/* Empty pasteboard — canvas, dot grid, grain. Present in the server
          HTML, so a first visit's first paint is this, not the page. Exits
          with a fade + slight zoom, like the camera pushing into the canvas. */}
      {/* Opacity-only exit: a scale zoom here re-rasters the full-viewport
          dot-grid + grain textures every frame, right when the hero's
          entrance needs the frame budget. */}
      <motion.div
        initial={false}
        animate={stage === "open" ? { opacity: 0 } : { opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut",
          delay: stage === "open" ? 0.08 : 0,
        }}
        className="absolute inset-0 bg-night"
      >
        <div className="grid-dots absolute inset-0" />
        <div className="noise-overlay absolute inset-0" />
        <p className="absolute inset-x-0 bottom-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          Worapat Settapak — Portfolio 2026
        </p>
      </motion.div>

      {/* Selection box: dashed marquee while drawing → solid selected frame →
          expands past the viewport as the reveal. One element through its
          whole life, so there are no crossfade seams. Position is static;
          the draw animates width/height (small region), the exit animates
          scale only. Handles live in the content block below — as children
          here the exit scale would smear them. */}
      {box && stage !== "boot" && (
        <motion.div
          style={{
            left: box.x,
            top: box.y,
            width: bw,
            height: bh,
            scaleX: sx,
            scaleY: sy,
            transformOrigin: "50% 50%",
          }}
          className={`absolute ${
            stage === "draw"
              ? "border border-dashed border-indigo-accent/80 bg-indigo-accent/[0.06]"
              : "border border-indigo-accent/60"
          }`}
        />
      )}

      {/* Box content — pinned to the box's resting rect (plain numbers, not
          the motion values), so it stays put while the box expands away. */}
      {box && (stage === "hold" || stage === "open") && (
        <motion.div
          initial={false}
          animate={stage === "open" ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute"
          style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
        >
          {/* Corner handles — pinned to the resting rect, not the scaling
              box, so the exit expansion can't distort them; they leave with
              this block's fade instead. */}
          {CORNERS.map((c, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 480,
                damping: 24,
                delay: 0.04 + i * 0.05,
              }}
              className="absolute h-2 w-2 rounded-[1px] border border-indigo-accent bg-night"
              style={{ left: `${c.x}%`, top: `${c.y}%`, x: "-50%", y: "-50%" }}
            />
          ))}

          {/* Frame name, riding the ring's top-left like a selected frame */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: EASE_OUT_EXPO }}
            className="absolute -top-6 left-0 flex items-center gap-2 font-mono text-[10px] tracking-wide text-[color:var(--accent-soft)]"
          >
            <span className="h-1.5 w-1.5 rounded-[2px] bg-accent-gradient" />
            worapat_portfolio.fig
          </motion.div>

          {/* Monogram — letters rise out of their own clip frames */}
          <div className="flex h-full items-center justify-center">
            <div className="flex items-baseline gap-2.5 pb-4 font-serif font-bold tracking-tight text-ink-strong">
              {["W", "S"].map((letter, i) => (
                <span
                  key={letter}
                  className="inline-block overflow-hidden"
                  style={{ paddingBottom: "0.1em" }}
                >
                  <motion.span
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.08 + i * 0.07,
                      ease: EASE_OUT_EXPO,
                    }}
                    className="inline-block text-6xl leading-none sm:text-7xl"
                  >
                    {letter}
                  </motion.span>
                </span>
              ))}
            </div>
          </div>

          {/* Status — the honest load readout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em]"
          >
            <span
              className={
                ready ? "text-[color:var(--accent-soft)]" : "text-ink-subtle"
              }
            >
              {ready ? "ready" : "loading fonts"}
            </span>
            <span className="text-ink-faint">·</span>
            <span ref={countRef} className="tabular-nums text-ink-muted">
              000
            </span>
          </motion.div>

          {/* W × H badge under the ring, like a design tool's dimension chip */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="absolute -bottom-7 inset-x-0 flex justify-center"
          >
            <span className="rounded-[4px] bg-accent-gradient px-1.5 py-0.5 font-mono text-[10px] font-medium leading-none text-white">
              {Math.round(box.w)} × {box.h}
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* Collaborator cursor with a name tag — it draws the marquee, then
          parks beside the selection until the reveal fades it out. */}
      {stage !== "boot" && (
        <motion.div
          style={{ x: cx, y: cy, opacity: cursorO }}
          className="absolute left-0 top-0 will-change-transform"
        >
          {/* No drop-shadow filter: it forces a filter pass on every frame of
              the cursor's travel for a barely-visible soft edge. */}
          <MousePointer2
            className="h-[18px] w-[18px] text-[color:var(--accent-soft)]"
            fill="currentColor"
            strokeWidth={1.5}
          />
          <span className="absolute left-[15px] top-[19px] whitespace-nowrap rounded-full rounded-tl-[3px] bg-accent-gradient px-2 py-[3px] font-mono text-[10px] font-medium leading-none text-white">
            worapat
          </span>
        </motion.div>
      )}
    </div>
  );
}
