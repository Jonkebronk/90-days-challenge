'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Calendar, TrendingUp, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { sv } from 'date-fns/locale'

interface ArticleMetadataProps {
  readingTime?: number | null
  updatedAt: Date
  lastReviewed?: Date | null
  version?: number | null
  viewCount?: number
  className?: string
}

export function ArticleMetadata({
  readingTime,
  updatedAt,
  lastReviewed,
  version,
  viewCount,
  className,
}: ArticleMetadataProps) {
  const isRecent = new Date().getTime() - updatedAt.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
  const needsReview =
    lastReviewed && new Date().getTime() - lastReviewed.getTime() > 180 * 24 * 60 * 60 * 1000 // 6 months

  return (
    <div className={`flex flex-wrap items-center gap-4 text-sm text-muted-foreground ${className}`}>
      {/* Reading Time */}
      {readingTime && (
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{readingTime} min läsning</span>
        </div>
      )}

      {readingTime && <Separator orientation="vertical" className="h-4" />}

      {/* Last Updated */}
      <div className="flex items-center gap-1.5">
        <Calendar className="h-4 w-4" />
        <span>Uppdaterad {formatDistanceToNow(updatedAt, { addSuffix: true, locale: sv })}</span>
        {isRecent && (
          <Badge variant="secondary" className="ml-1 text-xs">
            Ny
          </Badge>
        )}
      </div>

      {/* Version */}
      {version && version > 1 && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span>Version {version}</span>
          </div>
        </>
      )}

      {/* View Count */}
      {viewCount !== undefined && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span>{viewCount} visningar</span>
          </div>
        </>
      )}

      {/* Needs Review Warning (for coaches) */}
      {needsReview && (
        <Badge variant="destructive" className="ml-2">
          Behöver granskas
        </Badge>
      )}
    </div>
  )
}
