/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // ou '5mb', '20mb'
    },
  },
};

module.exports = nextConfig;
