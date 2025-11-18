'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

  const portions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

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

  const calculateProtein = (proteinPer100g: number, portion: number) => {
    return ((proteinPer100g * portion) / 100).toFixed(1)
  }

  const renderList = (items: NutritionItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="px-4 py-3 bg-white/5 border border-gold-primary/20 rounded-lg hover:bg-gold-primary/10 transition-colors"
        >
          <p className="text-gray-100 text-sm">{item.name}</p>
        </div>
      ))}
    </div>
  )

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
            Protein
          </h1>
          <p className="text-gray-400 mt-1">
            Gram protein per portion
          </p>
        </div>
      </div>

      {/* Protein Table with Tabs */}
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
            Protein
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <Tabs defaultValue={categories[0]?.key} className="w-full">
              <TabsList className={`grid gap-2 bg-white/5 p-1 mb-6`} style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.key}
                    value={category.key}
                    className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-gray-300 hover:text-white transition-all"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.key} value={category.key} className="mt-0">
                  {renderList(category.items)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Ingen data tillgänglig
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
