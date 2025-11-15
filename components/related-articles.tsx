'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Clock } from 'lucide-react'
import Link from 'next/link'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { getPhaseColors, getPhaseShortName, type Phase } from '@/lib/utils/phase-colors'

interface RelatedArticle {
  id: string
  title: string
  description: string | null
  categoryName: string
  phase: number | null
  estimatedReadingMinutes: number | null
  coverImage: string | null
}

interface RelatedArticlesProps {
  articles: RelatedArticle[]
  title?: string
  className?: string
}

export function RelatedArticles({
  articles,
  title = 'Relaterade Artiklar',
  className,
}: RelatedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {articles.map((article) => {
          const Icon = getCategoryIcon(undefined, article.categoryName)
          const phaseColors = getPhaseColors(article.phase as Phase)

          return (
            <div
              key={article.id}
              className="group p-4 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${phaseColors.bg}`}>
                  <Icon className={`h-5 w-5 ${phaseColors.text}`} />
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h4>
                    {article.phase && (
                      <Badge variant="outline" className={`flex-shrink-0 ${phaseColors.badge}`}>
                        {getPhaseShortName(article.phase as Phase)}
                      </Badge>
                    )}
                  </div>

                  {article.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-1 rounded-full bg-muted">{article.categoryName}</span>
                      {article.estimatedReadingMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{article.estimatedReadingMinutes} min</span>
                        </div>
                      )}
                    </div>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                    >
                      <Link href={`/dashboard/articles/${article.id}`} className="flex items-center gap-1">
                        Läs artikel
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
