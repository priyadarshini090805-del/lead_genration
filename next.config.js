/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    domains: [
      'lh3.googleusercontent.com',
      'media.licdn.com',
      'avatars.githubusercontent.com',
      'cdninstagram.com',
    ],
  },
};

module.exports = nextConfig;
