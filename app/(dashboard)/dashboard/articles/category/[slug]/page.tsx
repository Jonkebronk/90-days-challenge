'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, ArrowLeft, CheckCircle } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { getPhaseColors, type Phase } from '@/lib/utils/phase-colors'

type ArticleCategory = {
  id: string
  name: string
  slug: string
  color?: string
  icon?: string
}

type ArticleProgress = {
  completed: boolean
}

type Article = {
  id: string
  title: string
  slug: string
  description?: string | null
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
  coverImage?: string | null
  category: ArticleCategory
  progress?: ArticleProgress[]
}

export default function ArticleCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [slug, setSlug] = useState<string>('')
  const [category, setCategory] = useState<ArticleCategory | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (session?.user && slug) {
      fetchCategoryAndArticles()
    }
  }, [session, slug])

  const fetchCategoryAndArticles = async () => {
    try {
      setIsLoading(true)

      // Fetch category info (client categories only)
      const categoryResponse = await fetch('/api/article-categories?audience=client')
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        const foundCategory = categoryData.categories.find((c: ArticleCategory) => c.slug === slug)
        if (foundCategory) {
          setCategory(foundCategory)

          // Fetch articles for this category
          const articlesResponse = await fetch(`/api/articles?categoryId=${foundCategory.id}&published=true&audience=client`)
          if (articlesResponse.ok) {
            const articlesData = await articlesResponse.json()
            setArticles(articlesData.articles)
          }
        } else {
          toast.error('Kategori hittades inte')
          router.push('/dashboard/articles')
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const getIconComponent = (iconName?: string, categoryName?: string) => {
    if (iconName) {
      const Icon = (LucideIcons as any)[iconName]
      if (Icon) return Icon
    }
    return getCategoryIcon(iconName, categoryName || '')
  }

  const isArticleCompleted = (article: Article) => {
    return article.progress && article.progress.length > 0 && article.progress[0].completed
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
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!category) {
    return null
  }

  const Icon = getIconComponent(category.icon, category.name)
  const categoryColor = category.color || '#FFD700'

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/articles')}
          className="flex items-center gap-2 text-gray-500 hover:text-gold-primary transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka</span>
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-3 sm:mb-4 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-2">
            {category.name}
          </h1>
          <p className="text-gray-400 text-xs">
            {articles.length} {articles.length === 1 ? 'artikel' : 'artiklar'}
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-3 sm:mt-4 opacity-30" />
        </div>
      </div>

      {/* Articles */}
      {articles.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              Inga artiklar i denna kategori ännu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {articles.map((article) => {
            const isCompleted = isArticleCompleted(article)

            return (
              <div
                key={article.id}
                onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* Cover Image */}
                {article.coverImage ? (
                  <div className="h-20 sm:h-24 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-20 sm:h-24 w-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-purple-300" />
                  </div>
                )}

                <div className="p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-gold-primary transition-colors">
                    {article.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1.5">
                    {article.estimatedReadingMinutes && (
                      <div className="flex items-center gap-0.5 text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]">{article.estimatedReadingMinutes}m</span>
                      </div>
                    )}
                    {isCompleted && (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
