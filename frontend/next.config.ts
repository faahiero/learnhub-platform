import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const gatewayUrl = process.env.API_GATEWAY_URL || 'http://api-gateway:80';
    const flociUrl = process.env.FLOCI_URL || 'http://floci:4566';
    return [
      {
        source: '/api/:path*',
        destination: `${gatewayUrl}/api/:path*`,
      },
      {
        source: '/learnhub-media/:path*',
        destination: `${flociUrl}/learnhub-media/:path*`,
      },
    ];
  },
};

export default nextConfig;
