'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Lock,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowRight,
  Target
} from 'lucide-react'
import Link from 'next/link'

interface LearningPathCardProps {
  id: string
  title: string
  description: string | null
  slug: string
  coverImage: string | null
  difficulty: string | null
  estimatedDuration: number | null
  totalArticles: number
  completedArticles: number
  progress: number
  isLocked: boolean
  isStarted: boolean
  isCompleted: boolean
  isAssigned: boolean
  dueDate: string | null
  className?: string
}

export function LearningPathCard({
  id,
  title,
  description,
  slug,
  coverImage,
  difficulty,
  estimatedDuration,
  totalArticles,
  completedArticles,
  progress,
  isLocked,
  isStarted,
  isCompleted,
  isAssigned,
  dueDate,
  className
}: LearningPathCardProps) {
  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-[rgba(255,255,255,0.1)] text-white'
    }
  }

  const getDifficultyLabel = (difficulty: string | null) => {
    switch (difficulty) {
      case 'beginner':
        return 'Nybörjare'
      case 'intermediate':
        return 'Medel'
      case 'advanced':
        return 'Avancerad'
      default:
        return null
    }
  }

  return (
    <Card
      className={`group relative overflow-hidden bg-gradient-to-br from-[rgba(10,10,10,0.8)] to-[rgba(26,9,51,0.3)] border-[rgba(255,215,0,0.2)] hover:border-[rgba(255,215,0,0.5)] transition-all ${
        isLocked ? 'opacity-60' : ''
      } ${className}`}
    >
      {/* Cover Image or Gradient */}
      {coverImage ? (
        <div className="relative h-32 overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Lock className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 flex items-center justify-center">
          {isLocked && <Lock className="h-8 w-8 text-[rgba(255,255,255,0.5)]" />}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="space-y-2">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAssigned && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Target className="h-3 w-3 mr-1" />
                Tilldelad
              </Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                Klar
              </Badge>
            )}
            {isStarted && !isCompleted && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                Påbörjad
              </Badge>
            )}
            {difficulty && (
              <Badge className={getDifficultyColor(difficulty)}>
                {getDifficultyLabel(difficulty)}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-[#FFD700] transition-colors">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-[rgba(255,255,255,0.6)] line-clamp-3">
              {description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-[rgba(255,255,255,0.5)]">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{totalArticles} artiklar</span>
          </div>
          {estimatedDuration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{estimatedDuration} min</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {!isLocked && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[rgba(255,255,255,0.6)]">Framsteg</span>
              <span className="text-[#FFD700] font-semibold">
                {completedArticles} / {totalArticles}
              </span>
            </div>
            <Progress
              value={progress}
              className="h-2 bg-[rgba(255,215,0,0.2)]"
            />
          </div>
        )}

        {/* CTA Button */}
        <Button
          asChild
          disabled={isLocked}
          className={`w-full ${
            isLocked
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-[#FFD700] text-black hover:bg-[#FFA500]'
          }`}
        >
          <Link href={isLocked ? '#' : `/dashboard/learning-paths/${slug}`}>
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Låst
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Visa igen
              </>
            ) : isStarted ? (
              <>
                Fortsätt
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Börja
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Link>
        </Button>

        {/* Due Date */}
        {dueDate && (
          <p className="text-xs text-[rgba(255,255,255,0.5)] text-center">
            Slutdatum: {new Date(dueDate).toLocaleDateString('sv-SE')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
