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
    images: {
      domains: ['img.clerk.com'], // Simple approach
      // OR use remotePatterns (recommended for newer Next.js versions):
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'img.clerk.com',
          pathname: '/**', // Allows all paths under this hostname
        },
      ],
    },
    publicRuntimeConfig: {
      uploadUrl: '/uploads',
    }
  };
  
  export default nextConfig;