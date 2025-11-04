'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, CheckCircle, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'

type ArticleCategory = {
  name: string
}

type ArticleProgress = {
  completed: boolean
  completedAt?: Date | null
  lastReadAt?: Date | null
}

type Article = {
  id: string
  title: string
  content: string
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
  coverImage?: string | null
  category: ArticleCategory
  progress?: ArticleProgress[]
}

export default function ArticleReaderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchArticle()
    }
  }, [session, articleId])

  const fetchArticle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data.article)

        // Track that user viewed this article
        await fetch(`/api/articles/${articleId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: false })
        })
      } else {
        toast.error('Kunde inte hämta artikel')
        router.push('/dashboard/articles')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleComplete = async () => {
    if (!article) return

    const isCompleted = article.progress && article.progress.length > 0 && article.progress[0].completed
    const newCompleted = !isCompleted

    try {
      setIsMarkingComplete(true)
      const response = await fetch(`/api/articles/${articleId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      })

      if (response.ok) {
        toast.success(newCompleted ? 'Artikel markerad som läst' : 'Markering borttagen')
        fetchArticle()
      } else {
        toast.error('Kunde inte uppdatera status')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsMarkingComplete(false)
    }
  }

  const getDifficultyLabel = (difficulty?: string | null) => {
    if (!difficulty) return null
    const labels: Record<string, string> = {
      beginner: 'Nybörjare',
      intermediate: 'Medel',
      advanced: 'Avancerad'
    }
    return labels[difficulty] || difficulty
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Artikel hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = article.progress && article.progress.length > 0 && article.progress[0].completed

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/articles')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till artiklar
            </Button>
            <Button
              onClick={handleToggleComplete}
              disabled={isMarkingComplete}
              variant={isCompleted ? 'outline' : 'default'}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Markerad som läst
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-2" />
                  {isMarkingComplete ? 'Markerar...' : 'Markera som läst'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{article.category.name}</Badge>
              {article.phase && (
                <Badge variant="outline">Fas {article.phase}</Badge>
              )}
              {article.difficulty && (
                <Badge variant="outline">{getDifficultyLabel(article.difficulty)}</Badge>
              )}
              {article.estimatedReadingMinutes && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.estimatedReadingMinutes} min läsning
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Läst
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          </div>

          {/* Article Content */}
          <Card>
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none">
                <MDXPreview content={article.content} />
              </div>
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/articles')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till artiklar
            </Button>
            <Button
              onClick={handleToggleComplete}
              disabled={isMarkingComplete}
              variant={isCompleted ? 'outline' : 'default'}
            >
              {isCompleted ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Markerad som läst
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-2" />
                  {isMarkingComplete ? 'Markerar...' : 'Markera som läst'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
