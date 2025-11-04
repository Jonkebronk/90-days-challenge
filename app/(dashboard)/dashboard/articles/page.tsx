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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artikel Bank</h1>
        <p className="text-muted-foreground mt-1">
          Läs artiklar och lär dig mer om hälsa, träning och nutrition
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök artiklar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla kategorier</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fas</Label>
                <Select value={filterPhase} onValueChange={setFilterPhase}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla faser</SelectItem>
                    <SelectItem value="1">Fas 1 (1-30)</SelectItem>
                    <SelectItem value="2">Fas 2 (31-60)</SelectItem>
                    <SelectItem value="3">Fas 3 (61-90)</SelectItem>
                    <SelectItem value="none">Ingen fas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Svårighetsgrad</Label>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla nivåer</SelectItem>
                    <SelectItem value="beginner">Nybörjare</SelectItem>
                    <SelectItem value="intermediate">Medel</SelectItem>
                    <SelectItem value="advanced">Avancerad</SelectItem>
                    <SelectItem value="none">Ingen nivå</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={filterCompleted} onValueChange={setFilterCompleted}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="true">Lästa</SelectItem>
                    <SelectItem value="false">Olästa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{articles.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Totalt artiklar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {articles.filter(a => isArticleCompleted(a)).length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Lästa artiklar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {articles.length - articles.filter(a => isArticleCompleted(a)).length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Olästa artiklar</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Articles by Category */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Laddar...</p>
          </CardContent>
        </Card>
      ) : Object.keys(articlesByCategory).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Inga artiklar hittades.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prova att ändra dina filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(articlesByCategory).map(([categoryName, categoryArticles]) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {categoryName}
                <Badge variant="outline">{categoryArticles.length} artikel(er)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryArticles.map(article => (
                  <div
                    key={article.id}
                    onClick={() => router.push(`/dashboard/articles/${article.id}`)}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors relative"
                  >
                    {isArticleCompleted(article) && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    )}
                    <h3 className="font-semibold mb-2 pr-8">{article.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {article.phase && (
                        <Badge variant="secondary">Fas {article.phase}</Badge>
                      )}
                      {article.difficulty && (
                        <Badge variant="outline">{getDifficultyLabel(article.difficulty)}</Badge>
                      )}
                      {article.estimatedReadingMinutes && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {article.estimatedReadingMinutes} min
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
