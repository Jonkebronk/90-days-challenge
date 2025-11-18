'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Search, Clock, ArrowLeft, CheckCircle } from 'lucide-react'
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
  const [searchQuery, setSearchQuery] = useState('')

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

      // Fetch category info
      const categoryResponse = await fetch('/api/article-categories')
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        const foundCategory = categoryData.categories.find((c: ArticleCategory) => c.slug === slug)
        if (foundCategory) {
          setCategory(foundCategory)

          // Fetch articles for this category
          const articlesResponse = await fetch(`/api/articles?categoryId=${foundCategory.id}&published=true`)
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

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/articles')}
          className="flex items-center gap-2 text-gray-400 hover:text-gold-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka till kategorier</span>
        </button>

        <div className="text-center">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-20" />

          <div className="flex items-center justify-center gap-4 mb-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Icon className="h-8 w-8" style={{ color: categoryColor }} />
            </div>
            <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
              {category.name}
            </h1>
          </div>

          <p className="text-gray-400 text-sm tracking-[1px]">
            {filteredArticles.length} {filteredArticles.length === 1 ? 'artikel' : 'artiklar'}
          </p>

          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Sök artiklar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-gold-primary/20 text-gray-200 placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Articles */}
      {filteredArticles.length === 0 ? (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              {searchQuery ? 'Inga artiklar hittades' : 'Inga artiklar i denna kategori ännu'}
            </p>
            {searchQuery && (
              <p className="text-sm text-[rgba(255,255,255,0.4)]">
                Prova en annan sökning
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const isCompleted = isArticleCompleted(article)
            const phaseColors = getPhaseColors(article.phase as Phase)

            return (
              <Card
                key={article.id}
                onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                className="group relative bg-white/5 border-2 border-gold-primary/20 hover:border-gold-primary/60 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-[10px] overflow-hidden"
              >
                {/* Cover Image */}
                {article.coverImage ? (
                  <div className="h-48 w-full bg-gray-900 overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 w-full bg-gradient-to-br from-gold-primary/10 to-gold-secondary/10 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-gold-primary/30" />
                  </div>
                )}

                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gold-light mb-2 tracking-[1px] group-hover:text-gold-primary transition-colors">
                    {article.title}
                  </h3>

                  {article.description && (
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    {article.estimatedReadingMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{article.estimatedReadingMinutes} min</span>
                      </div>
                    )}
                    {article.difficulty && (
                      <span className="text-xs">
                        {getDifficultyLabel(article.difficulty)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {article.phase && (
                      <Badge className={`text-xs ${phaseColors.badge}`}>
                        Fas {article.phase}
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Läst
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
