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

  const renderTable = (items: NutritionItem[]) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-[rgba(255,215,0,0.05)]">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-200 border border-gold-primary/20 sticky left-0 bg-gray-900/95 z-10">
              Livsmedel
            </th>
            {portions.map((portion) => (
              <th
                key={portion}
                className="px-2 py-2 text-center text-xs font-semibold text-blue-300 border border-gold-primary/20 min-w-[50px]"
              >
                {portion}g
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              className={`border-b border-gold-primary/10 hover:bg-[rgba(255,215,0,0.02)] ${
                idx % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''
              }`}
            >
              <td className="px-2 py-2 text-white font-medium border border-gold-primary/10 sticky left-0 bg-gray-900/95 z-10">
                {item.name}
              </td>
              {portions.map((portion) => (
                <td
                  key={portion}
                  className="px-2 py-2 text-center text-gray-200 border border-gold-primary/10"
                >
                  {calculateProtein(item.valuePer100g, portion)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
                  {renderTable(category.items)}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Ingen data tillgänglig
            </p>
          )}

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong className="text-gold-light">Tips:</strong> Tabellen visar antal gram protein för olika portionsstorlekar. Kombinera olika proteinkällor för att få ett brett spektrum av aminosyror. Magert kött och fisk är bra val för lågt kaloriintag.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
