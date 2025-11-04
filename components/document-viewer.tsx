'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocumentViewerProps {
  url: string
  title?: string
}

export function DocumentViewer({ url, title }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true)

  // Check if it's a Google Docs/Drive URL
  const isGoogleDoc = url.includes('docs.google.com') || url.includes('drive.google.com')

  // Convert Google Doc view URL to embed URL if needed
  const getEmbedUrl = (originalUrl: string) => {
    if (originalUrl.includes('docs.google.com/document')) {
      // Convert view URL to embed URL
      return originalUrl.replace('/edit', '/preview').replace('/view', '/preview')
    }
    if (originalUrl.includes('drive.google.com/file')) {
      // Extract file ID and create embed URL
      const fileIdMatch = originalUrl.match(/\/d\/([^/]+)/)
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      }
    }
    // For PDFs and other direct URLs, return as-is
    return originalUrl
  }

  const embedUrl = getEmbedUrl(url)
  const isPdf = url.toLowerCase().endsWith('.pdf')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isGoogleDoc && 'Google Dokument'}
          {isPdf && 'PDF Dokument'}
          {!isGoogleDoc && !isPdf && 'Dokument'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Öppna i nytt fönster
        </Button>
      </div>

      <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">Laddar dokument...</p>
          </div>
        )}
        <iframe
          src={embedUrl}
          title={title || 'Document'}
          className="w-full h-full border-0"
          style={{ minHeight: '600px' }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            console.error('Failed to load document')
          }}
        />
      </div>

      {!isGoogleDoc && !isPdf && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Tips:</strong> Om dokumentet inte visas korrekt, klicka på &ldquo;Öppna i nytt fönster&rdquo; ovan.
            För bästa resultat, använd Google Docs-länkar eller direktlänkar till PDF-filer.
          </p>
        </div>
      )}
    </div>
  )
}
