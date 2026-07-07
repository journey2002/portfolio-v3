"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  useVelocity,
  useSpring,
  useMotionValue,
  useMotionTemplate,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";
import { Layers, PenTool, MousePointer2, type LucideIcon } from "lucide-react";
import SectionLabel from "@/components/ui/SectionLabel";
import SplitText from "@/components/ui/SplitText";
import { useMarqueeSlowOnHover } from "@/components/ui/useMarqueeSlowOnHover";
import { useTheme } from "@/components/ui/ThemeProvider";
import { usePointer } from "@/components/ui/PointerProvider";

const TICKER = [
  "Figma",
  "Photoshop",
  "Procreate",
  "Framer",
  "HTML & CSS",
  "JavaScript",
  "3D Art",
  "Illustrator",
  "After Effects",
];

const FEATURES = [
  {
    icon: Layers,
    label: "UX/UI Design",
    description:
      "Research, wireframes, and prototypes. I sweat the small stuff so the finished thing feels obvious to the people using it.",
    accent: "from-[rgb(var(--accent-1)/0.3)] to-transparent",
    hint: "Toolkit",
    tools: ["Figma", "HTML & CSS", "JavaScript"],
  },
  {
    icon: PenTool,
    label: "Digital Illustration",
    description:
      "Character art, fan art, and visual storytelling in Procreate and Photoshop, from first rough sketch to final render.",
    accent: "from-[rgb(var(--accent-2)/0.3)] to-transparent",
    hint: "Medium",
    tools: ["Procreate", "Photoshop", "Illustrator"],
  },
  {
    icon: MousePointer2,
    label: "Interaction Design",
    description:
      "Micro-interactions and motion prototypes that make an interface feel responsive, physical, and alive under your cursor.",
    accent: "from-[rgb(var(--accent-3)/0.3)] to-transparent",
    hint: "Motion",
    tools: ["Framer", "After Effects", "JavaScript"],
  },
];

// Per-chip cascade delays for the hover-IN stagger only. Static class strings
// (not an inline style) so Tailwind's compiler emits them AND so the delay is
// scoped to group-hover: on the way out the base state has no delay, letting
// every chip leave at once before the resting hint returns.
const CHIP_ENTER_DELAY = [
  "group-hover:delay-[60ms]",
  "group-hover:delay-[150ms]",
  "group-hover:delay-[240ms]",
];

const featureVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

// Feature items rise on a diagonal, alternating sides.
const featureItem = (i: number): Variants => ({
  hidden: { opacity: 0, y: 36, x: i % 2 === 0 ? -24 : 24, rotate: i % 2 === 0 ? -2 : 2 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    rotate: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
});

type Feature = {
  icon: LucideIcon;
  label: string;
  description: string;
  accent: string;
  /** Resting one-word hint above the tool chips — unique per discipline. */
  hint: string;
  tools: string[];
};

// A card of matte metal with a polished glass edge, under a fixed studio
// light. The face stays dark and matte; the light lives in two places that
// both answer to the tilt alone — nothing chases the cursor: a crisp white
// glare that slides along the rim to whichever edge rises toward the light,
// and a soft diagonal sheen that skims across the face as the card rocks.
// The motion is intentionally slow and a little heavy so hovering feels calm
// rather than twitchy, and the content layers lift gently toward the eye.
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  // The rim/face reflection is a white studio light on dark, but a white glare
  // is invisible on the light theme's white card — so on light it becomes a
  // brand-purple light (indigo→violet). Only the colours change; the geometry,
  // tilt response and ramps below are shared. The theme-varying colours are fed
  // into the motion templates as interpolated strings (they update on toggle,
  // and any stale frame self-corrects on the next pointer move — hover-only).
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Tilt is a hover effect — on touch, the pointermove a tap fires would just
  // jolt the card, so the handlers no-op without a fine pointer.
  const pointer = usePointer();
  const tiltEnabled = !!pointer?.enabled;

  // Pointer position within the card, normalised to -0.5..0.5.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Gentle tilt — a soft, slightly heavy spring smooths small cursor movements
  // instead of snapping the card around.
  const spring = { stiffness: 110, damping: 26, mass: 1.1 };
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), spring);

  // ---- Reflection, modelled on a FIXED studio light above the viewer — the
  // card tilts beneath it. Nothing tracks the cursor: every value below
  // derives purely from the tilt springs, so the light glides toward
  // whichever side RISES (opposite the cursor), the way a real card flashes
  // when you rock it. Two light layers ride on this — a crisp glare on the
  // glass rim and a soft sheen across the matte face.
  // `lightPos*` marks where the light sits (ON the rising rim) and `lightA`
  // is the overall tilt strength (0 at rest → 1), so every layer fades to
  // nothing when the card is flat and the response stays continuous through
  // corners — no quadrant switching.
  // The position uses a NARROW, clamped input range (±3.5° rather than the
  // full ±6°) so the hot spot localises to the rising edge after only a small
  // cursor move. The range lands the centre exactly ON the rim (0 / 100), NOT
  // past it — so the gradient's white core sits at the MIDDLE of the glare
  // (its single brightest point) and falls off along the rim from there.
  // Overshooting past the rim is what made the edge read evenly bright before:
  // a whole stretch of rim then sat at the same distance from an off-edge
  // centre, so it all lit to the same value. TWEAK: nudge 0 / 100 outward
  // (e.g. -4 / 104) for a softer, more spread peak; widen ±3.5 toward ±6 to
  // localise more slowly.
  const lightPosX = useTransform(rotateY, [-3.5, 3.5], [100, 0], { clamp: true });
  const lightPosY = useTransform(rotateX, [-3.5, 3.5], [0, 100], { clamp: true });
  // Strength ramps in fast and early via a sqrt curve, so even a small rock
  // near centre lights the edge (no need to swing the cursor to the far side)
  // while it still keeps climbing across the rest of the range. TWEAK: smaller
  // divisor = even more reactive near centre; drop the sqrt for a linear ramp.
  const lightA = useTransform([rotateX, rotateY], ([rx, ry]: number[]) =>
    Math.min(1, Math.sqrt(Math.hypot(rx, ry) / 5)),
  );

  // How FAR the cursor is from the middle (0 at centre → 1 at the corners).
  // Climbs linearly across the WHOLE range (÷7), unlike lightA which saturates
  // early, so it can keep pushing the edge glare's glow brighter and wider as
  // the cursor nears the edge — past the point where the base opacity has
  // already maxed out. TWEAK: smaller divisor = ramps to full glow sooner.
  const edgeBoost = useTransform([rotateX, rotateY], ([rx, ry]: number[]) =>
    Math.min(1, Math.hypot(rx, ry) / 7),
  );

  // Glass glare — the crisp specular hot spot that slides along the rim to
  // the edge facing the light. A radial whose centre rides just past the
  // rising rim, MASKED to the 1px border ring (in the markup) so it can only
  // ever paint the edge, never the face. The core is white; the
  // blue→cyan→violet accent lives in the falloff, so the lit point reads as a
  // real reflection on glass rather than a saturated colour ring, and it
  // fades to nothing around the rest of the rim.
  // TWEAK: a SMOOTH many-stop falloff so the glare eases from a white core at
  // the middle of the lit segment down to nothing at both ends — a soft bell
  // along the rim, not a stiff core-plus-drop. Each stop steps down gently
  // (~0.1 at a time, evenly spaced 0→96%) so there are no hard transitions.
  // The "64% 64%" size = how far the bell spreads along the rim (bigger =
  // softer/wider); lightA * 1.6 = brightness ramp.
  const glareOpacity = useTransform(lightA, (a) => Math.min(1, a * 1.6));
  // Falloff stops: a near-white hot core easing through icy blue on dark; a
  // bright violet core easing into saturated indigo→violet on light.
  const glareStops = isLight
    ? "rgba(243,240,255,1) 0%, rgba(237,233,254,0.98) 6%, rgba(221,214,254,0.86) 15%, rgba(196,181,253,0.7) 26%, rgba(167,139,250,0.55) 37%, rgba(139,92,246,0.4) 48%, rgba(124,58,237,0.27) 60%, rgba(124,58,237,0.15) 72%, rgba(139,92,246,0.06) 84%, transparent 96%"
    : "rgba(255,255,255,1) 0%, rgba(255,255,255,1) 6%, rgba(245,249,255,0.9) 15%, rgba(222,233,255,0.74) 26%, rgba(198,216,255,0.57) 37%, rgba(178,198,253,0.41) 48%, rgba(163,180,249,0.27) 60%, rgba(154,167,246,0.15) 72%, rgba(150,160,245,0.06) 84%, transparent 96%";
  const glare = useMotionTemplate`radial-gradient(64% 64% at ${lightPosX}% ${lightPosY}%, ${glareStops})`;
  // The same glare on a blurred layer behind the card, so the lit edge spills
  // more light past the rim into the dark — directional, never a centred blob
  // (the mask pins it to the rising edge; tilt gates it away at rest).
  const glareSpill = useTransform([lightA, edgeBoost], ([a, e]: number[]) =>
    Math.min(1, a * 1.3) * (0.62 + e * 0.33),
  );

  // The glare's bloom (applied as the layer's filter in the markup) — the wide
  // outer halo grows brighter AND wider with edgeBoost, so the edge glare
  // glows hardest when the cursor is far from the middle, where the base
  // opacity has already saturated. TWEAK: the 0.38 / 38 bases = glow near
  // centre; the `* e` terms = how much extra glow builds toward the edge.
  const glareGlowA = useTransform(edgeBoost, (e) => 0.55 + e * 0.4);
  const glareGlowPx = useTransform(edgeBoost, (e) => 42 + e * 34);
  // The two tight inner shadows are static; the wide outer bloom carries the
  // motion values. Violet bloom on light, icy-white on dark.
  const glowInner = isLight
    ? "drop-shadow(0 0 6px rgba(196,181,253,0.95)) drop-shadow(0 0 22px rgba(139,92,246,0.7))"
    : "drop-shadow(0 0 6px rgba(255,255,255,1)) drop-shadow(0 0 22px rgba(210,230,255,0.9))";
  const glowBloomRGB = isLight ? "124,58,237" : "190,212,255";
  const glareGlow = useMotionTemplate`${glowInner} drop-shadow(0 0 ${glareGlowPx}px rgba(${glowBloomRGB},${glareGlowA}))`;

  // Prism dispersion — past a certain tilt the lit edge splits the light into
  // a faint spectrum, the way a glass/crystal edge throws a rainbow when it
  // catches the light at the right angle. A spectral radial sharing the
  // glare's position (so the rainbow fans along the rim out of the hot spot),
  // masked to the rim and SCREEN-blended so it reads as glowing light, not
  // paint. It ramps in from a LOW threshold so it already shows when the
  // cursor is near the MIDDLE of the card (only a little tilt), not just out at
  // the edge — yet it's still 0 at dead centre, so it isn't permanently on
  // (the old always-on conic ring is exactly what this avoids). TWEAK: the
  // first number in (m - 1.2) / 3.3 = how near the middle it starts (lower =
  // nearer the centre, 0 = always on); the per-stop alphas in `prism` = how
  // vivid the spectrum is. A full ROYGBIV runs through the falloff.
  const prismA = useTransform([rotateX, rotateY], ([rx, ry]: number[]) =>
    Math.min(1, Math.max(0, (Math.hypot(rx, ry) - 1.2) / 3.3)),
  );
  const prism = useMotionTemplate`radial-gradient(80% 80% at ${lightPosX}% ${lightPosY}%, transparent 18%, rgba(255,90,110,0.32) 28%, rgba(255,160,80,0.28) 35%, rgba(255,232,110,0.26) 42%, rgba(130,240,150,0.26) 50%, rgba(96,206,255,0.3) 58%, rgba(128,140,255,0.3) 65%, rgba(210,120,255,0.34) 73%, transparent 88%)`;

  // Glass glint — a THIN soft lip beneath the glare, a gentle gradient on the
  // rising side. An INSET box-shadow hugs the rounded border by construction,
  // so it can never leak onto the face. TWEAK: glintA = strength of the lip;
  // the 1.3 offset = how far it travels around the rim with tilt; the blur
  // radii (9px / 14px) below = how THICK the lip reads — raise them to thicken.
  const glintOffX = useTransform(rotateY, (v) => v * 1.3);
  const glintOffY = useTransform(rotateX, (v) => -v * 1.3);
  const glintA = useTransform(lightA, (a) => a * 0.32);
  const glintIce = useTransform(lightA, (a) => a * 0.18);
  const glintRGB = isLight ? "167,139,250" : "255,255,255";
  const glintIceRGB = isLight ? "139,92,246" : "186,224,255";
  const glintShadow = useMotionTemplate`inset ${glintOffX}px ${glintOffY}px 9px -6px rgba(${glintRGB},${glintA}), inset ${glintOffX}px ${glintOffY}px 14px -8px rgba(${glintIceRGB},${glintIce})`;

  // Inner edge glow — a soft glass glow hugging the INSIDE of the rim. It
  // lives on the hover layer (gone at rest) and its strength rides the tilt
  // (lightA), so it blooms in as you hover and brightens dynamically as you
  // move — never static. TWEAK: the 0.07 base = glow just from hovering; the
  // a * 0.18 term = how much it brightens with tilt; the 24px blur = how soft
  // and deep it reaches inward.
  const innerGlowA = useTransform(lightA, (a) => 0.07 + a * 0.18);
  const innerGlowRGB = isLight ? "167,139,250" : "206,224,255";
  const innerGlow = useMotionTemplate`inset 0 0 24px -6px rgba(${innerGlowRGB},${innerGlowA})`;

  // Face sheen — a soft diagonal streak of light skimming the surface
  // (replacing the old radial pool). The gradient itself is FIXED; the streak
  // is slid and tipped with pure transforms — cheap, no per-frame repaint —
  // so it sweeps across the face as the card rocks. A radial mask (in the
  // markup) fades its ends so it reads as a streak, brightest in the middle,
  // not a hard bar. TWEAK: the 0.12 alpha in the gradient (markup below) =
  // sheen brightness; the sheenX/Y ranges below = how far it travels with
  // tilt (bigger = more reactive); sheenOpacity's a-term = tilt response.
  const sheenX = useTransform(rotateY, [-6, 6], [26, -26]);
  const sheenY = useTransform(rotateX, [-6, 6], [-26, 26]);
  const sheenRotate = useTransform(rotateY, [-6, 6], [6, -6]);
  const sheenOpacity = useTransform(lightA, (a) => 0.5 + a * 0.5);
  // The diagonal face streak: a white skim on dark, a violet skim on light.
  const faceSheen = isLight
    ? "linear-gradient(116deg, transparent 34%, rgba(139,92,246,0.16) 50%, transparent 66%)"
    : "linear-gradient(116deg, transparent 34%, rgba(255,255,255,0.12) 50%, transparent 66%)";

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !tiltEnabled) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    px.set(nx - 0.5);
    py.set(ny - 0.5);
  }

  function handleLeave() {
    px.set(0);
    py.set(0);
  }

  const Icon = feature.icon;

  return (
    <motion.div
      variants={featureItem(index)}
      className="group relative [perspective:1100px]"
    >
      {/* Outer spill — the rim glare on a blurred layer behind the card, so
          the lit edge throws a little light past the rim into the dark.
          Directional (masked to the rising edge), never a centred blob.
          Hover-only. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-lg transition-opacity duration-500 ease-out group-hover:opacity-100"
      >
        <motion.div
          style={{
            background: glare,
            opacity: glareSpill,
            padding: "2px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
          }}
          className="absolute inset-0 rounded-2xl"
        />
        {/* Prism spill — the same dispersion thrown OUTSIDE the rim on the
            blurred layer, so the spectrum glows out past the edge where the
            glare is. Screen-blended, steep-angle only (shares prismA). */}
        <motion.div
          aria-hidden
          style={{
            background: prism,
            opacity: prismA,
            padding: "3px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            mixBlendMode: "screen",
          }}
          className="absolute inset-0 rounded-2xl"
        />
      </div>
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative flex h-full flex-col gap-5 rounded-2xl border border-hairline bg-[var(--feature-card)] p-7 backdrop-blur-xl transition-colors duration-500 group-hover:border-[var(--feature-border-hover)]"
      >
        {/* Surface finish — the matte-metal layers, clipped to the rounded
            card. overflow-hidden lives here (not on the card) so the card
            keeps its preserve-3d context and the content can still lift
            toward the viewer. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        >
          {/* Resting accent wash — keeps each card's colour identity */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-30`}
          />
          {/* Metallic volume — the faintest vertical shading toward the base.
              No white light on the face: the surface stays truly matte at rest
              so all of the glass lives on the hover layers. */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] via-transparent to-[var(--feature-shade)]" />
          {/* Corner vignette — edges fall gently into shadow so the face
              reads as a solid sheet, not a flat digital fill. */}
          <div className="absolute inset-0 bg-[radial-gradient(150%_140%_at_50%_55%,transparent_52%,var(--feature-vignette)_100%)]" />
          {/* Matte micro-grain — fine noise that takes the gloss off the
              surface; per-card seed so the sheets aren't clones. */}
          <div
            className="absolute inset-0 opacity-[0.1] mix-blend-soft-light"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='180'%20height='180'%3E%3Cfilter%20id='m'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='1.25'%20numOctaves='2'%20seed='${2 + index * 9}'%20stitchTiles='stitch'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23m)'/%3E%3C/svg%3E")`,
            }}
          />
          {/* Face sheen — a soft diagonal streak skimming the surface, swept
              across the face by the tilt. Clipped & rounded by this
              overflow-hidden wrapper; sits behind the content. */}
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100">
            <motion.div
              aria-hidden
              style={{
                x: sheenX,
                y: sheenY,
                rotate: sheenRotate,
                opacity: sheenOpacity,
                backgroundImage: faceSheen,
                WebkitMaskImage:
                  "radial-gradient(62% 78% at 50% 50%, #000 28%, transparent 80%)",
                maskImage:
                  "radial-gradient(62% 78% at 50% 50%, #000 28%, transparent 80%)",
              }}
              className="absolute -inset-1/3"
            />
          </div>
        </div>
        {/* Glass edge — the rim light, all of it tilt-driven (the hover fade
            sits on this wrapper). Two layers, masked/welded to the border so
            they can never touch the matte face: a wide soft glint lip on the
            rising side, and a crisp white glare that slides to the edge
            facing the light. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
        >
          {/* Inner edge glow — a soft glass glow hugging the inside of the
              rim; blooms in on hover and brightens with tilt (gone at rest). */}
          <motion.div
            aria-hidden
            style={{ boxShadow: innerGlow }}
            className="absolute inset-0 rounded-2xl"
          />
          {/* Glint — the wide, soft lip on the rising-side rim. An inset
              box-shadow follows the rounded corners and stays welded to the
              edge, so there is no radial centre to leak onto the face. */}
          <motion.div
            style={{ boxShadow: glintShadow }}
            className="absolute inset-0 rounded-2xl"
          />
          {/* Glare — the specular hot spot: a smooth bell of light on the rim,
              brightest where it meets the light, masked to the 1px ring so it
              never touches the face. Three stacked drop-shadows make the bright
              middle GLOW — a tight white hot core, a soft icy halo, and a wide
              faint outer bloom that radiate from the brightest point onto the
              surface and out past the rim (the bell profile keeps the glow
              concentrated at the middle, not the dim ends). The outer bloom
              grows brighter and wider as the cursor leaves the middle, so the
              edge glow is hottest near the edge — see `glareGlow` to tune. */}
          <motion.div
            style={{
              background: glare,
              opacity: glareOpacity,
              padding: "1px",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              filter: glareGlow,
            }}
            className="absolute inset-0 rounded-2xl"
          />
          {/* Prism dispersion — a faint spectrum fanning along the rim out of
              the hot spot, SCREEN-blended so it glows; opens up only at a
              steep tilt, so it flashes when the card catches a certain angle. */}
          <motion.div
            aria-hidden
            style={{
              background: prism,
              opacity: prismA,
              padding: "2px",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              mixBlendMode: "screen",
            }}
            className="absolute inset-0 rounded-2xl"
          />
        </div>
        {/* Soft highlight skimming the top edge — diffuse, not a glossy line */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--feature-sheen)] to-transparent opacity-0 blur-[1px] transition-opacity duration-700 group-hover:opacity-100"
        />

        {/* Index */}
        <span className="text-[10px] uppercase tracking-[0.4em] text-ink-faint transition-transform duration-700 ease-out group-hover:[transform:translateZ(12px)]">
          0{index + 1}
        </span>

        {/* Icon — lifts furthest toward the viewer */}
        <div className="w-fit transition-transform duration-700 ease-out group-hover:[transform:translateZ(42px)]">
          <Icon
            className="h-7 w-7 text-indigo-accent transition-transform duration-500 group-hover:scale-110"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="font-serif text-2xl font-semibold text-ink-strong transition-transform duration-700 ease-out group-hover:[transform:translateZ(30px)]">
          {feature.label}
        </h3>
        <p className="text-sm leading-relaxed text-ink-muted transition-transform duration-700 ease-out group-hover:[transform:translateZ(16px)]">
          {feature.description}
        </p>

        {/* Footer zone — the resting hint and the tool chips share ONE grid
            cell (both pinned to row/col 1), so the cell always reserves the
            chips' full, wrapping height. At rest the space is simply held open
            beneath the hint; on hover the chips fill it. The chips can never
            overflow upward into the description the way the old fixed-height
            absolute box let them. */}
        <div className="mt-2 grid [transform-style:preserve-3d]">
          {/* Resting hint — kept to its own height so it sits at the top of the
              reserved zone rather than stretching across it. */}
          <span className="col-start-1 row-start-1 flex h-fit items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-ink-faint transition-all duration-300 delay-300 group-hover:-translate-y-1 group-hover:opacity-0 group-hover:delay-0 touch:hidden">
            <span className="block h-px w-6 bg-current" />
            {feature.hint}
          </span>
          {/* Tool chips that cascade up on hover — this layer defines the
              cell's height, so the description above is always clear of it. */}
          <div className="col-start-1 row-start-1 flex flex-wrap content-start items-start gap-2 [transform-style:preserve-3d]">
            {feature.tools.map((tool, t) => (
              <span
                key={tool}
                // touch: shows the chips at rest — hover never fires there, and
                // the tool names are real content, not a flourish.
                className={`inline-flex translate-y-3 items-center gap-2 rounded-full border border-indigo-accent/30 bg-[var(--feature-chip)] px-3 py-1 text-[11px] font-medium tracking-wide text-ink opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-hover:duration-700 group-hover:[transform:translateY(0)_translateZ(30px)] touch:translate-y-0 touch:opacity-100 ${CHIP_ENTER_DELAY[t] ?? ""}`}
              >
                <span className="h-1 w-1 rotate-45 bg-accent-gradient" />
                {tool}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Stack() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: "-10%" });
  const gridInView = useInView(gridRef, { once: true, margin: "-10%" });

  // Velocity-aware marquee — fast scroll skews it, fast scrolling reverses it.
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  // Convert velocity to a small skew (px/s → deg).
  const skew = useTransform(smoothVelocity, [-2000, 0, 2000], [-12, 0, 12], {
    clamp: true,
  });
  // Direction multiplier — flipped briefly while scrolling fast in reverse.
  const directionRef = useRef(1);
  useMotionValueEvent(smoothVelocity, "change", (v) => {
    if (v < -50) directionRef.current = -1;
    else if (v > 50) directionRef.current = 1;
  });

  // Section-level parallax for the marquee strip — it slides slightly faster
  // than scroll, giving the impression of depth behind the feature grid.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const marqueeX = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  const marqueeHoverRef = useMarqueeSlowOnHover<HTMLDivElement>();

  return (
    <section
      id="stack"
      ref={sectionRef}
      className="relative overflow-hidden py-32 md:py-44"
    >
      <SectionLabel index="03" caption="Skills" align="right" />

      <div className="relative mx-auto max-w-7xl px-6 sm:px-10">
        <div className="grid grid-cols-12 items-end gap-6">
          <motion.div
            ref={headingRef}
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="col-span-12 sm:col-span-8"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-ink-subtle">
              <span className="text-ink">[03]</span> &nbsp; Skills &amp;
              tools
            </p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight text-ink-strong sm:text-5xl md:text-6xl">
              <SplitText
                text="A toolkit"
                as="span"
                className="block"
                immediate={false}
                stagger={0.025}
                fromY={42}
              />
              <SplitText
                text="for craft."
                as="span"
                className="block"
                charClassName="bg-accent-gradient bg-clip-text text-transparent"
                immediate={false}
                stagger={0.03}
                delay={0.12}
                fromY={42}
                fromRotate={-3}
              />
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={headingInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="col-span-12 hidden text-right text-[10px] uppercase tracking-[0.35em] text-ink-faint sm:col-span-4 sm:block"
          >
            ↳ 09 tools · 03 disciplines
          </motion.div>
        </div>
      </div>

      {/* Velocity-skewed marquee. The parallax x-shift rides the inner skewed
          track (below), NOT this container — otherwise the edge-fade overlays
          slide left with the strip and the left edge loses its fade. This
          container stays put so both fades stay welded to the visible edges. */}
      <div
        ref={marqueeHoverRef}
        className="relative mt-16 flex overflow-hidden border-y border-hairline py-8"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-40 bg-gradient-to-r from-night via-night/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-40 bg-gradient-to-l from-night via-night/80 to-transparent" />
        <motion.div
          style={{ skewX: skew, x: marqueeX }}
          className="flex w-full origin-center"
        >
          <div className="animate-marquee flex shrink-0 items-center">
            <div className="flex shrink-0 items-center gap-14 pr-14">
              {TICKER.map((item) => (
                <span
                  key={item}
                  className="inline-flex shrink-0 items-center gap-14 font-serif text-3xl font-medium text-ink-faint transition-colors duration-200 hover:text-ink-strong sm:text-4xl md:text-5xl"
                >
                  {item}
                  <span className="h-1.5 w-1.5 rotate-45 bg-accent-gradient" />
                </span>
              ))}
            </div>
            <div
              aria-hidden
              className="flex shrink-0 items-center gap-14 pr-14"
            >
              {TICKER.map((item) => (
                <span
                  key={`${item}-dup`}
                  className="inline-flex shrink-0 items-center gap-14 font-serif text-3xl font-medium text-ink-faint transition-colors duration-200 hover:text-ink-strong sm:text-4xl md:text-5xl"
                >
                  {item}
                  <span className="h-1.5 w-1.5 rotate-45 bg-accent-gradient" />
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Feature grid */}
      <motion.div
        ref={gridRef}
        variants={featureVariants}
        initial="hidden"
        animate={gridInView ? "show" : "hidden"}
        className="relative mx-auto mt-20 grid max-w-7xl grid-cols-1 gap-6 px-6 sm:px-10 lg:grid-cols-3"
      >
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.label} feature={feature} index={i} />
        ))}
      </motion.div>
    </section>
  );
}
