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
            Artikel Bank
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

        {/* Articles by Category - Always Visible */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-[rgba(255,255,255,0.5)]">Laddar artiklar...</p>
          </div>
        ) : sortedCategories.map((category: any) => {
          const categoryArticles = articles.filter(a => a.category.id === category.id)

          if (categoryArticles.length === 0) return null

          const categoryColor = category.color || '#FFD700'

          return (
            <div key={category.id} className="space-y-3">
              {/* Category Header */}
              <div
                className="bg-gradient-to-r to-transparent border-l-4 py-4 px-6 rounded-r-lg"
                style={{
                  borderLeftColor: categoryColor,
                  background: `linear-gradient(to right, ${categoryColor}1a, transparent)`
                }}
              >
                <h2
                  className="font-['Orbitron',sans-serif] text-xl md:text-2xl font-bold tracking-[2px] uppercase flex items-center justify-between"
                  style={{ color: categoryColor }}
                >
                  <span>{category.name}</span>
                  <span
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${categoryColor}33` }}
                  >
                    {categoryArticles.length}
                  </span>
                </h2>
                {category.description && (
                  <p className="text-sm text-[rgba(255,255,255,0.5)] mt-2">{category.description}</p>
                )}
              </div>

              {/* Articles in Category */}
              <div className="space-y-2 pl-4">
                {categoryArticles.map(article => {
                  const completed = isArticleCompleted(article)

                  return (
                    <button
                      key={article.id}
                      onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                      className="w-full text-left bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-lg p-4 backdrop-blur-[10px] transition-all duration-300 hover:border-[rgba(255,215,0,0.5)] hover:bg-[rgba(255,215,0,0.05)] hover:-translate-x-1 hover:shadow-[0_0_20px_rgba(255,215,0,0.1)] group relative overflow-hidden"
                    >
                      {/* Shimmer effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.1)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                      <div className="relative flex items-start gap-4">
                        {/* Status Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {completed ? (
                            <CheckCircle className="h-6 w-6 text-[#22c55e]" />
                          ) : (
                            <Circle className="h-6 w-6 text-[rgba(255,215,0,0.4)]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg mb-2 group-hover:text-[#FFD700] transition-colors">
                            {article.title}
                          </h3>

                          {/* Metadata */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            {article.difficulty && (
                              <span className="px-2 py-1 bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded text-[rgba(255,215,0,0.8)]">
                                {getDifficultyLabel(article.difficulty)}
                              </span>
                            )}
                            {article.estimatedReadingMinutes && (
                              <span className="px-2 py-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded text-[rgba(255,255,255,0.6)] flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {article.estimatedReadingMinutes} min
                              </span>
                            )}
                            {completed && (
                              <span className="px-2 py-1 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.3)] rounded text-[#22c55e]">
                                ✓ Läst
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 text-[rgba(255,215,0,0.4)] group-hover:text-[#FFD700] group-hover:translate-x-1 transition-all">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
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
