'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Clock, CheckCircle, Circle, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'
import { Progress } from '@/components/ui/progress'
import { ArticleMetadata } from '@/components/article-metadata'

type ArticleCategory = {
  id: string
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
  categoryId: string
  orderIndex: number
  published: boolean
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
  coverImage?: string | null
  updatedAt: string
  lastReviewed?: string | null
  version?: number | null
  category: ArticleCategory
  progress?: ArticleProgress[]
  feedback?: Array<{
    isHelpful: boolean
    comment?: string | null
  }>
}

export default function CoachArticleReaderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [categoryArticles, setCategoryArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)

  // Check if user is a coach
  const isCoach = (session?.user as any)?.role === 'coach'

  useEffect(() => {
    if (session?.user && isCoach) {
      fetchArticle()
    } else if (session && !isCoach) {
      router.push('/dashboard')
    }
  }, [session, articleId, isCoach])

  const fetchArticle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data.article)

        // Fetch all articles in the same category
        await fetchCategoryArticles(data.article.categoryId)

        // Track that user viewed this article
        await fetch(`/api/articles/${articleId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      } else {
        toast.error('Kunde inte hämta artikel')
        router.push('/dashboard/coach-articles')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategoryArticles = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/articles?audience=coach`)
      if (response.ok) {
        const data = await response.json()
        const articlesInCategory = data.articles
          .filter((a: Article) => a.categoryId === categoryId && a.published)
          .sort((a: Article, b: Article) => a.orderIndex - b.orderIndex)
        setCategoryArticles(articlesInCategory)
      }
    } catch (error) {
      console.error('Error fetching category articles:', error)
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

  // Calculate category progress
  const categoryProgress = categoryArticles.length > 0
    ? {
        completed: categoryArticles.filter(a => a.progress?.[0]?.completed).length,
        total: categoryArticles.length,
        percentage: Math.round((categoryArticles.filter(a => a.progress?.[0]?.completed).length / categoryArticles.length) * 100)
      }
    : null

  // Find next and previous articles
  const currentIndex = categoryArticles.findIndex(a => a.id === articleId)
  const nextCategoryArticle = currentIndex >= 0 && currentIndex < categoryArticles.length - 1
    ? categoryArticles[currentIndex + 1]
    : null
  const previousCategoryArticle = currentIndex > 0
    ? categoryArticles[currentIndex - 1]
    : null

  if (!session?.user || !isCoach) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-white/5 border border-purple-500/20 backdrop-blur-[10px]">
          <CardContent className="p-6 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-purple-400 mb-4" />
            <p className="text-gray-400">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-white/5 border border-purple-500/20">
          <CardContent className="p-6">
            <p className="text-gray-400">Artikel hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = article.progress && article.progress.length > 0 && article.progress[0].completed

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          {/* Category Progress Bar */}
          {categoryProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{article.category?.name || 'Coachartiklar'}</span>
                <span className="font-medium text-purple-300">
                  {categoryProgress.completed} av {categoryProgress.total} artiklar lästa
                </span>
              </div>
              <Progress value={categoryProgress.percentage} className="h-2 bg-purple-500/20" />
            </div>
          )}
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden border border-purple-500/20">
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
              {article.category?.name && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{article.category.name}</Badge>
              )}
              {article.phase && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.2)]">Fas {article.phase}</Badge>
              )}
              {article.difficulty && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.2)]">{getDifficultyLabel(article.difficulty)}</Badge>
              )}
              {article.estimatedReadingMinutes && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.2)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.estimatedReadingMinutes} min läsning
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-[rgba(34,197,94,0.2)] text-green-500 border-[#22c55e] flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Läst
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4 text-white">{article.title}</h1>

            {/* Article Metadata */}
            <ArticleMetadata
              readingTime={article.estimatedReadingMinutes}
              updatedAt={new Date(article.updatedAt)}
              lastReviewed={article.lastReviewed ? new Date(article.lastReviewed) : null}
              version={article.version}
              className="mb-6"
            />
          </div>

          {/* Article Content */}
          <Card className="bg-white border-purple-500/30">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none prose-headings:text-[#1a0933] prose-headings:font-bold prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-[#1a0933] prose-strong:font-semibold prose-li:text-gray-800 prose-a:text-[#1a0933] prose-a:hover:text-purple-500 prose-a:underline prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-700 prose-code:text-[#1a0933] prose-code:bg-gray-100 prose-pre:bg-gray-100 prose-pre:text-gray-900">
                <MDXPreview content={article.content} />
              </div>
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <div className="mt-8">
            {/* Mark as Complete Button */}
            <div className="flex justify-center mb-6">
              <Button
                onClick={handleToggleComplete}
                disabled={isMarkingComplete}
                size="lg"
                className={`min-w-[200px] ${isCompleted
                  ? 'bg-[rgba(34,197,94,0.2)] text-green-500 border-[#22c55e] hover:bg-[rgba(34,197,94,0.3)]'
                  : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
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

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-purple-500/20">
              {previousCategoryArticle ? (
                <Button
                  onClick={() => router.push(`/dashboard/coach-articles/${previousCategoryArticle.id}`)}
                  className="bg-purple-500 text-white hover:bg-purple-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Föregående
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard/coach-articles')}
                  className="bg-purple-500 text-white hover:bg-purple-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tillbaka till artiklar
                </Button>
              )}

              {nextCategoryArticle ? (
                <Button
                  onClick={() => router.push(`/dashboard/coach-articles/${nextCategoryArticle.id}`)}
                  className="bg-purple-500 text-white hover:bg-purple-600"
                >
                  Nästa artikel
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard/coach-articles')}
                  className="bg-purple-500 text-white hover:bg-purple-600"
                >
                  Tillbaka till artiklar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
