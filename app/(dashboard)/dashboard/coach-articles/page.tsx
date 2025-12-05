'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ArticleCard } from '@/components/article-card'
import { DownloadPdfButton } from '@/components/download-pdf-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Article = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  coverImage: string | null
  readTimeMinutes: number | null
  category: {
    name: string
    slug: string
    color: string | null
  }
}

type Category = {
  id: string
  name: string
  slug: string
}

export default function CoachArticlesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryForPdf, setSelectedCategoryForPdf] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is a coach
  const isCoach = (session?.user as any)?.role === 'coach'

  useEffect(() => {
    if (session?.user && isCoach) {
      fetchArticles()
      fetchCategories()
    } else if (session && !isCoach) {
      router.push('/dashboard')
    }
  }, [session, isCoach])

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/articles?audience=coach')

      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
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
      const response = await fetch('/api/article-categories?audience=coach')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  if (!session?.user || !isCoach) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-purple-400 mb-4" />
            <p className="text-gray-500">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
          Coach Kunskapsbank
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Resurser och guider för dig som coach
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-4 sm:mt-6 opacity-30" />

        {/* PDF Download Section */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-gray-600 text-sm">
            Föredrar du att läsa på papper? Ladda ner en kategori som PDF:
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Select value={selectedCategoryForPdf} onValueChange={setSelectedCategoryForPdf}>
              <SelectTrigger className="w-[250px] bg-white border-purple-300 text-gray-900">
                <SelectValue placeholder="Välj kategori att ladda ner" />
              </SelectTrigger>
              <SelectContent className="bg-white border-purple-300">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id}
                    className="text-gray-900 hover:bg-purple-100 focus:bg-purple-100"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategoryForPdf && (
              <DownloadPdfButton
                audience="coach"
                categoryId={selectedCategoryForPdf}
                categoryName={categories.find(c => c.id === selectedCategoryForPdf)?.name}
                variant="default"
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-400 hover:to-purple-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : articles.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              Inga coach-artiklar ännu
            </p>
            <p className="text-sm text-gray-400">
              Artiklar kommer att visas här när de skapas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              id={article.id}
              title={article.title}
              description={article.excerpt}
              coverImage={article.coverImage}
              readingTime={article.readTimeMinutes}
              categoryName={article.category?.name || 'Coach'}
            />
          ))}
        </div>
      )}
    </div>
  )
}
