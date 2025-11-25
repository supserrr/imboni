import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Get base URL from environment variable or use production domain
  // Always use imboni.app for production robots.txt
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://imboni.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/settings/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

