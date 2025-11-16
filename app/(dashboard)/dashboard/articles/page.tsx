'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Search, CheckCircle, Circle, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { getCategoryIcon } from '@/lib/icons/category-icons'
import { getPhaseColors, getPhaseShortName, type Phase } from '@/lib/utils/phase-colors'

type ArticleCategory = {
  id: string
  name: string
  description?: string | null
  section?: string | null
  color?: string
  icon?: string
  orderIndex?: number
}

type ArticleProgress = {
  completed: boolean
  lastReadAt?: Date
}

type Article = {
  id: string
  title: string
  slug: string
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
  coverImage?: string | null
  orderIndex?: number
  updatedAt?: string
  category: ArticleCategory
  progress?: ArticleProgress[]
}

function ArticleBankContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')

  useEffect(() => {
    if (session?.user) {
      const query = searchParams?.get('q')
      if (query) {
        setSearchQuery(query)
        fetchSearchResults(query)
      } else {
        fetchArticles()
      }
      fetchCategories()
    }
  }, [session, searchParams])

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/articles?published=true')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
      } else {
        toast.error('Kunde inte hämta artiklar')
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/article-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSearchResults = async (query: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        // Transform search results to match Article type
        const transformedArticles = data.articles.map((result: any) => ({
          id: result.id,
          title: result.title,
          slug: result.slug,
          difficulty: result.difficulty,
          phase: result.phase,
          estimatedReadingMinutes: result.estimatedReadingMinutes,
          coverImage: result.coverImage,
          orderIndex: 0,
          updatedAt: result.updatedAt,
          category: {
            id: result.categoryId || '',
            name: result.categoryName,
            color: result.categoryColor,
            icon: result.categoryIcon
          },
          progress: result.isRead ? [{ completed: true }] : []
        }))
        setArticles(transformedArticles)
      } else {
        toast.error('Kunde inte söka artiklar')
      }
    } catch (error) {
      console.error('Error searching articles:', error)
      toast.error('Ett fel uppstod vid sökning')
    } finally {
      setIsLoading(false)
    }
  }

  const isArticleCompleted = (article: Article) => {
    return article.progress && article.progress.length > 0 && article.progress[0].completed
  }

  // Group by category
  const articlesByCategory = articles.reduce((acc, article) => {
    const categoryName = article.category.name
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(article)
    return acc
  }, {} as Record<string, Article[]>)

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

  // Sort categories by orderIndex
  const sortedCategories = [...categories].sort((a: any, b: any) =>
    (a.orderIndex || 0) - (b.orderIndex || 0)
  )

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-20" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-3">
            Kunskapsbanken
          </h1>
          <p className="text-gray-600 text-sm tracking-[1px]">
            Din kunskapsresa genom de 90 dagarna
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Sökresultat för &quot;{searchQuery}&quot;
                <span className="text-gray-500 ml-2">({articles.length})</span>
              </h2>
              <Button
                onClick={() => {
                  router.push('/dashboard/articles')
                  setSearchQuery('')
                  fetchArticles()
                }}
                variant="ghost"
                className="text-gold-primary hover:text-gold-secondary"
              >
                Rensa sökning
              </Button>
            </div>

            {/* Search Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map(article => {
                const Icon = getCategoryIcon(article.category.icon, article.category.name)
                const phaseColors = getPhaseColors(article.phase as Phase)
                const isCompleted = isArticleCompleted(article)

                return (
                  <Card
                    key={article.id}
                    onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                    className="cursor-pointer hover:border-gold-primary transition-all bg-white border-gray-200"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${phaseColors.bg}`}>
                          <Icon className={`h-5 w-5 ${phaseColors.text}`} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">{article.title}</h3>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="text-xs bg-gold-primary/10 text-gold-primary border-gold-primary/30">
                              {article.category.name}
                            </Badge>
                            {article.phase && (
                              <Badge className={`text-xs ${phaseColors.badge}`}>
                                Fas {article.phase}
                              </Badge>
                            )}
                            {article.estimatedReadingMinutes && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                {article.estimatedReadingMinutes} min
                              </div>
                            )}
                            {isCompleted && (
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Läst
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {articles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Inga artiklar hittades för &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Categories Grid */}
        {!searchQuery && (
          isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Laddar artiklar...</p>
            </div>
          ) : (
            <>
            {/* Group categories by section */}
            {(() => {
              // Group categories by section
              const categoriesBySection = sortedCategories.reduce((acc: Record<string, any[]>, category: any) => {
                const sectionName = category.section || 'Övrigt'
                if (!acc[sectionName]) {
                  acc[sectionName] = []
                }
                acc[sectionName].push(category)
                return acc
              }, {})

              // Get section order (sections with categories come first, then "Övrigt")
              const sectionOrder = Object.keys(categoriesBySection).sort((a, b) => {
                if (a === 'Övrigt') return 1
                if (b === 'Övrigt') return -1
                return 0
              })

              return sectionOrder.map(sectionName => (
                <div key={sectionName} className="mb-12">
                  {/* Section Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-black tracking-wider uppercase text-gold-primary mb-2">
                      {sectionName}
                    </h2>
                    <div className="h-[1px] bg-gradient-to-r from-gold-primary via-gold-primary/30 to-transparent" />
                  </div>

                  {/* Categories Grid for this section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoriesBySection[sectionName].map((category: any) => {
              const categoryArticles = articles.filter(a => a.category.id === category.id)

              if (categoryArticles.length === 0) return null

              const categoryColor = category.color || '#FFD700'
              const isExpanded = expandedCategories[category.id]
              const displayedArticles = isExpanded ? categoryArticles : []

              return (
                <div key={category.id} className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-gold-primary transition-all duration-300">
                  {/* Category Header with Icon */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedCategories(prev => ({
                        ...prev,
                        [category.id]: !prev[category.id]
                      }))
                    }}
                    className="relative h-28 flex items-center justify-center gap-3 px-4 cursor-pointer bg-gradient-to-br from-gray-50 to-white"
                    style={{
                      borderBottom: `2px solid ${categoryColor}20`
                    }}
                  >
                    {/* Category Icon */}
                    {(() => {
                      const CategoryIcon = getCategoryIcon(category.icon, category.name)
                      return (
                        <div className="flex-shrink-0">
                          <CategoryIcon className="h-10 w-10" style={{ color: categoryColor }} />
                        </div>
                      )
                    })()}

                    <h2
                      className="text-xl font-black tracking-wider uppercase z-10 text-center leading-tight text-gray-700"
                    >
                      {category.name}
                    </h2>
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-white/80 backdrop-blur-sm">
                      <span className="text-[10px] font-medium" style={{ color: categoryColor }}>
                        {categoryArticles.filter(a => isArticleCompleted(a)).length}
                      </span>
                      <span className="text-[10px] text-gray-500"> / {categoryArticles.length}</span>
                    </div>
                    {/* Expand/Collapse indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                      <span className="text-sm" style={{ color: categoryColor }}>
                        {isExpanded ? '↑' : '↓'}
                      </span>
                    </div>
                  </div>

                  {/* Articles List */}
                  {isExpanded && (
                  <div className="flex-1 p-4 space-y-3">
                    {displayedArticles.map(article => {
                      const completed = isArticleCompleted(article)
                      const phaseColors = getPhaseColors(article.phase as Phase)

                      return (
                        <button
                          key={article.id}
                          onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                          className="w-full text-left bg-gray-50 border border-gray-200 rounded-lg p-3.5 hover:border-gold-primary hover:bg-gold-primary/5 hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                        >
                          {/* Phase indicator stripe */}
                          {article.phase && (
                            <div className={`absolute top-0 left-0 right-0 h-1 ${phaseColors.bg}`} />
                          )}

                          <div className="flex items-start gap-3 relative z-10">
                            {/* Completion Status Icon */}
                            {completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                            )}

                            {/* Thumbnail */}
                            {article.coverImage && (
                              <div className="w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                                <img
                                  src={article.coverImage}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-sm font-medium text-gray-900 group-hover:text-gold-primary transition-colors line-clamp-2 leading-snug flex-1">
                                  {article.title}
                                </h3>
                                {/* Phase badge */}
                                {article.phase && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${phaseColors.badge}`}>
                                    {getPhaseShortName(article.phase as Phase)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {article.estimatedReadingMinutes && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{article.estimatedReadingMinutes} min</span>
                                  </div>
                                )}
                                {article.difficulty && (
                                  <span className="px-2 py-0.5 rounded-full bg-gray-200 text-xs">
                                    {getDifficultyLabel(article.difficulty)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  )}
                </div>
              )
                    })}
                  </div>
                </div>
              ))
            })()}
            </>
          )
        )}

        {/* Empty State */}
        {!isLoading && articles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-gold-primary/50 mb-4" />
            <p className="text-gray-500">Inga artiklar publicerade än.</p>
            <p className="text-sm text-gray-400 mt-2">Artiklar kommer snart!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ArticleBankPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Laddar...</p>
      </div>
    }>
      <ArticleBankContent />
    </Suspense>
  )
}
