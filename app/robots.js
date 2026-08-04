const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://fieldandco.example.com';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/login', '/signup', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
