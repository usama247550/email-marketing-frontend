/** @type {import('next').NextConfig} */
const nextConfig = {
  // Backend API base URL — override with NEXT_PUBLIC_API_URL in production
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
  },
};

export default nextConfig;
