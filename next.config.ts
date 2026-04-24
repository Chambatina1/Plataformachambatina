import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Límite de tamaño del body para Server Actions (10MB para soportar imágenes grandes)
  serverActions: {
    bodySizeLimit: "10mb",
  },
  turbopack: {
    root: process.cwd(),
  },
  // Configuración experimental para proxy de cliente con body grande
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
};

export default nextConfig;
