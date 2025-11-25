import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for Vercel deployment
  output: undefined, // Let Vercel handle the output
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
  },
  
  // Environment variables validation (will be checked at runtime)
  // All NEXT_PUBLIC_* variables are automatically available
};

export default nextConfig;
