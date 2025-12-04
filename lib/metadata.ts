import { Metadata } from 'next'

export const siteConfig = {
  name: 'Friskvårdskompassen',
  description: 'Din vägvisare till bättre hälsa. Få personlig coaching, skräddarsydda träningsprogram, kostplaner och experthjälp för att nå dina hälsomål.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://friskvardskompassen.com',
  ogImage: '/images/og-image.png',
  author: 'Friskvårdskompassen',
  keywords: [
    'friskvårdskompassen',
    'hälsocoaching',
    'viktminskning',
    'muskelökning',
    'personlig tränare online',
    'träning',
    'nutrition',
    'coaching',
    'fitness',
    'hälsa',
    'träningsprogram',
    'kostplan',
    'kostschema',
    'personlig träning',
    'online coaching',
    'hälsocoach',
    'transformering',
    'livsstilsförändring',
    'svensk träning'
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
      creator: '@friskvardskompassen'
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon-16x16.png',
      apple: '/apple-touch-icon.png'
    },
    manifest: '/manifest.json',
    ...(noIndex && {
      robots: {
        index: false,
        follow: false
      }
    }),
    ...props
  }
}
