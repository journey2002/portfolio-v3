import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tree-shake these barrel-export packages so only the icons/utilities actually
  // used are bundled — smaller client JS, faster initial parse/execute.
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

export default withBundleAnalyzer(nextConfig);
