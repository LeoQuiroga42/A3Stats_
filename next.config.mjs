/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      allowedOrigins: [
        'zonadecombate.ddns.net',
        'zonadecombate.ddns.net:3000',
        'localhost:3000',
      ],
    },
  },
};

export default nextConfig;
