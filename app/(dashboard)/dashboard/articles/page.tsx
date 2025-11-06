'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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

type ArticleCategory = {
  id: string
  name: string
  description?: string | null
  color?: string
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
  category: ArticleCategory
  progress?: ArticleProgress[]
}

export default function ArticleBankPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterCompleted, setFilterCompleted] = useState<string>('all')

  useEffect(() => {
    if (session?.user) {
      fetchArticles()
      fetchCategories()
    }
  }, [session])

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

  const isArticleCompleted = (article: Article) => {
    return article.progress && article.progress.length > 0 && article.progress[0].completed
  }

  const filteredArticles = articles.filter(article => {
    // Search filter
    if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Category filter
    if (filterCategory !== 'all' && article.category.id !== filterCategory) return false

    // Phase filter
    if (filterPhase !== 'all') {
      if (filterPhase === 'none' && article.phase !== null) return false
      if (filterPhase !== 'none' && article.phase?.toString() !== filterPhase) return false
    }

    // Difficulty filter
    if (filterDifficulty !== 'all') {
      if (filterDifficulty === 'none' && article.difficulty !== null) return false
      if (filterDifficulty !== 'none' && article.difficulty !== filterDifficulty) return false
    }

    // Completed filter
    if (filterCompleted !== 'all') {
      const completed = isArticleCompleted(article)
      if (filterCompleted === 'true' && !completed) return false
      if (filterCompleted === 'false' && completed) return false
    }

    return true
  })

  // Group by category
  const articlesByCategory = filteredArticles.reduce((acc, article) => {
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0933] to-[#0a0a0a]">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Kunskapsbanken
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Din kunskapsresa genom de 90 dagarna
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Compact Stats Bar */}
        <div className="flex items-center justify-center gap-8 mb-8 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[rgba(255,255,255,0.5)]">Totalt:</span>
            <span className="text-[#FFD700] font-semibold">{articles.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[rgba(255,255,255,0.5)]">Lästa:</span>
            <span className="text-[#22c55e] font-semibold">{articles.filter(a => isArticleCompleted(a)).length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[rgba(255,255,255,0.5)]">Kvar:</span>
            <span className="text-[#FFD700] font-semibold">{articles.length - articles.filter(a => isArticleCompleted(a)).length}</span>
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[rgba(255,255,255,0.5)]">Laddar artiklar...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCategories.map((category: any) => {
              const categoryArticles = articles.filter(a => a.category.id === category.id)

              if (categoryArticles.length === 0) return null

              const categoryColor = category.color || '#FFD700'
              const isExpanded = expandedCategories[category.id]
              const displayedArticles = isExpanded ? categoryArticles : categoryArticles.slice(0, 3)
              const hasMore = categoryArticles.length > 3

              return (
                <div key={category.id} className="flex flex-col bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-xl overflow-hidden shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-black/50 hover:border-[rgba(255,215,0,0.35)] transition-all duration-300">
                  {/* Category Header with Image/Gradient */}
                  <div
                    className="relative h-28 flex items-center justify-center px-4"
                    style={{
                      background: `linear-gradient(135deg, ${categoryColor}33, ${categoryColor}15)`
                    }}
                  >
                    <h2
                      className="text-xl font-black tracking-wider uppercase z-10 text-center leading-tight"
                      style={{ color: categoryColor }}
                    >
                      {category.name}
                    </h2>
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                      <span className="text-xs font-semibold" style={{ color: categoryColor }}>
                        {categoryArticles.filter(a => isArticleCompleted(a)).length}
                      </span>
                      <span className="text-xs text-[rgba(255,255,255,0.5)]"> / {categoryArticles.length}</span>
                    </div>
                  </div>

                  {/* Articles List */}
                  <div className="flex-1 p-4 space-y-3">
                    {displayedArticles.map(article => {
                      const completed = isArticleCompleted(article)

                      return (
                        <button
                          key={article.id}
                          onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                          className="w-full text-left bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.15)] rounded-lg p-3.5 hover:border-[rgba(255,215,0,0.5)] hover:bg-[rgba(255,215,0,0.08)] hover:scale-[1.02] transition-all duration-200 group relative overflow-hidden"
                        >
                          {/* Subtle glow on hover */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="flex items-start gap-3 relative z-10">
                            {/* Completion Status Icon */}
                            {completed ? (
                              <CheckCircle className="h-5 w-5 text-[#22c55e] flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-5 w-5 text-[rgba(255,255,255,0.2)] flex-shrink-0 mt-0.5" />
                            )}

                            {/* Thumbnail */}
                            {article.coverImage && (
                              <div className="w-20 h-14 flex-shrink-0 rounded-md overflow-hidden bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.1)]">
                                <img
                                  src={article.coverImage}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-white group-hover:text-[#FFD700] transition-colors line-clamp-2 mb-2 leading-snug">
                                {article.title}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-[rgba(255,255,255,0.5)]">
                                {article.estimatedReadingMinutes && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{article.estimatedReadingMinutes} min</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* "Mer" Button */}
                  {hasMore && (
                    <div className="px-4 pb-4 pt-2">
                      <button
                        onClick={() => setExpandedCategories(prev => ({
                          ...prev,
                          [category.id]: !prev[category.id]
                        }))}
                        className="w-full py-2.5 text-sm font-semibold text-[#FFD700] hover:text-white bg-[rgba(255,215,0,0.05)] hover:bg-[rgba(255,215,0,0.12)] border border-[rgba(255,215,0,0.3)] hover:border-[rgba(255,215,0,0.6)] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        style={{
                          boxShadow: isExpanded ? `0 0 10px ${categoryColor}22` : 'none'
                        }}
                      >
                        {isExpanded ? '↑ Visa mindre' : '↓ Mer'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && articles.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.3)] mb-4" />
            <p className="text-[rgba(255,255,255,0.5)]">Inga artiklar publicerade än.</p>
            <p className="text-sm text-[rgba(255,255,255,0.3)] mt-2">Artiklar kommer snart!</p>
          </div>
        )}
      </div>
    </div>
  )
}
