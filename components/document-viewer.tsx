'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DocumentViewerProps {
  url: string
  title?: string
}

export function DocumentViewer({ url, title }: DocumentViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Check if it's a Google Docs/Drive URL
  const isGoogleDoc = url.includes('docs.google.com') || url.includes('drive.google.com')

  // Convert Google Doc view URL to embed URL if needed
  const getEmbedUrl = (originalUrl: string) => {
    if (originalUrl.includes('docs.google.com/document')) {
      // Convert view URL to embed URL
      let embedUrl = originalUrl.replace('/edit', '/preview').replace('/view', '/preview')
      // Ensure preview mode
      if (!embedUrl.includes('/preview')) {
        embedUrl = embedUrl.replace(/\/(edit|view).*$/, '/preview')
      }
      return embedUrl
    }
    if (originalUrl.includes('drive.google.com/file')) {
      // Extract file ID and create embed URL
      const fileIdMatch = originalUrl.match(/\/d\/([^/]+)/)
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
      }
    }
    // For PDFs, use Google Docs viewer as fallback
    if (originalUrl.toLowerCase().endsWith('.pdf')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(originalUrl)}&embedded=true`
    }
    // For other URLs, return as-is
    return originalUrl
  }

  const embedUrl = getEmbedUrl(url)
  const isPdf = url.toLowerCase().endsWith('.pdf')

  // Set timeout for loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        setHasError(true)
        setIsLoading(false)
      }
    }, 10000) // 10 seconds timeout

    return () => clearTimeout(timeout)
  }, [isLoading])

  return (
    <div className="space-y-4">
      {/* Header with open button */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-gray-600" />
          <div>
            <p className="font-medium">
              {isGoogleDoc && 'Google Dokument'}
              {isPdf && 'PDF Dokument'}
              {!isGoogleDoc && !isPdf && 'Dokument'}
            </p>
            <p className="text-xs text-muted-foreground">
              Klicka på knappen för att öppna dokumentet
            </p>
          </div>
        </div>
        <Button
          variant="default"
          size="lg"
          onClick={() => window.open(url, '_blank')}
          className="bg-green-600 hover:bg-green-700"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Öppna dokument
        </Button>
      </div>

      {/* Show error or iframe */}
      {hasError ? (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
          <h3 className="text-lg font-semibold mb-2">Förhandsgranskning inte tillgänglig</h3>
          <p className="text-muted-foreground mb-6">
            Detta dokument kan inte visas direkt i webbläsaren. Klicka på knappen ovan för att öppna det i ett nytt fönster.
          </p>
          <Button
            variant="outline"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Öppna dokument i nytt fönster
          </Button>
        </Card>
      ) : (
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden border border-gray-200" style={{ minHeight: '700px' }}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              <p className="text-muted-foreground">Laddar dokument...</p>
              <p className="text-xs text-muted-foreground">Om dokumentet inte visas, klicka på &ldquo;Öppna dokument&rdquo; ovan</p>
            </div>
          )}
          <iframe
            src={embedUrl}
            title={title || 'Document'}
            className="w-full h-full border-0"
            style={{ minHeight: '700px' }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
              console.error('Failed to load document')
            }}
            allow="autoplay"
          />
        </div>
      )}

      {/* Tips section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tips för bästa resultat:</strong>
        </p>
        <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
          <li>Google Docs: Dela dokumentet med &ldquo;Alla som har länken kan visa&rdquo;</li>
          <li>PDF: Använd direktlänk till PDF-filen</li>
          <li>Om förhandsgranskning inte fungerar, klicka &ldquo;Öppna dokument&rdquo;</li>
        </ul>
      </div>
    </div>
  )
}
