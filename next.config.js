/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel will handle server-side rendering dynamically
  // No need for static export mode
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
