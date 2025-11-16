'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Clock, CheckCircle, Circle } from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'
import { Progress } from '@/components/ui/progress'
import { ArticleMetadata } from '@/components/article-metadata'
import { ArticleFeedback } from '@/components/article-feedback'
import { RelatedArticles } from '@/components/related-articles'
import { NextArticleCTA } from '@/components/next-article-cta'

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

export default function ArticleReaderPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [categoryArticles, setCategoryArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [relatedArticles, setRelatedArticles] = useState<any[]>([])
  const [nextArticle, setNextArticle] = useState<any | null>(null)

  useEffect(() => {
    if (session?.user) {
      fetchArticle()
      fetchRelatedArticles()
    }
  }, [session, articleId])

  const fetchArticle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data.article)

        // Fetch all articles in the same category
        await fetchCategoryArticles(data.article.categoryId)

        // Track that user viewed this article (only update lastReadAt, don't change completed status)
        await fetch(`/api/articles/${articleId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})  // Don't send completed field to preserve existing status
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

  const fetchCategoryArticles = async (categoryId: string) => {
    try {
      const response = await fetch('/api/articles')
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

  const fetchRelatedArticles = async () => {
    try {
      const response = await fetch(`/api/articles/related?articleId=${articleId}&limit=3`)
      if (response.ok) {
        const data = await response.json()
        setRelatedArticles(data.related || [])
        setNextArticle(data.next || null)
      }
    } catch (error) {
      console.error('Error fetching related articles:', error)
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
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-[rgba(0,0,0,0.3)] backdrop-blur-sm border-b border-[rgba(255,215,0,0.2)] sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          {/* Category Progress Bar */}
          {categoryProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[rgba(255,255,255,0.6)]">{article.category.name}</span>
                <span className="font-medium text-[#FFD700]">
                  {categoryProgress.completed} av {categoryProgress.total} artiklar lästa
                </span>
              </div>
              <Progress value={categoryProgress.percentage} className="h-2 bg-[rgba(255,215,0,0.2)]" />
            </div>
          )}
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-8 rounded-lg overflow-hidden border border-[rgba(255,215,0,0.2)]">
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
              <Badge className="bg-[rgba(255,215,0,0.2)] text-[#FFD700] border-[rgba(255,215,0,0.3)]">{article.category.name}</Badge>
              {article.phase && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.2)]">Fas {article.phase}</Badge>
              )}
              {article.difficulty && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.2)]">{getDifficultyLabel(article.difficulty)}</Badge>
              )}
              {article.estimatedReadingMinutes && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.7)] border-[rgba(255,255,255,0.2)] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.estimatedReadingMinutes} min läsning
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[#22c55e] flex items-center gap-1">
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
          <Card className="bg-white border-[rgba(255,215,0,0.3)]">
            <CardContent className="p-8">
              <div className="prose prose-lg max-w-none prose-headings:text-[#1a0933] prose-headings:font-bold prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-[#1a0933] prose-strong:font-semibold prose-li:text-gray-800 prose-a:text-[#1a0933] prose-a:hover:text-[#FFA500] prose-a:underline prose-blockquote:border-l-[#FFD700] prose-blockquote:text-gray-700 prose-code:text-[#1a0933] prose-code:bg-gray-100 prose-pre:bg-gray-100 prose-pre:text-gray-900">
                <MDXPreview content={article.content} />
              </div>
            </CardContent>
          </Card>

          {/* Article Feedback */}
          <div className="mt-8">
            <ArticleFeedback
              articleId={article.id}
              initialFeedback={article.feedback?.[0]}
            />
          </div>

          {/* Next Article CTA */}
          {nextArticle && (
            <div className="mt-8">
              <NextArticleCTA article={nextArticle} />
            </div>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-8">
              <RelatedArticles articles={relatedArticles} />
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-8">
            {/* Mark as Complete Button */}
            <div className="flex justify-center mb-6">
              <Button
                onClick={handleToggleComplete}
                disabled={isMarkingComplete}
                size="lg"
                className={`min-w-[200px] ${isCompleted
                  ? 'bg-[rgba(34,197,94,0.2)] text-[#22c55e] border-[#22c55e] hover:bg-[rgba(34,197,94,0.3)]'
                  : 'bg-[#FFD700] text-black hover:bg-[#FFA500]'
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
            <div className="flex items-center justify-between pt-6 border-t border-[rgba(255,215,0,0.2)]">
              {previousCategoryArticle ? (
                <Button
                  onClick={() => router.push(`/dashboard/articles/${previousCategoryArticle.id}`)}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Föregående
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard/articles')}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tillbaka till artiklar
                </Button>
              )}

              {nextCategoryArticle ? (
                <Button
                  onClick={() => router.push(`/dashboard/articles/${nextCategoryArticle.id}`)}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500]"
                >
                  Nästa artikel
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard/articles')}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500]"
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
