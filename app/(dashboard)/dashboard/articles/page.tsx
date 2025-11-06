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

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterCompleted, setFilterCompleted] = useState<string>('all')

  // Show all state per category
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

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
      <div className="container mx-auto p-6 space-y-8 max-w-5xl">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] text-center">
            <p className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {articles.length}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1 tracking-[1px]">TOTALT</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(34,197,94,0.2)] rounded-xl p-4 backdrop-blur-[10px] text-center">
            <p className="text-3xl font-bold text-[#22c55e]">
              {articles.filter(a => isArticleCompleted(a)).length}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1 tracking-[1px]">LÄSTA</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-4 backdrop-blur-[10px] text-center col-span-2 md:col-span-1">
            <p className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {articles.length - articles.filter(a => isArticleCompleted(a)).length}
            </p>
            <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1 tracking-[1px]">KVAR ATT LÄSA</p>
          </div>
        </div>

        {/* Articles by Category - Grid Layout */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[rgba(255,255,255,0.5)]">Laddar artiklar...</p>
          </div>
        ) : sortedCategories.map((category: any) => {
          const categoryArticles = articles.filter(a => a.category.id === category.id)

          if (categoryArticles.length === 0) return null

          const categoryColor = category.color || '#FFD700'
          const isExpanded = expandedCategories[category.id] || false
          const displayedArticles = isExpanded ? categoryArticles : categoryArticles.slice(0, 3)

          return (
            <div key={category.id} className="space-y-6">
              {/* Large Category Header with Background */}
              <div className="relative rounded-2xl overflow-hidden mb-6" style={{ minHeight: category.description ? '140px' : '120px' }}>
                {/* Background gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}10)`
                  }}
                />
                {/* Pattern overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {/* Category content */}
                <div className="relative z-10 h-full flex flex-col justify-center px-8 py-6">
                  <div className="flex items-center justify-between">
                    <h2
                      className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
                      style={{ color: categoryColor }}
                    >
                      {category.name}
                    </h2>
                    <span
                      className="ml-4 text-lg font-bold px-4 py-2 rounded-full backdrop-blur-md flex-shrink-0"
                      style={{
                        backgroundColor: `${categoryColor}33`,
                        color: categoryColor,
                        border: `2px solid ${categoryColor}`
                      }}
                    >
                      {categoryArticles.length}
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-[rgba(255,255,255,0.7)] text-sm mt-3 max-w-3xl leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Articles List - Horizontal Cards */}
              <div className="space-y-3">
                {displayedArticles.map(article => {
                  const completed = isArticleCompleted(article)

                  return (
                    <button
                      key={article.id}
                      onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                      className="w-full text-left bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] transition-all duration-200 hover:border-[rgba(255,215,0,0.5)] hover:bg-[rgba(255,215,0,0.05)] hover:shadow-[0_4px_20px_rgba(255,215,0,0.15)] group overflow-hidden"
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Thumbnail - Left Side */}
                        {article.coverImage ? (
                          <div className="w-24 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <img
                              src={article.coverImage}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-24 h-20 flex-shrink-0 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${categoryColor}15` }}
                          >
                            <BookOpen className="h-8 w-8" style={{ color: `${categoryColor}80` }} />
                          </div>
                        )}

                        {/* Content - Middle */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-base mb-1 group-hover:text-[#FFD700] transition-colors line-clamp-1">
                            {article.title}
                          </h3>
                          <p className="text-sm text-[rgba(255,255,255,0.5)] line-clamp-1">
                            {article.difficulty && getDifficultyLabel(article.difficulty)}
                          </p>
                        </div>

                        {/* Metadata - Right Side */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Reading time */}
                          {article.estimatedReadingMinutes && (
                            <div className="flex items-center gap-1 text-[rgba(255,255,255,0.6)] text-sm">
                              <Clock className="h-4 w-4" />
                              <span>{article.estimatedReadingMinutes} min</span>
                            </div>
                          )}

                          {/* Completion status */}
                          {completed ? (
                            <CheckCircle className="h-5 w-5 text-[#22c55e]" />
                          ) : (
                            <Circle className="h-5 w-5 text-[rgba(255,255,255,0.2)]" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Show More Button */}
              {categoryArticles.length > 3 && (
                <div className="text-center pt-4">
                  <Button
                    onClick={() => setExpandedCategories(prev => ({
                      ...prev,
                      [category.id]: !isExpanded
                    }))}
                    variant="outline"
                    className="border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)] hover:border-[#FFD700] transition-all"
                  >
                    {isExpanded ? 'Visa mindre' : `Visa alla (${categoryArticles.length})`}
                  </Button>
                </div>
              )}
            </div>
          )
        })}

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
