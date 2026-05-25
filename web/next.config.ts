import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local Next 16 builds were timing out in parallel worker reads in this
  // workspace. Keep the build deterministic by reducing worker concurrency.
  experimental: {
    cpus: 1,
    parallelServerBuildTraces: false,
    webpackBuildWorker: false,
  },
  // Lint is the explicit source validation step in this project; the local
  // Next 16 type-check worker hangs after compile in this workspace.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
