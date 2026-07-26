/**
 * Re-encodes everything in public/ that ships to a visitor, at settings chosen
 * to be visually transparent — same frames, same pixels at the size they're
 * actually rendered, a fraction of the bytes.
 *
 * Two rules make this safe to re-run:
 *
 *  1. Outputs are NEVER written over their source. `/assets` and `/clients`
 *     are served with a long immutable cache and their names are not
 *     content-hashed by Next, so an in-place edit would be invisible to
 *     visitors holding a cached copy (see the headers block in
 *     next.config.mjs). Every output therefore lands as
 *     `<name>.<hash8>.<ext>`, where the hash covers the source bytes AND the
 *     recipe below — change either and the filename changes with it.
 *
 *  2. The hash is deterministic, so a second run produces the same names and
 *     skips work that's already done. Pass --force to re-encode anyway.
 *
 * Every job is verified before it counts: each output is compared against its
 * source with ffmpeg's SSIM filter, measured at the size the asset is really
 * displayed, and anything below SSIM_FLOOR fails the run loudly rather than
 * quietly shipping a degraded asset.
 *
 * Usage:  npm run optimize:media  [-- --force] [--only=chair,turrain_map]
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const ONLY = (args.find((a) => a.startsWith("--only=")) || "").slice(7);

// Below this, the re-encode is visibly lossy and the run should fail. 0.99 is
// well inside "nobody can tell" for the CRF/quality levels used here; the
// floor exists to catch a broken recipe, not to fine-tune quality.
const SSIM_FLOOR = 0.98;

/* ------------------------------------------------------------------ */
/* Jobs                                                                */
/* ------------------------------------------------------------------ */

/**
 * Video — remux only, never re-encode.
 *
 * This started out as an H.264 re-encode at CRF 18 and the numbers killed it:
 * every clip came back BIGGER than its source, because these files are already
 * competently encoded and CRF 18 simply targets a higher quality than they
 * were made at. Sweeping upward didn't rescue it either — at the point where
 * the bytes finally came down (CRF 25+) SSIM was through the floor, because
 * re-compressing an already-compressed stream is pure generation loss:
 *
 *        turrain_map        move2               tube_ball_bounce
 *   22   -2%  SSIM 0.989    +32% SSIM 0.985     -11% SSIM 0.990
 *   25   -28% SSIM 0.980    +8%  SSIM 0.980     -35% SSIM 0.986
 *   28   -49% SSIM 0.966    -14% SSIM 0.967     -52% SSIM 0.980
 *
 * So the codec isn't where the waste is. The waste is structural, and both
 * fixes below are stream copies — bit-identical frames, just fewer of them or
 * better arranged:
 *
 *  · `trim` cuts a file to the length the site can actually reach. Topograph
 *    is a 20.9s file in a 10s slot, and Reel truncates it there on timeupdate
 *    while the scrub cap is min(slot, duration) — so its back half cannot be
 *    reached by playing OR by dragging. That half is ~15 MB of pure dead
 *    weight, and dropping it costs literally nothing on screen. It's trimmed
 *    to 10.5s rather than 10s deliberately: the truncation branch is
 *    `slot < duration`, so a file of exactly 10s would fall through to the
 *    native `ended` event instead and change which code path advances the reel.
 *
 *  · `-movflags +faststart` moves the index to the front of the file so the
 *    browser can begin playing before the whole thing has landed. Only
 *    tube_ball_bounce lacks it (its moov atom sits at the end); everything
 *    else was already muxed this way.
 *
 * Audio goes too. It's never audible — the reel's mute control is never
 * rendered and About's plates carry the `muted` attribute — and only these two
 * files still carry a track.
 *
 * move1, move2, Donut and Forager are deliberately absent: already faststart,
 * already silent, nothing to trim, and nothing a re-encode can win.
 */
const VIDEO_JOBS = [
  { file: "assets/turrain_map.mp4", trim: 10.5 },
  { file: "assets/tube_ball_bounce.mp4" },
];

/**
 * Images. `renderWidth` is the widest CSS pixel width the asset is ever
 * painted at, taken from the class lists at the call site; outputs are sized
 * to 2x that (retina) and quality is measured after downscaling both sides to
 * it, because that's the only comparison a visitor could ever make.
 *
 * The hero cards are the extreme case — 1361px and 1048px masters rendered
 * inside a 112px-wide card.
 */
const IMAGE_JOBS = [
  {
    file: "assets/chair.png",
    // w-20 / lg:w-24 / xl:w-28 → 112px, times the 1.6x hover punch-in ceiling.
    renderWidth: 180,
    width: 512,
    format: "webp",
    webp: { quality: 92, alphaQuality: 100, effort: 6 },
  },
  {
    file: "assets/donut.png",
    renderWidth: 180,
    width: 512,
    format: "webp",
    webp: { quality: 92, alphaQuality: 100, effort: 6 },
  },
  // Client screenshots: full-page captures at 1440 wide, shown in frames up to
  // ~1200 CSS px, so the width stays — 1440 is barely 2x DPR at the ledger's
  // full-bleed peek and downscaling would soften them on retina. Only the
  // encoder changes: mozjpeg at q78 instead of the canvas toDataURL q84 that
  // scripts/capture-clients.mjs emits. They stay JPEG rather than moving to
  // WebP because lossy WebP forces 4:2:0 chroma, and these are dense with
  // coloured text where that shows up as fringing.
  ...["jijistudio", "pokebowl", "juliaparis", "olara", "quatrequarts"].map(
    (id) => ({
      file: `clients/${id}.jpg`,
      renderWidth: 1440,
      format: "jpeg",
      jpeg: { mozjpeg: true, quality: 78 },
    }),
  ),
];

/* ------------------------------------------------------------------ */
/* Plumbing                                                            */
/* ------------------------------------------------------------------ */

const ff = (fnArgs) =>
  spawnSync(ffmpegPath, ["-hide_banner", "-nostdin", ...fnArgs], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
const size = (p) => fs.statSync(p).size;

/** Name an output from the source bytes plus the recipe that produced it. */
function hashedName(srcPath, recipe, ext) {
  const h = createHash("sha256")
    .update(fs.readFileSync(srcPath))
    .update(JSON.stringify(recipe))
    .digest("hex")
    .slice(0, 8);
  const base = path.basename(srcPath, path.extname(srcPath));
  return `${base}.${h}${ext}`;
}

/**
 * SSIM between two media files, optionally scaled to a common width first.
 * Returns the "All" figure ffmpeg reports (1.0 is identical).
 */
function ssim(refPath, testPath, { width, refTrim } = {}) {
  const chain = width
    ? `[0:v]scale=${width}:-2:flags=lanczos,format=yuv420p[a];` +
      `[1:v]scale=${width}:-2:flags=lanczos,format=yuv420p[b];[a][b]ssim`
    : `[0:v]format=yuv420p[a];[1:v]format=yuv420p[b];[a][b]ssim`;

  const r = ff([
    ...(refTrim ? ["-t", String(refTrim)] : []),
    "-i",
    refPath,
    "-i",
    testPath,
    "-lavfi",
    chain,
    "-f",
    "null",
    "-",
  ]);
  const m = r.stderr.match(/All:\s*([0-9.]+)/);
  return m ? Number(m[1]) : NaN;
}

const results = [];
const failures = [];
const wanted = (file) =>
  !ONLY || ONLY.split(",").some((n) => path.basename(file).includes(n));

/* ------------------------------------------------------------------ */
/* Video                                                               */
/* ------------------------------------------------------------------ */

for (const job of VIDEO_JOBS) {
  if (!wanted(job.file)) continue;
  const src = path.join(publicDir, job.file);
  if (!fs.existsSync(src)) {
    failures.push(`${job.file}: source missing`);
    continue;
  }

  const recipe = { kind: "remux", trim: job.trim ?? null, v: 2 };
  const outName = hashedName(src, recipe, ".mp4");
  const out = path.join(path.dirname(src), outName);

  if (fs.existsSync(out) && !FORCE) {
    console.log(`· ${job.file} → ${outName} (up to date)`);
    results.push({ from: job.file, to: outName, before: size(src), after: size(out) });
    continue;
  }

  console.log(`▸ remuxing ${job.file} …`);
  const enc = ff([
    "-y",
    ...(job.trim ? ["-t", String(job.trim)] : []),
    "-i",
    src,
    "-an",
    // The whole point: copy the encoded video stream through untouched.
    "-c:v",
    "copy",
    "-movflags",
    "+faststart",
    out,
  ]);
  if (enc.status !== 0) {
    failures.push(`${job.file}: ffmpeg exited ${enc.status}\n${enc.stderr.slice(-800)}`);
    continue;
  }

  // A stream copy must come back exactly identical. Anything less means the
  // copy silently re-encoded (or the trim landed badly) and needs looking at.
  const score = ssim(src, out, { refTrim: job.trim });
  const line = { from: job.file, to: outName, before: size(src), after: size(out), ssim: score };
  results.push(line);
  if (!(score >= 0.9999)) {
    failures.push(`${job.file}: stream copy is not lossless (SSIM ${score})`);
  }
  console.log(
    `  ${mb(line.before)} → ${mb(line.after)}  (SSIM ${score.toFixed(4)})`,
  );
}

/* ------------------------------------------------------------------ */
/* Images                                                              */
/* ------------------------------------------------------------------ */

for (const job of IMAGE_JOBS) {
  if (!wanted(job.file)) continue;
  const src = path.join(publicDir, job.file);
  if (!fs.existsSync(src)) {
    failures.push(`${job.file}: source missing`);
    continue;
  }

  const ext = job.format === "webp" ? ".webp" : job.format === "png" ? ".png" : ".jpg";
  const recipe = {
    kind: job.format,
    width: job.width ?? null,
    opts: job[job.format] ?? null,
    v: 1,
  };
  const outName = hashedName(src, recipe, ext);
  const out = path.join(path.dirname(src), outName);

  if (fs.existsSync(out) && !FORCE) {
    console.log(`· ${job.file} → ${outName} (up to date)`);
    results.push({ from: job.file, to: outName, before: size(src), after: size(out) });
    continue;
  }

  console.log(`▸ encoding ${job.file} …`);
  let pipe = sharp(src);
  if (job.width) {
    pipe = pipe.resize({ width: job.width, withoutEnlargement: true, kernel: "lanczos3" });
  }
  if (job.format === "webp") pipe = pipe.webp(job.webp);
  else if (job.format === "png") pipe = pipe.png({ compressionLevel: 9, ...job.png });
  else pipe = pipe.jpeg(job.jpeg);
  await pipe.toFile(out);

  // Judge the result the way a visitor sees it: both files downscaled to the
  // widest size the asset is ever painted at.
  const score = ssim(src, out, { width: job.renderWidth });
  const line = { from: job.file, to: outName, before: size(src), after: size(out), ssim: score };
  results.push(line);
  if (!(score >= SSIM_FLOOR)) {
    failures.push(`${job.file}: SSIM ${score} below floor ${SSIM_FLOOR} at ${job.renderWidth}px`);
  }
  console.log(`  ${kb(line.before)} → ${kb(line.after)}  (SSIM ${score.toFixed(4)} @ ${job.renderWidth}px)`);
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const before = results.reduce((s, r) => s + r.before, 0);
const after = results.reduce((s, r) => s + r.after, 0);

console.log("\n── rename map ─────────────────────────────────────────");
for (const r of results) {
  console.log(`  /${r.from}  →  /${path.dirname(r.from)}/${r.to}`);
}
console.log("───────────────────────────────────────────────────────");
console.log(`  ${mb(before)} → ${mb(after)}  (${(100 - (after / before) * 100).toFixed(1)}% smaller)`);
console.log("\nUpdate the src strings in Reel/Hero/About/Clients, then delete the originals.");

if (failures.length) {
  console.error("\n✖ FAILED:\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
