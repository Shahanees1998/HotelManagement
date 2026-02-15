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
    // Allow larger uploads (e.g. hotel logo, profile images). Default 1MB can cause 413 for small files
    // if the deployment proxy uses an even smaller limit; setting here ensures our app allows up to 10MB.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'canvas'];
    return config;
  },
}

module.exports = nextConfig
