'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { ArticleCard } from '@/components/article-card'
import { DownloadPdfButton } from '@/components/download-pdf-button'

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

export default function CoachArticlesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is a coach
  const isCoach = (session?.user as any)?.role === 'coach'

  useEffect(() => {
    if (session?.user && isCoach) {
      fetchArticles()
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

        {/* PDF Download Button */}
        <div className="mt-4">
          <DownloadPdfButton
            audience="coach"
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50"
          />
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
