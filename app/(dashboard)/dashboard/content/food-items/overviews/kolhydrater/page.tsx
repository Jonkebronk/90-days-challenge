'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function KolhydraterOverviewPage() {
  const router = useRouter()

  // Portion sizes
  const portions = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 85, 90, 95, 100]

  // Food items with carbs per 100g
  const foodItems = [
    { name: 'Livsmedel', carbsPer100g: 5 },
    { name: 'Quinoa', carbsPer100g: 5 },
    { name: 'Avokado', carbsPer100g: 3 },
    { name: 'Kokosolja', carbsPer100g: 5.5 },
    { name: 'Fullkornspasta (kokt)', carbsPer100g: 5.5 },
    { name: 'Pasta (vit, kokt)', carbsPer100g: 14 },
    { name: 'Fullkornsbröd', carbsPer100g: 14 },
    { name: 'Knäckebröd', carbsPer100g: 16 },
    { name: 'Havregryn', carbsPer100g: 10 },
    { name: 'Jasminris (kokt)', carbsPer100g: 18 },
    { name: 'Sötpotatis (kokt)', carbsPer100g: 20 },
    { name: 'Potatis (kokt)', carbsPer100g: 18 },
    { name: 'Pumpafrön (skalade)', carbsPer100g: 10 },
    { name: 'Sesamfrö', carbsPer100g: 10 },
    { name: 'Hasselnötter', carbsPer100g: 8 },
    { name: 'Macadamianötter', carbsPer100g: 7 },
  ]

  const calculateCarbs = (carbsPer100g: number, portion: number) => {
    return ((carbsPer100g * portion) / 100).toFixed(1)
  }

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
            Kolhydrater
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Gram kolhydrater per portion
          </p>
        </div>
      </div>

      {/* Carbs Table */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Kolhydrater
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      className="px-2 py-2 text-center text-xs font-semibold text-orange-300 border border-[rgba(255,215,0,0.2)] min-w-[50px]"
                    >
                      {portion}g
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {foodItems.map((item, idx) => (
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
                        {calculateCarbs(item.carbsPer100g, portion)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              <strong className="text-[#FFD700]">Tips:</strong> Tabellen visar antal gram kolhydrater för olika portionsstorlekar. Välj komplexa kolhydrater (fullkorn, havregryn, sötpotatis) för långsam energifrisättning och bättre mättnad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
