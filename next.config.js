/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Supabase Storage public bucket URLs for vendor logos / menu photos.
        // Replace YOUR-PROJECT-REF with your actual Supabase project ref,
        // or just leave this wildcard-ish pattern during development.
        hostname: "**.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
