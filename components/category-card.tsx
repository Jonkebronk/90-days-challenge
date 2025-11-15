'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { ChevronRight, BookOpen, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  id: string
  name: string
  description?: string | null
  color?: string
  icon?: string
  articleCount: number
  readCount: number
  sectionCount?: number
  className?: string
}

export function CategoryCard({
  id,
  name,
  description,
  color = '#FFD700',
  icon,
  articleCount,
  readCount,
  sectionCount,
  className,
}: CategoryCardProps) {
  const Icon = getCategoryIcon(icon, name)
  const progress = articleCount > 0 ? (readCount / articleCount) * 100 : 0
  const isCompleted = progress === 100

  // Convert hex color to RGB for gradient
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 215, b: 0 } // Default gold
  }

  const rgb = hexToRgb(color)
  const gradientStyle = {
    background: `linear-gradient(135deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) 100%)`,
  }

  return (
    <Link href={`/dashboard/articles?category=${id}`}>
      <Card
        className={cn(
          'group cursor-pointer transition-all duration-200',
          'hover:shadow-md hover:border-primary/50',
          isCompleted && 'border-green-500 bg-green-50/50 dark:bg-green-950/20',
          className
        )}
      >
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            {/* Icon with gradient background */}
            <div
              className={cn(
                'h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0',
                'group-hover:scale-110 transition-transform'
              )}
              style={gradientStyle}
            >
              <Icon className="h-7 w-7" style={{ color }} />
            </div>

            {/* Completion Badge */}
            {isCompleted && (
              <Badge className="bg-green-500 hover:bg-green-600 gap-1 flex-shrink-0">
                <CheckCircle className="h-3 w-3" />
                Klar
              </Badge>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 group-hover:text-primary transition-colors">
              {name}
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </CardTitle>
            {description && (
              <CardDescription className="line-clamp-2 text-sm">{description}</CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{articleCount} artiklar</span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>{readCount} lästa</span>
            </div>
          </div>

          {/* Progress Bar */}
          {articleCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{Math.round(progress)}%</span>
              </div>
              <Progress
                value={progress}
                className="h-2"
                style={
                  {
                    '--progress-background': color,
                  } as React.CSSProperties
                }
              />
            </div>
          )}

          {/* Sections Preview */}
          {sectionCount !== undefined && sectionCount > 0 && (
            <p className="text-xs text-muted-foreground">{sectionCount} sektioner</p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
