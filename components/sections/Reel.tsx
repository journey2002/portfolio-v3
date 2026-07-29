"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import SplitText from "@/components/ui/SplitText";
import { RevealLine } from "@/components/ui/Reveal";

/* ------------------------------------------------------------------ */
/* The reel — the moving half of the off-the-clock work, laid out on an */
/* editor timeline. A sub-block of Work's second movement (no <section> */
/* or SectionLabel of its own) — it sits inside that movement's         */
/* container, so the page padding comes from the parent.                */
/* ------------------------------------------------------------------ */

type Clip = {
  id: string;
  title: string;
  caption: string;
  src: string;
  /** 720p downscale offered to ≤767px viewports ahead of `src` (see the
   *  <source> pair in the monitor). Roughly half the bytes, and still
   *  oversampled at the ~700 CSS px a phone paints the monitor at. */
  srcMobile?: string;
  poster: string;
  /** How long the clip occupies the reel, in seconds — its share of the timeline
   *  width, the runtime total and the timecode. When this is SHORTER than the
   *  real file (Topograph) the clip is truncated: it plays at 1x and cuts to the
   *  next at this mark. When it's LONGER (Forager) the clip is slowed to fill the
   *  slot in one pass — no loop seam. The real file length is read live off the
   *  element to decide which. */
  duration: number;
  /** Per-clip colour identity (dominant tones pulled from the footage) — drives
   *  the monitor's glow and the timeline track's played-fill, the same way each
   *  Work project carries its own from/to hue. */
  from: string;
  to: string;
};

// Ordered as a showreel, not by filename: a warm, readable opener (the donut
// render everyone recognises), into the neon terrain, the kinetic sim, a quick
// character beat, and out on the render-sequence pass. Titles/captions are
// working names — swap them freely, the layout reads them from here.
const CLIPS: Clip[] = [
  {
    id: "forager",
    title: "Forager",
    caption: "3D · Stylised World",
    // The original Forager render, restored. It shipped as 0001-0140.mkv, and
    // the earlier fix here swapped it for unrelated Squirrel footage to get off
    // Matroska — a container Chromium plays but Safari and Firefox cannot decode
    // at all, which left the reel's opener dead on every iPhone, iPad, Mac and
    // Firefox. That was the wrong trade: the .mkv was ALREADY H.264, so the
    // container was the only problem. This is a straight remux (stream copy, no
    // re-encode) — same 1920x1080 24fps frames at the same bitrate, in a
    // container every browser supports. The .mkv master stays out of public/
    // per a398612; recover it from commit 66976dd if a re-render is ever needed.
    src: "/assets/Forager.mp4",
    srcMobile: "/assets/Forager.118238b5.m720.mp4",
    poster: "/assets/posters/Forager.jpg",
    // Real file is 5.83s in a 6s slot → plays at ~0.97x, i.e. effectively 1x.
    duration: 6,
    from: "#fb923c",
    to: "#f43f5e",
  },
  {
    id: "sprinkle",
    title: "Sprinkle Studio",
    caption: "3D · Modeling & Lighting",
    src: "/assets/Donut.mp4",
    srcMobile: "/assets/Donut.a86e90d2.m720.mp4",
    poster: "/assets/posters/Donut.jpg",
    duration: 6.7,
    from: "#f9a8d4",
    to: "#c4b5fd",
  },
  {
    id: "topograph",
    title: "Topograph",
    caption: "3D · Procedural Terrain",
    src: "/assets/turrain_map.cac59a2f.mp4",
    srcMobile: "/assets/turrain_map.cac59a2f.e0b9dfff.m720.mp4",
    poster: "/assets/posters/turrain_map.jpg",
    // Truncated to its first 10s so it doesn't dominate the reel. The file
    // itself is now trimmed to 10.5s to match (it used to run 20.9s, and the
    // unreachable tail was ~15 MB of the download) — still longer than the
    // slot, which is what keeps the timeupdate cut below in charge rather
    // than the native `ended` event.
    duration: 10,
    from: "#38bdf8",
    to: "#d946ef",
  },
  {
    id: "kinetic",
    title: "Kinetic",
    caption: "Simulation · Rigid Body",
    src: "/assets/tube_ball_bounce.2602cf1a.mp4",
    srcMobile: "/assets/tube_ball_bounce.2602cf1a.e94e15dc.m720.mp4",
    poster: "/assets/posters/tube_ball_bounce.jpg",
    duration: 10.4,
    from: "#22d3ee",
    to: "#a855f7",
  },
];

const TOTAL = CLIPS.reduce((s, c) => s + c.duration, 0);

// Where each clip sits in the finished reel. The cut sheet lists real in/out
// points rather than per-clip lengths, so a row reads as a position in the 0:33
// programme the way an edit decision list does.
const STARTS = CLIPS.map((_, i) =>
  CLIPS.slice(0, i).reduce((s, c) => s + c.duration, 0),
);

// Minutes:seconds, monospace-friendly. The section reads timecode in font-mono
// so it lands like a real editor readout (the same face the site uses for live
// URLs), not body copy.
const tc = (s: number) => {
  const clamped = Math.max(0, s || 0);
  const m = Math.floor(clamped / 60);
  const ss = Math.floor(clamped % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
};

// The video plays a "slot" of clip.duration; the real file may be longer
// (truncated) or shorter (slowed to fill). This is the element time that maps to
// a full timeline track, so a fraction p ↔ currentTime = p * capTime both ways.
const capTimeOf = (slot: number, real: number) =>
  real && isFinite(real) ? Math.min(slot, real) : slot;

export default function Reel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-10%" });
  // Live (re-firing) visibility gates autoplay: the reel only runs while it's
  // on screen, and pauses the moment it scrolls away — no off-screen decode.
  const inView = useInView(sectionRef, { margin: "-20%" });
  // Buffering gate, a long way ahead of the autoplay one. The reel sits several
  // screens below the fold, but its <video> is server-rendered, so `preload`
  // is whatever the markup says from the very first byte — `auto` had the
  // opener downloading in full while the visitor was still reading the hero.
  // Holding it at `metadata` until the section is roughly a screen and a half
  // away keeps that off the initial load, then upgrades to `auto` early enough
  // that the buffer is warm well before the -20% autoplay gate opens.
  const nearby = useInView(sectionRef, {
    once: true,
    margin: "1200px 0px 1200px 0px",
  });

  const reduced = useReducedMotion();

  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  // A tune-in burst is up (the clip changed); the scrub drag is live.
  const [glitching, setGlitching] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const clip = CLIPS[active];

  // Imperative surfaces updated every frame from the video clock (playhead,
  // track fill, timecode, monitor bar) — writing them straight to the DOM keeps
  // a 60fps readout from re-rendering the section on every tick.
  const videoRef = useRef<HTMLVideoElement>(null);
  // The strip itself — the coordinate space all segment geometry is measured
  // in, and the box a scrub x maps across.
  const railRef = useRef<HTMLDivElement>(null);
  // Ruler + strip together. The strip has to clip (overflow-hidden, for the
  // stills), so the playhead lives out here instead: that lets its marker sit
  // in the ruler band above the footage rather than being sliced by the strip's
  // top edge. It shares the strip's left edge, so the same x works for both.
  // It is also the scrub surface, which means pressing the ruler seeks too.
  const surfaceRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const monBarRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  // One per clip: its segment of the strip. Segments tile the full width with
  // flex-grow set to runtime, so a segment's width IS its share of the reel —
  // which makes it both the thing a scrub fraction maps across and the span the
  // playhead crosses.
  const trackRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  // Cached timeline-track geometry. paint() runs on every playback frame and
  // on every scrub move, and reading layout there — interleaved with the
  // transform writes just above it — is the pattern that forces a synchronous
  // reflow per frame. It only moves on resize, so measure there and read the
  // cache in the loop.
  //
  // Measured as a delta against the rail's own rect rather than offsetLeft:
  // offsetLeft is offsetParent-relative, which ties the numbers to whatever
  // happens to be positioned above a segment. A rect delta is in the rail's
  // coordinate space whatever the nesting, and both rects move together on
  // scroll, so the delta is scroll-invariant either way.
  type Geom = { left: number; width: number };
  const geomRef = useRef<(Geom | null)[]>([]);
  const measureOne = useCallback((el: HTMLButtonElement | null): Geom | null => {
    const rail = railRef.current;
    if (!el || !rail) return null;
    const r = el.getBoundingClientRect();
    const rr = rail.getBoundingClientRect();
    if (!r.width) return null;
    return { left: r.left - rr.left, width: r.width };
  }, []);
  const measureTracks = useCallback(() => {
    geomRef.current = trackRefs.current.map(measureOne);
  }, [measureOne]);
  const trackGeom = useCallback(
    (i: number) => {
      // Lazily fill a slot the measure pass hasn't reached yet (a segment that
      // mounted after the last resize), so the head can never sit at 0.
      if (!geomRef.current[i]) {
        geomRef.current[i] = measureOne(trackRefs.current[i]);
      }
      return geomRef.current[i];
    },
    [measureOne],
  );
  const glitchTimers = useRef<number[]>([]);

  // Read current state inside imperative event handlers without re-binding them.
  const inViewRef = useRef(inView);
  const shouldPlayRef = useRef(true); // intent to play (survives scroll pause)
  const activeRef = useRef(active);
  activeRef.current = active;
  // The tune-in burst holds autoplay until it clears; canplay reads this so a
  // fast-decoding clip doesn't start under the static.
  const glitchingRef = useRef(false);
  glitchingRef.current = glitching;
  // Skip the burst on first mount — nothing is "changing" into view yet.
  const firstClipRef = useRef(true);
  // Scrub bookkeeping. `scrubbingRef` mirrors the state for synchronous reads;
  // `scrubSeekRef` carries a fraction across a clip remount (the fresh element
  // seeks to it once its metadata lands); `resumeOnReadyRef` defers the resume
  // when the release beats the clip being decodable; `suppressClickRef` swallows
  // the click a mouse press leaves behind so it doesn't also re-cue the track;
  // the last pair coalesces moves to one seek per frame.
  const scrubbingRef = useRef(false);
  const scrubSeekRef = useRef<number | null>(null);
  const resumeOnReadyRef = useRef(false);
  const suppressClickRef = useRef(false);
  const pendingXRef = useRef(0);
  const scrubRafRef = useRef<number | null>(null);

  // Fit the element's rate to the clip's slot once the real duration is known:
  // a clip whose slot is longer than the file (Forager) is slowed to fill it in
  // one pass; everything else plays at 1x. Idempotent — safe to call from
  // loadedmetadata, canplay and just before play, so no matter which fires first
  // the rate is right by the time it moves.
  const syncRate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration || !isFinite(v.duration)) return;
    const c = CLIPS[activeRef.current];
    v.playbackRate = c.duration > v.duration ? v.duration / c.duration : 1;
  }, []);

  const playActive = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    syncRate();
    v.play()
      .then(() => setPlaying(true))
      .catch(() => {
        /* autoplay can be refused until a gesture — the poster stays up */
      });
  }, [syncRate]);

  // Single source of truth for the timeline readout: lay every imperative
  // surface out for clip `i` sitting at fraction `p`. Every clip before the
  // active one reads as fully "played" so the timeline behaves like a real scrub
  // bar — jump to clip 4 and clips 1–3 fill in behind the head. Driven both by
  // the per-frame clock (playback) and by the pointer (scrubbing).
  const paint = useCallback((i: number, p: number) => {
    fillRefs.current.forEach((el, idx) => {
      if (el) el.style.transform = `scaleX(${idx < i ? 1 : idx === i ? p : 0})`;
    });
    const geom = trackGeom(i);
    if (geom && playheadRef.current) {
      playheadRef.current.style.transform = `translateX(${
        geom.left + p * geom.width
      }px)`;
    }
    if (monBarRef.current) monBarRef.current.style.transform = `scaleX(${p})`;
    if (tcRef.current) {
      const slot = CLIPS[i].duration;
      tcRef.current.textContent = `${tc(p * slot)} / ${tc(slot)}`;
    }
  }, [trackGeom]);

  // Seat the playhead + fills to the start of clip `i`.
  const seatActive = useCallback((i: number) => paint(i, 0), [paint]);

  // Per-frame clock read. Position comes from the active track's real geometry
  // (offsetLeft/Width), not a time→percent guess, so the head stays glued to
  // the footage even with the min-width floor on short clips and the mobile
  // horizontal scroll.
  const frame = useCallback(() => {
    const v = videoRef.current;
    const c = CLIPS[activeRef.current];
    const real = v?.duration && isFinite(v.duration) ? v.duration : c.duration;
    // The fraction hits 1 at the truncate mark (short slot) or at the file's end
    // (equal / stretched slot). Timecode is reported in reel-slot seconds so a
    // truncated or slowed clip still counts up to its slot length.
    const capTime = capTimeOf(c.duration, real);
    if (v && capTime) {
      paint(activeRef.current, Math.min(1, v.currentTime / capTime));
    }
    rafRef.current = requestAnimationFrame(frame);
  }, [paint]);

  // Apply a fraction stashed across a clip remount once the fresh element can be
  // seeked. Called from loadedmetadata (kept, metadata seeks can be lossy) and
  // canplay (apply + clear).
  const applyPendingSeek = useCallback((clearIt: boolean) => {
    const v = videoRef.current;
    if (!v || !v.duration || !isFinite(v.duration)) return;
    if (scrubSeekRef.current == null) return;
    const capTime = capTimeOf(CLIPS[activeRef.current].duration, v.duration);
    try {
      v.currentTime = scrubSeekRef.current * capTime;
    } catch {
      /* seeking before the range is ready — canplay retries */
    }
    if (clearIt) scrubSeekRef.current = null;
  }, []);

  // Map a viewport x onto (clip, fraction) using the segments' real geometry,
  // then move the head there. Within the active clip we seek the live element;
  // across a boundary we cue the new clip and carry the fraction to its
  // metadata. The segments butt together with no gaps, so every x on the strip
  // lands inside exactly one clip — dragging the length of the strip scrubs the
  // whole 0:33 programme in one gesture.
  const scrubTo = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      const x = clientX - rect.left;
      // The last segment whose start sits at/left of x is the one under the
      // cursor.
      let i = 0;
      for (let k = 0; k < CLIPS.length; k++) {
        const g = trackGeom(k);
        if (g && x >= g.left) i = k;
      }
      const g = trackGeom(i);
      const p = g ? Math.max(0, Math.min(1, (x - g.left) / g.width)) : 0;
      paint(i, p);
      if (i === activeRef.current) {
        const v = videoRef.current;
        if (v && v.duration && isFinite(v.duration)) {
          try {
            v.currentTime = p * capTimeOf(CLIPS[i].duration, v.duration);
          } catch {
            /* not seekable yet */
          }
          scrubSeekRef.current = null;
        } else {
          // Element not decodable yet — remember the latest fraction for canplay.
          scrubSeekRef.current = p;
        }
      } else {
        scrubSeekRef.current = p;
        setActive(i);
      }
    },
    [paint, trackGeom],
  );

  // Coalesce pointer moves to one seek per frame — seeking on every raw move can
  // flood a decode; the head itself already moved inside scrubTo.
  const scheduleScrub = useCallback(
    (clientX: number) => {
      pendingXRef.current = clientX;
      if (scrubRafRef.current != null) return;
      scrubRafRef.current = requestAnimationFrame(() => {
        scrubRafRef.current = null;
        scrubTo(pendingXRef.current);
      });
    },
    [scrubTo],
  );

  const startScrub = useCallback(
    (clientX: number, pointerId: number) => {
      scrubbingRef.current = true;
      setScrubbing(true);
      suppressClickRef.current = true; // eat the click this press will emit
      resumeOnReadyRef.current = false;
      shouldPlayRef.current = true; // release always rolls it
      const v = videoRef.current;
      if (v) v.pause();
      setPlaying(false);
      try {
        surfaceRef.current?.setPointerCapture(pointerId);
      } catch {
        /* capture is best-effort */
      }
      scrubTo(clientX);
    },
    [scrubTo],
  );

  const endScrub = useCallback(() => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    setScrubbing(false);
    if (scrubRafRef.current != null) {
      cancelAnimationFrame(scrubRafRef.current);
      scrubRafRef.current = null;
    }
    shouldPlayRef.current = true;
    const v = videoRef.current;
    // Settled inside the active clip (its element is live-seeked and ready) →
    // roll now. If a boundary cross is still pending (scrubSeekRef set) or the
    // clip isn't decodable yet, let canplay seek the fresh element and resume,
    // so a release on the crossing frame never touches the outgoing clip.
    if (scrubSeekRef.current == null && v && v.duration && isFinite(v.duration)) {
      if (inViewRef.current) playActive();
    } else {
      resumeOnReadyRef.current = true;
    }
  }, [playActive]);

  // Run the readout loop only while actually playing.
  useEffect(() => {
    if (!playing) return;
    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, frame]);

  // Re-seat whenever the selected clip changes (also on first mount / resize so
  // the geometry-based playhead lands correctly once the rail has laid out).
  // Mid-scrub the head belongs to the pointer, so honour the carried fraction
  // instead of snapping the fresh clip back to its start.
  useEffect(() => {
    measureTracks();
    if (scrubbingRef.current) {
      paint(activeRef.current, scrubSeekRef.current ?? 0);
    } else {
      seatActive(active);
    }
    const onResize = () => {
      measureTracks();
      if (!scrubbingRef.current) seatActive(activeRef.current);
    };
    // The track labels are set in the mono face, so the rail's widths shift
    // when it swaps in. Re-measure once it has, or the cache would hold
    // fallback-font geometry for the rest of the session.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (cancelled) return;
      onResize();
    });
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [active, seatActive, paint, measureTracks]);

  // Fit the rate to the new clip after commit. Media events don't bubble, so
  // React binds them directly at commit — a cached clip can fire loadedmetadata
  // before that listener attaches and slip past onLoadedMetadata. Running here
  // means a clip whose metadata is already present gets its rate now; a clip
  // still loading is caught by the handler.
  useEffect(() => {
    syncRate();
  }, [active, syncRate]);

  // Channel-change tune-in: when the reel cuts to a DIFFERENT clip, hold a brief
  // CRT signal-change burst over the monitor, then roll the new footage part-way
  // through so it locks in as the static clears. Skipped on the first mount, mid
  // scrub (the drag owns the picture), and whenever motion is reduced.
  useEffect(() => {
    if (firstClipRef.current) {
      firstClipRef.current = false;
      return;
    }
    if (scrubbingRef.current) return;
    if (reduced) {
      setGlitching(false);
      return;
    }
    setGlitching(true);
    glitchTimers.current.forEach(clearTimeout);
    glitchTimers.current = [
      // Start the footage under the still-fading static so motion bleeds through.
      window.setTimeout(() => {
        if (shouldPlayRef.current && inViewRef.current) playActive();
      }, 370),
      // Clear the burst once the picture has locked in.
      window.setTimeout(() => setGlitching(false), 520),
    ];
    return () => {
      glitchTimers.current.forEach(clearTimeout);
      glitchTimers.current = [];
    };
  }, [active, reduced, playActive]);

  // Scroll gate: pause off screen, resume on return unless the viewer paused it
  // (and never yank the picture out from under a live scrub).
  useEffect(() => {
    inViewRef.current = inView;
    const v = videoRef.current;
    if (!v) return;
    if (!inView) {
      v.pause();
      setPlaying(false);
    } else if (shouldPlayRef.current && !reduced && !scrubbingRef.current) {
      playActive();
    }
  }, [inView, reduced, playActive]);

  // Tab visibility — same discipline as the footer clock: don't decode video
  // for a hidden tab.
  useEffect(() => {
    const onVis = () => {
      const v = videoRef.current;
      if (!v) return;
      if (document.hidden) {
        v.pause();
        setPlaying(false);
      } else if (
        inViewRef.current &&
        shouldPlayRef.current &&
        !reduced &&
        !scrubbingRef.current
      ) {
        playActive();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reduced, playActive]);

  // Metadata is enough to know the duration and honour a carried scrub fraction.
  const onLoadedMetadata = () => {
    syncRate();
    applyPendingSeek(false);
  };

  // The clip's own <video> is keyed, so selecting one mounts a fresh element
  // with its poster already showing; canplay fires once the new footage is
  // decodable and we start it if the intent is still to play — unless a burst or
  // an in-flight scrub is holding it, or a pending seek still needs applying.
  const onCanPlay = () => {
    syncRate();
    applyPendingSeek(true);
    if (resumeOnReadyRef.current) {
      resumeOnReadyRef.current = false;
      if (inViewRef.current) playActive();
      return;
    }
    if (scrubbingRef.current || glitchingRef.current) return;
    if (shouldPlayRef.current && inViewRef.current && !reduced) playActive();
  };

  // Reel behaviour: at the end of a clip, roll straight into the next and loop
  // back to the top after the last — so it plays through as one continuous reel
  // while the playhead marches across the whole timeline.
  const onEnded = () => {
    shouldPlayRef.current = true;
    setActive((a) => (a + 1) % CLIPS.length);
  };

  // Truncated clips (slot shorter than the file, e.g. Topograph) never reach the
  // native `ended` event, so cut to the next clip once the slot mark passes. The
  // pause guards against a second timeupdate advancing twice before the remount;
  // a live scrub pauses the element, so this stays quiet while dragging.
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || v.paused) return;
    const c = CLIPS[activeRef.current];
    if (v.duration && c.duration < v.duration && v.currentTime >= c.duration) {
      v.pause();
      onEnded();
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      shouldPlayRef.current = true;
      playActive();
    } else {
      shouldPlayRef.current = false;
      v.pause();
      setPlaying(false);
    }
  };

  // Discrete clip cue — keyboard (Enter/Space on a track) and touch taps. A
  // mouse press scrubs instead, and the click it leaves behind is swallowed.
  const selectClip = (i: number) => {
    if (i === active) {
      togglePlay();
      return;
    }
    shouldPlayRef.current = true;
    setActive(i);
    // No scrollIntoView any more: the cut sheet stacks, so every row is on
    // screen whenever the reel is. The old call existed to chase the active
    // track along a horizontally scrolling filmstrip, and left where it was it
    // would yank the PAGE each time a clip auto-advanced.
  };

  // Pointer scrubbing on the strip. Mouse always scrubs (press-to-seek + drag).
  // On touch a press has to stay ambiguous — the page still needs to scroll
  // past this section — so a touch scrub only starts from the playhead handle;
  // a tap on a segment falls through to the click handler and cues that clip.
  const onRailPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!railRef.current || !surfaceRef.current) return;
    suppressClickRef.current = false;
    const onHandle = !!(e.target as HTMLElement).closest("[data-playhead]");
    if (e.pointerType !== "mouse" && !onHandle) return;
    startScrub(e.clientX, e.pointerId);
  };

  const onRailPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    scheduleScrub(e.clientX);
  };

  return (
    <div id="reel" ref={sectionRef} className="relative mt-24 md:mt-28">
      {/* Sub-block header — the same quiet register the client ledger uses
          ("More shipped sites"): a label row over a hairline, then a headline
          a size down from the movement's, so the reel reads as part of the
          off-the-clock work rather than a stop of its own. */}
      <div className="flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-ink-faint">
        <span>Also in motion</span>
        <span className="font-numeral tracking-[0.2em]">
          {CLIPS.length.toString().padStart(2, "0")} clips ·{" "}
          <span className="tabular-nums">{tc(TOTAL)}</span>
        </span>
      </div>

      <div ref={headingRef} className="mt-4 border-t border-hairline pt-8">
        <h3 className="font-serif text-2xl font-bold leading-tight text-ink-strong sm:text-3xl md:text-4xl">
          <RevealLine>
            <span className="block">
              <SplitText text="Things that" as="span" />{" "}
              <SplitText
                text="move."
                as="span"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
              />
            </span>
          </RevealLine>
        </h3>
      </div>

      {/* ---- Program monitor -------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={headingInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-10"
      >
        {/* Soft hue bloom behind the screen, in the active clip's colour —
            the whole section quietly changes temperature as the reel plays. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] opacity-70 blur-3xl transition-[background] duration-700"
          style={{
            background: `radial-gradient(58% 58% at 50% 42%, ${clip.from}44, transparent 72%)`,
          }}
        />
        <div className="group relative aspect-video overflow-hidden rounded-2xl border border-hairline bg-black shadow-[0_50px_120px_-40px_rgba(0,0,0,0.85)]">
          <video
            key={clip.id}
            ref={videoRef}
            // Both the poster and the preload wait on `nearby`. A `poster` is
            // always fetched eagerly — it is not subject to lazy-loading — and
            // `preload="metadata"` still opens a range request against the
            // file, so between them the opener was pulling its still AND the
            // head of a multi-megabyte MP4 while the visitor was on the hero.
            // `nearby` has a screen-and-a-half of margin, so both land well
            // before the monitor is on screen; the black bg stands in until.
            poster={nearby ? clip.poster : undefined}
            muted={muted}
            playsInline
            preload={nearby ? "auto" : "none"}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={onEnded}
            onCanPlay={onCanPlay}
            onTimeUpdate={onTimeUpdate}
            className="absolute inset-0 h-full w-full object-cover"
          >
            {/* Phone-sized cut first: <source> is matched in order and the
                first `media` that applies wins, so ≤767px takes the 720p and
                everything else falls through to the master. Evaluated once at
                load, which is the right granularity here — a clip already
                playing shouldn't restart because a window got dragged. */}
            {clip.srcMobile && (
              <source
                src={clip.srcMobile}
                media="(max-width: 767px)"
                type="video/mp4"
              />
            )}
            <source src={clip.src} type="video/mp4" />
          </video>

          {/* Screen finish — faint scanlines, a corner vignette and the shared
              film grain, so the footage reads as a lit monitor, not a raw
              <video>. All decorative, all pointer-transparent. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 3px)",
            }}
          />
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-40" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(130% 130% at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)",
            }}
          />
          {/* Top sheen line — same material cue as the nav pill and cards. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"
          />

          {/* Channel-change tune-in — a dead-channel static burst held over the
              screen while the reel cuts to a new clip, fading as the footage
              locks in. Mounted only mid-change with motion allowed; sits above
              the picture + finish but below the header/controls, so the clip
              index and 0:00 timecode read as the new channel tuning in. */}
          {glitching && (
            <div
              aria-hidden
              className="reel-tune pointer-events-none absolute inset-0 overflow-hidden bg-black"
            >
              <div className="reel-snow absolute inset-0" />
              <div
                className="absolute inset-0 opacity-60 mix-blend-screen"
                style={{
                  background: `radial-gradient(75% 75% at 50% 45%, ${clip.from}66, transparent 70%)`,
                }}
              />
              <div className="reel-roll absolute inset-x-0 top-0" />
              <div className="reel-flash absolute inset-0 bg-white" />
            </div>
          )}

          {/* Header strip — clip index + title left, live timecode right. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span
                className="relative flex h-2 w-2 shrink-0"
                aria-hidden
              >
                <span
                  className={`absolute inset-0 rounded-full ${
                    playing ? "animate-pulse-dot" : ""
                  }`}
                  style={{ background: clip.from }}
                />
              </span>
              <span className="font-numeral text-[10px] tabular-nums tracking-[0.3em] text-white/60">
                {String(active + 1).padStart(2, "0")}
                <span className="text-white/30"> / {String(CLIPS.length).padStart(2, "0")}</span>
              </span>
              <span className="hidden font-serif text-sm font-semibold text-white/90 sm:inline">
                {clip.title}
              </span>
            </div>
            <span
              ref={tcRef}
              className="rounded-full bg-black/40 px-2.5 py-1 font-mono text-[10px] tabular-nums tracking-wider text-white/70 backdrop-blur-sm"
            >
              0:00 / {tc(clip.duration)}
            </span>
          </div>

          {/* Click-to-toggle overlay + centre transport. The button covers the
              whole screen so tapping the monitor plays/pauses; the icon only
              shows at rest or on hover so it never sits over the footage, and
              hides outright while a burst or a scrub owns the picture. */}
          <button
            type="button"
            data-cursor-hover
            onClick={togglePlay}
            aria-label={playing ? "Pause reel" : "Play reel"}
            className="absolute inset-0 flex items-center justify-center outline-none"
          >
            <span
              className={`grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-all duration-300 ${
                glitching || scrubbing
                  ? "scale-90 opacity-0"
                  : playing
                    ? "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                    : "scale-100 opacity-100"
              }`}
            >
              {playing ? (
                <Pause className="h-6 w-6" strokeWidth={1.5} />
              ) : (
                <Play className="ml-0.5 h-6 w-6" strokeWidth={1.5} />
              )}
            </span>
          </button>

          {/* Current-clip progress, welded to the bottom edge of the screen. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
            <div
              ref={monBarRef}
              className="h-full w-full origin-left"
              style={{
                transform: "scaleX(0)",
                background: `linear-gradient(90deg, ${clip.from}, ${clip.to})`,
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* ---- Timeline ---------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={headingInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8"
      >
        <div className="flex items-baseline justify-between gap-4 text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          <span>Timeline</span>
          <span className="font-mono tabular-nums tracking-normal">
            {tc(TOTAL)} · {CLIPS.length} clips
          </span>
        </div>

        {/* Timecode ruler — a tick on every cut, labelled with that clip's
            in-point, so the strip below reads as one 0:33 programme rather than
            four separate lengths.

            Ticks are placed by PERCENTAGE OF THE REEL, not as flex cells: a
            flex row needs a trailing cell for the final out-point, that cell is
            content-sized, and the width it takes comes out of the growing cells
            — which walked every tick progressively left of its own cut (‑3px by
            the second, ‑31px by the last). A percentage is the same number the
            segment widths are derived from, so the two cannot drift apart. */}
        {/* Ruler + strip share one positioned box so the playhead can span
            both: its marker parks in the ruler band, its line runs down the
            footage. This box is also the scrub surface — pressing the ruler
            seeks, the way it does in an editor. */}
        <div
          ref={surfaceRef}
          onPointerDown={onRailPointerDown}
          onPointerMove={onRailPointerMove}
          onPointerUp={endScrub}
          onPointerCancel={endScrub}
          onLostPointerCapture={endScrub}
          className={`relative mt-3 select-none ${
            scrubbing ? "cursor-grabbing" : "mouse:cursor-grab"
          }`}
        >
        <div
          aria-hidden
          className="relative h-4 font-mono text-[9px] tabular-nums text-ink-faint sm:text-[10px]"
        >
          {CLIPS.map((c, i) => (
            <span
              key={c.id}
              style={{ left: `${(STARTS[i] / TOTAL) * 100}%` }}
              className="absolute bottom-0 whitespace-nowrap border-l border-hairline pb-0.5 pl-1.5"
            >
              {tc(STARTS[i])}
            </span>
          ))}
          {/* Out-point of the reel: tick on the right edge, label to its left. */}
          <span className="absolute bottom-0 right-0 whitespace-nowrap border-r border-hairline pb-0.5 pr-1.5">
            {tc(TOTAL)}
          </span>
        </div>

        {/* The strip. One unbroken ribbon rather than four cards: segments butt
            together with no gaps and no rounded corners of their own, so the
            widths — flex-grow set to each clip's runtime — actually read as a
            cut list, and the played fill sweeps the whole 0:33 in one motion.
            Only the outer edge is rounded and stroked.

            The rail is the scrub surface: press and drag anywhere (mouse) or
            grab the head (touch) to seek, and it rolls again on release. */}
        {/* mt-2.5, not mt-1.5: the 10px band this opens between the ruler and
            the strip is where the playhead's marker sits, clear of both the
            tick labels above and the footage below. */}
        <div
          ref={railRef}
          className="relative mt-2.5 flex h-20 overflow-hidden rounded-md border border-hairline sm:h-24"
        >
          {CLIPS.map((c, i) => {
            const isActive = i === active;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  trackRefs.current[i] = el;
                }}
                type="button"
                data-cursor-hover
                onClick={() => {
                  // A mouse scrub leaves a trailing click — swallow it once so
                  // the press doesn't also re-cue the clip. Keyboard/touch taps
                  // fall through to the discrete cue.
                  if (suppressClickRef.current) {
                    suppressClickRef.current = false;
                    return;
                  }
                  selectClip(i);
                }}
                aria-label={`${isActive ? "Playing" : "Play"} ${c.title} — ${c.caption}`}
                aria-pressed={isActive}
                style={{ flexGrow: c.duration, flexBasis: 0 }}
                // The cut between clips is a single hairline, not a gap: a gap
                // would break the ribbon and put the proportional widths back
                // out of reach. first:border-l-0 keeps the strip's own edge
                // from doubling up with the outer border.
                className="group/seg relative min-w-0 overflow-hidden border-l border-hairline text-left outline-none first:border-l-0 focus-visible:z-10 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-indigo-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.poster}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  // Idle segments sit desaturated and dark so the ACTIVE clip is
                  // the only full-colour frame on the strip — the old version
                  // laid a flat black/45 scrim over every still equally, which
                  // muddied all four and made none of them the subject.
                  className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-[opacity,filter,transform] duration-500 ease-out-expo ${
                    isActive
                      ? "scale-100 opacity-100 saturate-100"
                      : "opacity-40 saturate-[0.25] group-hover/seg:scale-[1.04] group-hover/seg:opacity-75 group-hover/seg:saturate-100"
                  }`}
                />

                {/* Played fill — brightens the elapsed part of this segment. */}
                <span
                  ref={(el) => {
                    fillRefs.current[i] = el;
                  }}
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-full origin-left mix-blend-screen"
                  style={{
                    transform: "scaleX(0)",
                    background: `linear-gradient(90deg, ${c.from}44, ${c.to}44)`,
                  }}
                />

                {/* Label plate, bottom-left. Only a short gradient behind it
                    instead of a full-tile scrim, so it carries the text without
                    dimming the frame above it. The title hides on the narrowest
                    segments, where the index alone is the honest amount of
                    information the space can hold. */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline gap-1.5 p-2">
                  <span
                    className={`font-numeral text-[9px] tabular-nums tracking-[0.2em] transition-colors duration-300 ${
                      isActive ? "text-white" : "text-white/60"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={`hidden truncate font-serif text-[13px] font-semibold leading-none transition-colors duration-300 sm:block ${
                      isActive ? "text-white" : "text-white/70"
                    }`}
                  >
                    {c.title}
                  </span>
                </span>

                {/* Active segment's coloured underline — a lit edge on the cut
                    rather than a rim around a card. */}
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left transition-transform duration-500 ease-out-expo ${
                    isActive ? "scale-x-100" : "scale-x-0"
                  }`}
                  style={{
                    background: `linear-gradient(90deg, ${c.from}, ${c.to})`,
                  }}
                />
              </button>
            );
          })}

        </div>

        {/* Playhead — moved by transform each frame. Anchored to the strip's
            top (1.625rem = the h-4 ruler plus the strip's mt-2.5) and run to
            the bottom, so the line covers exactly the footage while the marker
            hangs above it in the open band. Living out here rather than inside
            the strip is what lets that marker exist at all: the strip clips,
            and any head placed on its top edge loses half itself to the crop.
            The line ignores pointer; a wider invisible handle around it is
            grabbable, and is the scrub grip on touch. */}
        <div
          ref={playheadRef}
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 top-[1.625rem] z-20 will-change-transform"
          style={{ transform: "translateX(0)" }}
        >
          <span
            data-playhead
            data-cursor-hover
            className={`pointer-events-auto absolute -left-2.5 -top-2.5 h-[calc(100%+0.625rem)] w-5 touch-none ${
              scrubbing ? "cursor-grabbing" : "cursor-grab"
            }`}
          />
          {/* A DARK soft shadow, not a white halo. The line only struggles
              where it crosses a bright frame, and there a dark spread separates
              it cleanly; over dark footage the same shadow is simply invisible,
              so the line stays a clean 1px hairline instead of the permanent
              white smear the original glow left on every still. White glow is
              reserved for the scrubbing state, where it means "live". */}
          <span
            className={`absolute inset-y-0 left-0 w-px bg-white transition-shadow duration-200 ${
              scrubbing
                ? "shadow-[0_0_4px_rgba(0,0,0,0.7),0_0_10px_2px_rgba(255,255,255,0.45)]"
                : "shadow-[0_0_4px_rgba(0,0,0,0.7)]"
            }`}
          />
          {/* Marker: a flat-topped wedge seated in the ruler band, its tip on
              the strip's top edge. Scales from the bottom so the tip stays
              pinned to that edge while it grows. */}
          <span
            className={`absolute -left-[6.5px] -top-2 h-2 w-[13px] origin-bottom bg-white transition-transform duration-200 ease-out-expo [clip-path:polygon(0_0,100%_0,50%_100%)] ${
              scrubbing ? "scale-125" : "scale-100"
            }`}
          />
        </div>
        </div>

        {/* Now playing — carries the active clip's title on phones, where the
            segments are too narrow to label, and its register everywhere. */}
        <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-ink-faint">
          <span
            className="h-1.5 w-1.5 shrink-0 rotate-45"
            style={{
              background: `linear-gradient(135deg, ${clip.from}, ${clip.to})`,
            }}
          />
          <span className="truncate">
            <span className="text-ink-subtle sm:hidden">{clip.title} · </span>
            <span className="text-ink-subtle">{clip.caption}</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
