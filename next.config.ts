import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Handle video files (mp4, webm, ogg)
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/videos/[name].[hash][ext]',
      },
    });
    
    return config;
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
      '*.mp4': {
        loaders: ['file-loader'],
        as: '*.js',
      },
      '*.webm': {
        loaders: ['file-loader'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Proxy unmatched /api/* requests to the Express backend.
  // IMPORTANT: Using "fallback" (not the default array/afterFiles) so that
  // Next.js App Router Route Handlers always take priority.
  // With Turbopack, the default "afterFiles" rewrites run BEFORE Route Handlers
  // are resolved, causing Route Handlers to be silently bypassed and requests
  // to reach the backend without auth cookies — resulting in 401/404 errors.
  // "fallback" only fires when NO page, Route Handler or dynamic route matched.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return {
      beforeFiles: [],   // nothing runs before filesystem check
      afterFiles: [],    // nothing runs after filesystem but before dynamic routes
      fallback: [
        {
          // Catch all /api/* paths that do NOT have a Next.js Route Handler
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
