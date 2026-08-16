/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public buckets (product images, media library).
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
