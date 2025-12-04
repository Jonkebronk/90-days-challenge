'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadPdfButtonProps {
  audience?: 'client' | 'coach'
  categoryIds?: string[]
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function DownloadPdfButton({
  audience = 'client',
  categoryIds,
  variant = 'outline',
  size = 'default',
  className,
}: DownloadPdfButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setIsLoading(true)
      toast.info('Genererar PDF...')

      // Build URL with query params
      const params = new URLSearchParams()
      params.set('audience', audience)
      if (categoryIds && categoryIds.length > 0) {
        params.set('categoryIds', categoryIds.join(','))
      }

      const response = await fetch(`/api/articles/export-pdf?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Kunde inte generera PDF')
      }

      // Get the blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = audience === 'coach' ? 'coach-kunskapsbank.pdf' : 'kunskapsbank.pdf'
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF nedladdad!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error(error instanceof Error ? error.message : 'Kunde inte ladda ner PDF')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Genererar...
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          Ladda ner PDF
        </>
      )}
    </Button>
  )
}
