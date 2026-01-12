/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Optimize production build
  compress: true,
  // Enable React strict mode
  reactStrictMode: true,
}

export default nextConfig