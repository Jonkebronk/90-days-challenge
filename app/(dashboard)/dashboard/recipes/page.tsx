'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { ChefHat } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

type RecipeCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  _count: {
    recipes: number
  }
}

export default function RecipesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recipe-categories')
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

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return ChefHat
    const Icon = (LucideIcons as any)[iconName] || ChefHat
    return Icon
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
          Receptbank
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Utforska recept organiserade efter måltidstyp
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
          <CardContent className="text-center py-12">
            <ChefHat className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              Inga receptkategorier ännu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon)
            const categoryColor = category.color || '#f97316'
            return (
              <div
                key={category.id}
                onClick={() => router.push(`/dashboard/recipes/category/${category.slug}`)}
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
                  {category._count.recipes} recept
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
