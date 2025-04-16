/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force server-side rendering for all pages
  runtime: 'nodejs',
  experimental: {
    forceServerComponents: true,
  },
  images: {
    domains: ['vercel.com'], // Add domains you need for external images
  },
}

module.exports = nextConfig;