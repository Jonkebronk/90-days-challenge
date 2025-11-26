'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Apple,
  ChevronRight,
  Beef,
  Droplet,
  Wheat,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

type FoodCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  _count: {
    foodItems: number
  }
}

export default function FoodItemsCategoriesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/food-categories?includeCounts=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
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

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent || Apple
  }

  if (!session?.user) {
    return null
  }

  const isCoach = (session.user as any).role === 'coach'

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-gray-400 text-center py-8">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-3 sm:mb-4 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-2">
          Livsmedelbanken
        </h1>
        <p className="text-gray-400 text-xs">
          Välj en kategori för att se livsmedel
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-3 sm:mt-4 opacity-30" />
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <Apple className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              Inga kategorier ännu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon)
            const categoryColor = category.color || '#22c55e'
            return (
              <div
                key={category.id}
                onClick={() => router.push(`/dashboard/content/food-items/category/${category.slug}`)}
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
                  {category._count?.foodItems || 0} livsmedel
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Nutrition Overviews Section */}
      <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 max-w-6xl mx-auto">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 text-center">
          Näringsöversikter
        </h2>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Protein Overview Card */}
          <div
            onClick={() => router.push('/dashboard/content/food-items/overviews/protein')}
            className="group relative bg-white border border-gray-200 rounded-xl p-2 sm:p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shadow-md">
              <Beef className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 text-center">Protein</h3>
          </div>

          {/* Fat Overview Card */}
          <div
            onClick={() => router.push('/dashboard/content/food-items/overviews/fett')}
            className="group relative bg-white border border-gray-200 rounded-xl p-2 sm:p-4 hover:border-yellow-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shadow-md">
              <Droplet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 text-center">Fett</h3>
          </div>

          {/* Carbs Overview Card */}
          <div
            onClick={() => router.push('/dashboard/content/food-items/overviews/kolhydrater')}
            className="group relative bg-white border border-gray-200 rounded-xl p-2 sm:p-4 hover:border-orange-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform shadow-md">
              <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 text-center">Kolhydrater</h3>
          </div>
        </div>
      </div>
    </div>
  )
}
