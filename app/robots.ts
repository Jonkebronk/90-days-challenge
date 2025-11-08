import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://90-days-challenge.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/_next/',
          '/setup-account',
          '/step-*'
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
