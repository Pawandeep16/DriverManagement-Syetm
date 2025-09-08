// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'export',
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
//   images: { unoptimized: true },


  
// };

// module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Keep static export for your app
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint during builds (as per your original config)
  },
  images: {
    unoptimized: true, // Disable image optimization for static export
  },
  webpack: (config, { isServer }) => {
    // Prevent Node.js-specific modules from being included in client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        fs: false, // Ignore fs module (used by face-api.js)
        path: false, // Ignore path module
        os: false, // Ignore os module
      };
    }
    return config;
  },
};

module.exports = nextConfig;