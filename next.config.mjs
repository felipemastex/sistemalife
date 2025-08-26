/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'export',
  distDir: 'out',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow development origins for network access
  allowedDevOrigins: ['http://192.168.1.21:3002', 'http://localhost:3002'],
};

export default nextConfig;