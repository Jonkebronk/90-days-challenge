'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type NutritionItem = {
  id: string
  name: string
  valuePer100g: number
  order: number
}

type NutritionCategory = {
  id: string
  key: string
  name: string
  order: number
  items: NutritionItem[]
}

export default function ProteinOverviewPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<NutritionCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/nutrition-categories?type=protein')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching protein data:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/content/food-items')}
          className="flex items-center gap-2 text-gray-500 hover:text-gold-primary transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka</span>
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-3 sm:mb-4 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-2">
            Protein
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-3 sm:mt-4 opacity-30" />
        </div>
      </div>

      {/* Protein List */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {categories.map((category) => (
            <div key={category.key} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                {category.name}
              </h3>
              <div className="space-y-1.5">
                {category.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-2 py-1.5 bg-gray-50 rounded-lg"
                  >
                    <p className="text-gray-700 text-xs sm:text-sm">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl max-w-6xl mx-auto">
          <div className="py-8">
            <p className="text-gray-500 text-center">
              Ingen data tillgänglig
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
