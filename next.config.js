/** @type {import('next').NextConfig} */
const nextConfig = {
  // For Firebase Hosting static export
  output: 'export',
  distDir: 'build',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
