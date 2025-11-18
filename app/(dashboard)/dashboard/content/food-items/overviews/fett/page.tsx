'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'

export default function FettOverviewPage() {
  const router = useRouter()

  // Portion sizes
  const portions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]

  // Food items organized by category
  const categories = {
    nuts: {
      name: 'Nötter',
      items: [
        { name: 'Hasselnötter', fatPer100g: 61 },
        { name: 'Paranötter', fatPer100g: 67 },
        { name: 'Pekannötter', fatPer100g: 72 },
        { name: 'Cashewnötter', fatPer100g: 44 },
        { name: 'Valnötter', fatPer100g: 65 },
        { name: 'Mandlar', fatPer100g: 50 },
        { name: 'Macadamianötter', fatPer100g: 76 },
        { name: 'Jordnötter', fatPer100g: 49 },
      ],
    },
    seeds: {
      name: 'Frön',
      items: [
        { name: 'Sesamfrö', fatPer100g: 50 },
        { name: 'Pumpafrön (skalade)', fatPer100g: 49 },
        { name: 'Solrosfrön (skalade)', fatPer100g: 51 },
        { name: 'Chiafrön', fatPer100g: 31 },
        { name: 'Linfrön', fatPer100g: 42 },
      ],
    },
    oils: {
      name: 'Oljor & Fetter',
      items: [
        { name: 'Kokosolja', fatPer100g: 100 },
        { name: 'Avokadoolja', fatPer100g: 100 },
        { name: 'Olivolja', fatPer100g: 100 },
        { name: 'Smör', fatPer100g: 81 },
        { name: 'Rapsolja', fatPer100g: 100 },
      ],
    },
    spreads: {
      name: 'Pålägg & Nötsmör',
      items: [
        { name: 'Jordnötssmör', fatPer100g: 50 },
        { name: 'Mandelsmör', fatPer100g: 55 },
        { name: 'Avokado', fatPer100g: 15 },
        { name: 'Tahini (sesampasta)', fatPer100g: 54 },
      ],
    },
  }

  const calculateFat = (fatPer100g: number, portion: number) => {
    return ((fatPer100g * portion) / 100).toFixed(1)
  }

  const renderList = (items: { name: string; fatPer100g: number }[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="px-4 py-3 bg-white/5 border border-gold-primary/20 rounded-lg hover:bg-gold-primary/10 transition-colors"
        >
          <p className="text-gray-100 text-sm">{item.name}</p>
        </div>
      ))}
    </div>
  )

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
            Fett
          </h1>
          <p className="text-gray-400 mt-1">
            Gram fett per portion
          </p>
        </div>
      </div>

      {/* Fat Table with Tabs */}
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
            Fett
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nuts" className="w-full">
            <TabsList className="grid grid-cols-4 gap-2 bg-white/5 p-1 mb-6">
              {Object.entries(categories).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-gray-300 hover:text-white transition-all"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(categories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-0">
                {renderList(category.items)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
