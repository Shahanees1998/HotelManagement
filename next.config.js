/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: [],
    unoptimized: false, // Try with optimization enabled
  },
  experimental: {
    serverComponentsExternalPackages: ['chart.js'],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas'];
    return config;
  },
}

module.exports = nextConfig
