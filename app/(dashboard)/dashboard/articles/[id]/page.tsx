'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Clock, CheckCircle, Circle, Pencil, Trash2 } from 'lucide-react'
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

type SkillTreeBranch = {
  id: string
  name: string
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
  category?: ArticleCategory | null
  skillTreeBranchId?: string | null
  orderInBranch?: number
  skillTreeBranch?: SkillTreeBranch | null
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
  const [branchArticles, setBranchArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

        // Fetch all articles in the same skill tree branch
        if (data.article.skillTreeBranchId) {
          await fetchBranchArticles(data.article.skillTreeBranchId)
        }

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

  const fetchBranchArticles = async (branchId: string) => {
    try {
      const response = await fetch(`/api/skill-tree-branches/${branchId}`)
      if (response.ok) {
        const data = await response.json()
        // Combine loose articles with articles from subcategories
        const looseArticles = data.articles || []
        const subcategoryArticles = (data.subcategories || []).flatMap((sub: any) =>
          (sub.articles || []).map((a: any) => ({ ...a, subcategoryOrder: sub.orderIndex }))
        )
        // Sort: first by subcategory order (loose articles = -1), then by orderInBranch
        const allArticles = [...looseArticles.map((a: any) => ({ ...a, subcategoryOrder: -1 })), ...subcategoryArticles]
          .filter((a: Article) => a.published)
          .sort((a: any, b: any) => {
            if (a.subcategoryOrder !== b.subcategoryOrder) {
              return a.subcategoryOrder - b.subcategoryOrder
            }
            return (a.orderInBranch || 0) - (b.orderInBranch || 0)
          })
        setBranchArticles(allArticles)
      }
    } catch (error) {
      console.error('Error fetching branch articles:', error)
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

  const handleDeleteArticle = async () => {
    if (!article) return

    const confirmed = window.confirm(`Är du säker på att du vill ta bort "${article.title}"? Detta går inte att ångra.`)
    if (!confirmed) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Artikel borttagen')
        router.push('/dashboard/articles/skill-tree')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Kunde inte ta bort artikel')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsDeleting(false)
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

  // Calculate branch progress
  const branchProgress = branchArticles.length > 0
    ? {
        completed: branchArticles.filter(a => a.progress?.[0]?.completed).length,
        total: branchArticles.length,
        percentage: Math.round((branchArticles.filter(a => a.progress?.[0]?.completed).length / branchArticles.length) * 100)
      }
    : null

  // Find next and previous articles in branch
  const currentIndex = branchArticles.findIndex(a => a.id === articleId)
  const nextBranchArticle = currentIndex >= 0 && currentIndex < branchArticles.length - 1
    ? branchArticles[currentIndex + 1]
    : null
  const previousBranchArticle = currentIndex > 0
    ? branchArticles[currentIndex - 1]
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
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-gold-primary/20 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          {/* Branch Progress Bar */}
          {branchProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-gray-400">{article.skillTreeBranch?.name || article.category?.name || 'Artikel'}</span>
                <span className="font-medium text-gold-light">
                  {branchProgress.completed} av {branchProgress.total} artiklar lästa
                </span>
              </div>
              <Progress value={branchProgress.percentage} className="h-2 bg-[rgba(255,215,0,0.2)]" />
            </div>
          )}
        </div>
      </div>

      {/* Article Content */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            onClick={() => router.push('/dashboard/articles/skill-tree')}
            variant="ghost"
            className="mb-4 text-gray-400 hover:text-white hover:bg-white/10 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Kunskapskartan
          </Button>

          {/* Cover Image */}
          {article.coverImage && (
            <div className="mb-4 sm:mb-8 rounded-lg overflow-hidden border border-gold-primary/20">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-40 sm:h-64 object-cover"
              />
            </div>
          )}

          {/* Article Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {article.category?.name && (
                <Badge className="bg-[rgba(255,215,0,0.2)] text-gold-light border-gold-primary/30 text-xs">{article.category.name}</Badge>
              )}
              {article.phase && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.2)] text-xs">Fas {article.phase}</Badge>
              )}
              {article.difficulty && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.2)] text-xs">{getDifficultyLabel(article.difficulty)}</Badge>
              )}
              {article.estimatedReadingMinutes && (
                <Badge className="bg-[rgba(255,255,255,0.05)] text-gray-300 border-[rgba(255,255,255,0.2)] flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {article.estimatedReadingMinutes} min
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-[rgba(34,197,94,0.2)] text-green-500 border-[#22c55e] flex items-center gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  Läst
                </Badge>
              )}
            </div>
            <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{article.title}</h1>
              {isCoach && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    onClick={() => router.push(`/dashboard/content/articles/${article.id}`)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    title="Redigera artikel"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={handleDeleteArticle}
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                    title="Ta bort artikel"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>

            {/* Article Metadata */}
            <ArticleMetadata
              readingTime={article.estimatedReadingMinutes}
              updatedAt={new Date(article.updatedAt)}
              lastReviewed={article.lastReviewed ? new Date(article.lastReviewed) : null}
              version={article.version}
              className="mb-4 sm:mb-6"
            />
          </div>

          {/* Article Content */}
          <Card className="bg-white border-gold-primary/30">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none prose-headings:text-[#1a0933] prose-headings:font-bold prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-[#1a0933] prose-strong:font-semibold prose-li:text-gray-800 prose-a:text-[#1a0933] prose-a:hover:text-orange-500 prose-a:underline prose-blockquote:border-l-[#FFD700] prose-blockquote:text-gray-700 prose-code:text-[#1a0933] prose-code:bg-gray-100 prose-pre:bg-gray-100 prose-pre:text-gray-900 prose-img:rounded-lg">
                <MDXPreview content={article.content} />
              </div>
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <div className="mt-4 sm:mt-8">
            {/* Mark as Complete Button */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <Button
                onClick={handleToggleComplete}
                disabled={isMarkingComplete}
                size="lg"
                className={`w-full sm:w-auto sm:min-w-[200px] text-sm sm:text-base ${isCompleted
                  ? 'bg-[rgba(34,197,94,0.2)] text-green-500 border-[#22c55e] hover:bg-[rgba(34,197,94,0.3)]'
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-gold-primary/20">
              {previousBranchArticle ? (
                <Button
                  onClick={() => router.push(`/dashboard/articles/${previousBranchArticle.id}`)}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500] text-sm sm:text-base order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Föregående
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard/articles/skill-tree')}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500] text-sm sm:text-base order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tillbaka till Kunskapskartan</span>
                  <span className="sm:hidden">Tillbaka</span>
                </Button>
              )}

              {nextBranchArticle ? (
                <Button
                  onClick={() => router.push(`/dashboard/articles/${nextBranchArticle.id}`)}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500] text-sm sm:text-base order-1 sm:order-2"
                >
                  Nästa artikel
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/dashboard/articles/skill-tree')}
                  className="bg-[#FFD700] text-black hover:bg-[#FFA500] text-sm sm:text-base order-1 sm:order-2"
                >
                  <span className="hidden sm:inline">Tillbaka till Kunskapskartan</span>
                  <span className="sm:hidden">Kunskapskartan</span>
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
