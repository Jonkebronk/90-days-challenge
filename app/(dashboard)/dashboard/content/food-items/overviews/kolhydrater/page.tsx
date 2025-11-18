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

export default function KolhydraterOverviewPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<NutritionCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/nutrition-categories?type=carbs')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching carbs data:', error)
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/content/food-items')}
          className="text-gray-400 hover:text-gold-light hover:bg-gold-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            Kolhydrater
          </h1>
          <p className="text-gray-400 mt-1">
            Gram kolhydrater per portion
          </p>
        </div>
      </div>

      {/* Carbs List */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card key={category.key} className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gold-light tracking-[1px]">
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 bg-white/5 border border-gold-primary/20 rounded-lg hover:bg-gold-primary/10 transition-colors"
                    >
                      <p className="text-gray-100 text-sm">{item.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">Inga kolhydratkällor ännu.</p>
        </div>
      )}
    </div>
  )
}
