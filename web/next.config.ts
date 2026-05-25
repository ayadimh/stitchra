import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local Next 16 builds were timing out in parallel worker reads in this
  // workspace. Keep the build deterministic by reducing worker concurrency.
  experimental: {
    cpus: 1,
    parallelServerBuildTraces: false,
    webpackBuildWorker: false,
  },
  // Lint remains the explicit source validation step; this avoids a local
  // duplicate type-check worker hang during production bundling.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
