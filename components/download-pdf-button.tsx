'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DownloadPdfButtonProps {
  audience?: 'client' | 'coach'
  categoryIds?: string[]
  branchId?: string
  branchName?: string
  categoryId?: string
  categoryName?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function DownloadPdfButton({
  audience = 'client',
  categoryIds,
  branchId,
  branchName,
  categoryId,
  categoryName,
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
      if (branchId) {
        params.set('branchId', branchId)
      }
      if (categoryId) {
        params.set('categoryId', categoryId)
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
      // Use branchName/categoryName for filename if provided
      let filename = 'kunskapsbank.pdf'
      if (audience === 'coach') {
        if (categoryName) {
          const sanitizedName = categoryName
            .toLowerCase()
            .replace(/[åä]/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
          filename = `coach-kunskapsbank-${sanitizedName}.pdf`
        } else {
          filename = 'coach-kunskapsbank.pdf'
        }
      } else if (branchName) {
        const sanitizedName = branchName
          .toLowerCase()
          .replace(/[åä]/g, 'a')
          .replace(/ö/g, 'o')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        filename = `kunskapskartan-${sanitizedName}.pdf`
      }
      link.download = filename
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
