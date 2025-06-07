/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { fs: false };
    return config;
  },

  experimental: {
    serverActions: true,
  },
  
  // Allow file uploads and static file serving
  serverRuntimeConfig: {
    uploadDir: './public/uploads',
  },
  publicRuntimeConfig: {
    uploadUrl: '/uploads',
  },

  // Add images configuration for Clerk
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;