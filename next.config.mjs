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
};

export default withBundleAnalyzer(nextConfig);
