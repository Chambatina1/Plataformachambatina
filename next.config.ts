import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output estándar para Render (usa npx next start)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Límite de tamaño del body para Server Actions
  serverActions: {
    bodySizeLimit: "4mb",
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
