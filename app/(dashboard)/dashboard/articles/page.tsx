'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'
import { getCategoryIcon } from '@/lib/icons/category-icons'

type ArticleCategory = {
  id: string
  name: string
  slug: string
  color?: string
  icon?: string
  _count: {
    articles: number
  }
}

export default function ArticlesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/article-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        toast.error('Kunde inte hämta kategorier')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
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
    // Fallback to getCategoryIcon helper
    return getCategoryIcon(iconName, categoryName || '')
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-20" />
        <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent mb-3">
          Kunskapsbanken
        </h1>
        <p className="text-gray-400 text-sm tracking-[1px]">
          Utforska artiklar organiserade efter kategori
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
      </div>

      {/* Category Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Inga artikelkategorier ännu
            </p>
            <p className="text-sm text-[rgba(255,255,255,0.4)]">
              Kategorier kommer att visas här när de skapas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon, category.name)
            const categoryColor = category.color || '#FFD700'

            return (
              <Card
                key={category.id}
                onClick={() => router.push(`/dashboard/articles/category/${category.slug}`)}
                className="group relative bg-white/5 border-2 border-gold-primary/20 hover:border-gold-primary/60 hover:bg-white/10 transition-all duration-300 cursor-pointer backdrop-blur-[10px] overflow-hidden"
              >
                {/* Gradient Overlay */}
                <div
                  className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${categoryColor}30 0%, transparent 100%)`
                  }}
                />

                <CardContent className="relative p-8 flex flex-col items-center text-center">
                  {/* Icon */}
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <Icon className="h-10 w-10" style={{ color: categoryColor }} />
                  </div>

                  {/* Category Name */}
                  <h3 className="text-xl font-bold text-gold-light mb-2 tracking-[1px]">
                    {category.name}
                  </h3>

                  {/* Article Count */}
                  <p className="text-gray-400 text-sm">
                    {category._count.articles} {category._count.articles === 1 ? 'artikel' : 'artiklar'}
                  </p>

                  {/* Arrow indicator */}
                  <div className="mt-4 text-gold-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
