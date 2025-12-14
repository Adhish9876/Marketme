/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable static generation for dynamic client pages
  // Use On-Demand ISR instead
  experimental: {
    isrMemoryCacheSize: 0,
  },
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;
