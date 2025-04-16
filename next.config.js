/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' for dynamic deployment on Vercel
  images: {
    domains: ['vercel.com'], // Add domains you need for external images
  },
  // Removed trailingSlash setting as it's not needed for Vercel deployment
}

module.exports = nextConfig;