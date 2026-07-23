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
  // ~3.5 MB. These change only on redeploy, so cache them for a week and let
  // the CDN serve stale while it refreshes. Names are NOT content-hashed:
  // rename the file to force an early update.
  async headers() {
    return [
      {
        source: "/:dir(clients|assets)/:file*",
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
