/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next.js from bundling mongoose — it must run in Node.js only
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
};

export default nextConfig;
