/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors will not block the build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScript errors will not block the build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
