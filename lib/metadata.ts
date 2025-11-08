import { Metadata } from 'next'

export const siteConfig = {
  name: '90 Days Challenge',
  description: 'Personlig träning och nutrition coaching platform',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://90-days-challenge.com',
  ogImage: '/og-image.png',
  author: '90 Days Challenge Team',
  keywords: [
    'träning',
    'nutrition',
    'coaching',
    'fitness',
    'hälsa',
    'träningsprogram',
    'kostplan',
    'personlig träning',
    'online coaching'
  ]
}

export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  ...props
}: {
  title?: string
  description?: string
  image?: string
  noIndex?: boolean
} & Metadata = {}): Metadata {
  return {
    metadataBase: new URL(siteConfig.url),
    title,
    description,
    keywords: siteConfig.keywords,
    authors: [
      {
        name: siteConfig.author
      }
    ],
    creator: siteConfig.author,
    openGraph: {
      title,
      description,
      type: 'website',
      url: siteConfig.url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      creator: '@90dayschallenge'
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png'
    },
    manifest: '/site.webmanifest',
    ...(noIndex && {
      robots: {
        index: false,
        follow: false
      }
    }),
    ...props
  }
}
