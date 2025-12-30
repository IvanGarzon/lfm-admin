import type { NextConfig } from 'next';
import '@/env';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4566',
        pathname: '/lasflores-admin-uploads/**',
      },
    ],
  },
  // Suppress hydration warnings for Radix UI ID mismatches
  reactStrictMode: true,
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         { key: 'X-Frame-Options', value: 'DENY' },
  //         { key: 'X-Content-Type-Options', value: 'nosniff' },
  //         {
  //           key: 'Strict-Transport-Security',
  //           value: 'max-age=31536000; includeSubDomains; preload',
  //         },
  //         {
  //           key: 'Content-Security-Policy',
  //           value: "default-src 'self'; script-src 'self'; object-src 'none';",
  //         },
  //       ],
  //     },
  //   ];
  // },
  // experimental: {
  // serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  // turbo: {
  //   resolveAlias: {
  //     '.prisma/client/index-browser': './prisma/generated/client/index-browser.js',
  //   },
  // },
  // instrumentationHook: true,
  // },
  // webpack: (config, { isServer }) => {
  //   if (isServer) {
  //     config.externals.push('@prisma/client');
  //   }
  //   return config;
  // },
  // Already doing linting and typechecking as separate tasks in CI
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
