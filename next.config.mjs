import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Tree-shake these barrel-export packages so only the icons/utilities actually
  // used are bundled — smaller client JS, faster initial parse/execute.
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@number-flow/react",
    ],
  },
  compiler: {
    // Drop console.* in production builds — less work on the main thread and a
    // slightly smaller client bundle. Errors/warnings stay for real issues.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Everything under /_next/static is content-hashed and already served
  // immutable by Next. Files in /public are not, so they default to
  // `max-age=0, must-revalidate` — a revalidation round trip per asset on
  // every repeat visit, which for the client screenshots means re-checking
  // several MB.
  //
  // Two tiers, matched on the filename so they can never both apply to the
  // same request:
  //
  //  · `<name>.<8 hex>.<ext>` is what scripts/optimize-media.mjs emits, and
  //    that hash covers the source bytes and the encode recipe. The bytes
  //    behind such a name can never change, so it's cacheable forever and
  //    never revalidated.
  //  · Everything else (posters, work stills, Forager.mp4, the resume PDF)
  //    keeps a week with a month of stale-while-revalidate. These names are
  //    NOT content-hashed, so rename the file to force an early update —
  //    or run it through the optimizer, which does that for you.
  async headers() {
    const hashed = String.raw`.*\.[0-9a-f]{8}\.[a-z0-9]+`;
    return [
      {
        source: `/:dir(clients|assets)/:file(${hashed})`,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: `/:dir(clients|assets)/:file((?!${hashed}$).*)`,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
