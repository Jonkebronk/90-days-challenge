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
        { name: 'Olivolja', fatPer100g: 100 },
        { name: 'Smör', fatPer100g: 81 },
        { name: 'Rapsolja', fatPer100g: 100 },
      ],
    },
    spreads: {
      name: 'Pålägg & Övrigt',
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

  const renderTable = (items: { name: string; fatPer100g: number }[]) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-[rgba(255,215,0,0.05)]">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-semibold text-[rgba(255,255,255,0.8)] border border-[rgba(255,215,0,0.2)] sticky left-0 bg-[rgba(10,10,10,0.95)] z-10">
              Livsmedel
            </th>
            {portions.map((portion) => (
              <th
                key={portion}
                className="px-2 py-2 text-center text-xs font-semibold text-yellow-300 border border-[rgba(255,215,0,0.2)] min-w-[50px]"
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
              className={`border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)] ${
                idx % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''
              }`}
            >
              <td className="px-2 py-2 text-white font-medium border border-[rgba(255,215,0,0.1)] sticky left-0 bg-[rgba(10,10,10,0.95)] z-10">
                {item.name}
              </td>
              {portions.map((portion) => (
                <td
                  key={portion}
                  className="px-2 py-2 text-center text-[rgba(255,255,255,0.8)] border border-[rgba(255,215,0,0.1)]"
                >
                  {calculateFat(item.fatPer100g, portion)}
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
          className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            Fett
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Gram fett per portion
          </p>
        </div>
      </div>

      {/* Fat Table with Tabs */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Fett
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="nuts" className="w-full">
            <TabsList className="grid grid-cols-4 gap-2 bg-[rgba(255,255,255,0.03)] p-1 mb-6">
              {Object.entries(categories).map(([key, category]) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.7)] hover:text-white transition-all"
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

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              <strong className="text-[#FFD700]">Tips:</strong> Tabellen visar antal gram fett för olika portionsstorlekar. Fett är kaloritätt (9 kcal/g) men viktigt för hormonproduktion och vitaminupptagning. Fokusera på nyttiga fetter från nötter, frön och olivolja.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
