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
  section?: string | null
  orderIndex: number
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
      const response = await fetch('/api/article-categories?audience=client')
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
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Kunskapsbanken
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Utforska artiklar organiserade efter kategori
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Category Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">
              Inga artikelkategorier ännu
            </p>
            <p className="text-sm text-gray-400">
              Kategorier kommer att visas här när de skapas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Group categories by section */}
          {(() => {
            // Get unique sections in order (based on first category's orderIndex in each section)
            const sectionsMap = new Map<string, ArticleCategory[]>()

            categories.forEach(cat => {
              const sectionName = cat.section || 'Övrigt'
              if (!sectionsMap.has(sectionName)) {
                sectionsMap.set(sectionName, [])
              }
              sectionsMap.get(sectionName)!.push(cat)
            })

            // Sort sections by the lowest orderIndex of their categories
            const sortedSections = Array.from(sectionsMap.entries()).sort((a, b) => {
              const aMinOrder = Math.min(...a[1].map(c => c.orderIndex))
              const bMinOrder = Math.min(...b[1].map(c => c.orderIndex))
              return aMinOrder - bMinOrder
            })

            return sortedSections.map(([sectionName, sectionCategories]) => (
              <div key={sectionName}>
                {/* Section Header */}
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">
                  {sectionName}
                </h2>

                {/* Categories in this section */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {sectionCategories.map((category) => {
                    const Icon = getIconComponent(category.icon, category.name)
                    const categoryColor = category.color || '#8b5cf6'

                    return (
                      <div
                        key={category.id}
                        onClick={() => router.push(`/dashboard/articles/category/${category.slug}`)}
                        className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center"
                      >
                        <div
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md"
                          style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)` }}
                        >
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">
                          {category.name}
                        </h3>
                        <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5">
                          {category._count.articles} {category._count.articles === 1 ? 'artikel' : 'artiklar'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
