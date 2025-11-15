'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { getPhaseColors, getPhaseShortName, type Phase } from '@/lib/utils/phase-colors'
import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ArticleCardProps {
  id: string
  title: string
  description?: string | null
  categoryName: string
  categoryIcon?: string
  phase?: Phase | null
  difficulty?: string | null
  readingTime?: number | null
  isRead?: boolean
  coverImage?: string | null
  className?: string
}

export function ArticleCard({
  id,
  title,
  description,
  categoryName,
  categoryIcon,
  phase,
  difficulty,
  readingTime,
  isRead = false,
  coverImage,
  className,
}: ArticleCardProps) {
  const Icon = getCategoryIcon(categoryIcon, categoryName)
  const phaseColors = getPhaseColors(phase)

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-1',
        'border-2',
        phaseColors.border,
        className
      )}
    >
      {/* Phase indicator stripe */}
      <div className={cn('absolute top-0 left-0 right-0 h-1.5', phaseColors.bg)} />

      <CardHeader className="space-y-3 pt-5">
        {/* Icon & Phase Badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0',
              phaseColors.bg,
              'transition-transform group-hover:scale-110'
            )}
          >
            <Icon className={cn('h-6 w-6', phaseColors.text)} />
          </div>

          {phase && (
            <Badge variant="outline" className={cn('flex-shrink-0', phaseColors.badge)}>
              {getPhaseShortName(phase)}
            </Badge>
          )}
        </div>

        {/* Cover Image (optional) */}
        {coverImage && (
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
            <img src={coverImage} alt={title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Title */}
        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </CardTitle>

        {/* Description */}
        {description && (
          <CardDescription className="line-clamp-2 text-sm">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata badges */}
        <div className="flex flex-wrap gap-2">
          {readingTime && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {readingTime} min
            </Badge>
          )}

          {difficulty && <Badge variant="outline" className="text-xs">{difficulty}</Badge>}

          {isRead && (
            <Badge className="gap-1 bg-green-500 hover:bg-green-600 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              Läst
            </Badge>
          )}
        </div>

        {/* CTA Button */}
        <Button asChild className="w-full group/btn">
          <Link href={`/dashboard/articles/${id}`}>
            {isRead ? 'Läs igen' : 'Läs artikel'}
            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardContent>

      {/* Read status overlay */}
      {isRead && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="h-6 w-6 text-green-500 drop-shadow-md" />
        </div>
      )}
    </Card>
  )
}
