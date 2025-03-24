/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Keep static exports as requested
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Recommended for static exports
}

module.exports = nextConfig 