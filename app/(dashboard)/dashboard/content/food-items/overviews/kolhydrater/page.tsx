'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'

export default function KolhydraterOverviewPage() {
  const router = useRouter()

  // Portion sizes
  const portions = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100]

  // Food items organized by category
  const categories = {
    grains: {
      name: 'Spannmål & Gröt',
      items: [
        { name: 'Havregryn (torra)', carbsPer100g: 60 },
        { name: 'Fullkornsris (kokt)', carbsPer100g: 23 },
        { name: 'Jasminris (kokt)', carbsPer100g: 28 },
        { name: 'Quinoa (kokt)', carbsPer100g: 21 },
        { name: 'Bulgur (kokt)', carbsPer100g: 19 },
        { name: 'Couscous (kokt)', carbsPer100g: 23 },
      ],
    },
    bread: {
      name: 'Bröd & Pasta',
      items: [
        { name: 'Fullkornspasta (kokt)', carbsPer100g: 26 },
        { name: 'Pasta (vit, kokt)', carbsPer100g: 31 },
        { name: 'Fullkornsbröd', carbsPer100g: 44 },
        { name: 'Knäckebröd (fullkorn)', carbsPer100g: 68 },
        { name: 'Tortillabröd', carbsPer100g: 49 },
      ],
    },
    roots: {
      name: 'Rotfrukter',
      items: [
        { name: 'Potatis (kokt)', carbsPer100g: 17 },
        { name: 'Sötpotatis (kokt)', carbsPer100g: 20 },
        { name: 'Pumpa (kokt)', carbsPer100g: 7 },
        { name: 'Morot (rå)', carbsPer100g: 10 },
      ],
    },
    legumes: {
      name: 'Baljväxter',
      items: [
        { name: 'Svarta bönor (kokta)', carbsPer100g: 24 },
        { name: 'Röda linser (kokta)', carbsPer100g: 20 },
        { name: 'Kikärtor (kokta)', carbsPer100g: 27 },
        { name: 'Ärtor (gröna, kokta)', carbsPer100g: 14 },
      ],
    },
    fruits: {
      name: 'Frukt & Bär',
      items: [
        { name: 'Banan', carbsPer100g: 23 },
        { name: 'Äpple', carbsPer100g: 14 },
        { name: 'Blåbär', carbsPer100g: 14 },
        { name: 'Dadlar (torkade)', carbsPer100g: 75 },
        { name: 'Russin', carbsPer100g: 79 },
        { name: 'Apelsin', carbsPer100g: 12 },
        { name: 'Jordgubbar', carbsPer100g: 8 },
      ],
    },
  }

  const calculateCarbs = (carbsPer100g: number, portion: number) => {
    return ((carbsPer100g * portion) / 100).toFixed(1)
  }

  const renderTable = (items: { name: string; carbsPer100g: number }[]) => (
    <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
      <table className="min-w-[1200px] w-full border-collapse text-xs">
        <thead className="bg-[rgba(255,215,0,0.05)]">
          <tr>
            <th className="px-2 md:px-3 py-2 text-left text-xs font-semibold text-gray-200 border border-gold-primary/20 sticky left-0 bg-gray-900/95 z-10 min-w-[120px] md:min-w-[150px]">
              Livsmedel
            </th>
            {portions.map((portion) => (
              <th
                key={portion}
                className="px-2 md:px-3 py-2 text-center text-xs font-semibold text-orange-300 border border-gold-primary/20 min-w-[45px] md:min-w-[50px] whitespace-nowrap"
              >
                {portion}g
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={idx}
              className={`border-b border-gold-primary/10 hover:bg-[rgba(255,215,0,0.02)] ${
                idx % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''
              }`}
            >
              <td className="px-2 md:px-3 py-2 text-white font-medium border border-gold-primary/10 sticky left-0 bg-gray-900/95 z-10 min-w-[120px] md:min-w-[150px]">
                {item.name}
              </td>
              {portions.map((portion) => (
                <td
                  key={portion}
                  className="px-2 md:px-3 py-2 text-center text-gray-200 border border-gold-primary/10"
                >
                  {calculateCarbs(item.carbsPer100g, portion)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
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
            Kolhydrater
          </h1>
          <p className="text-gray-400 mt-1">
            Gram kolhydrater per portion
          </p>
        </div>
      </div>

      {/* Carbs Table with Tabs */}
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
            Kolhydrater
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grains" className="w-full">
            <TabsList className="grid grid-cols-5 gap-2 bg-white/5 p-1 mb-6">
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
                {renderTable(category.items)}
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-gold-primary/20 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong className="text-gold-light">Tips:</strong> Tabellen visar antal gram kolhydrater för olika portionsstorlekar. Välj komplexa kolhydrater (fullkorn, havregryn, sötpotatis) för långsam energifrisättning och bättre mättnad. Enkla kolhydrater (frukt, dadlar) är bra runt träning för snabb energi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
