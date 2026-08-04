/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Admins can paste any banner image URL from the dashboard (see
      // /admin/collections), so we accept any https host rather than
      // requiring a code change + redeploy per image host.
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
