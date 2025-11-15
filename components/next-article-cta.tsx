'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { getPhaseColors, getPhaseShortName, type Phase } from '@/lib/utils/phase-colors'

interface NextArticleProps {
  article: {
    id: string
    title: string
    description: string | null
    categoryName: string
    phase: number | null
    estimatedReadingMinutes: number | null
    coverImage: string | null
  }
  className?: string
}

export function NextArticleCTA({ article, className }: NextArticleProps) {
  const Icon = getCategoryIcon(undefined, article.categoryName)
  const phaseColors = getPhaseColors(article.phase as Phase)

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-semibold">Bra jobbat! Vad vill du läsa härnäst?</span>
          </div>

          {/* Next Article Preview */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-background border-2 border-primary/30">
            {/* Icon or Cover Image */}
            {article.coverImage ? (
              <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 ${phaseColors.bg}`}>
                <Icon className={`h-7 w-7 ${phaseColors.text}`} />
              </div>
            )}

            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-lg line-clamp-2">{article.title}</h3>
                {article.phase && (
                  <Badge className={`flex-shrink-0 ${phaseColors.badge}`}>
                    {getPhaseShortName(article.phase as Phase)}
                  </Badge>
                )}
              </div>

              {article.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-muted">{article.categoryName}</span>
                {article.estimatedReadingMinutes && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{article.estimatedReadingMinutes} min</span>
                  </div>
                )}
              </div>

              <Button asChild size="lg" className="w-full mt-3">
                <Link href={`/dashboard/articles/${article.id}`}>
                  Fortsätt lära
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
