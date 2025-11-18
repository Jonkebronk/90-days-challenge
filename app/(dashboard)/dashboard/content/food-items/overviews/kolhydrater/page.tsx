'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function KolhydraterOverviewPage() {
  const router = useRouter()

  // Food items organized by category
  const categories = [
    {
      key: 'grains',
      name: 'Spannmål & Gröt',
      items: [
        { name: 'Havregryn (torra)' },
        { name: 'Fullkornsris (kokt)' },
        { name: 'Jasminris (kokt)' },
        { name: 'Quinoa (kokt)' },
        { name: 'Bulgur (kokt)' },
        { name: 'Couscous (kokt)' },
      ],
    },
    {
      key: 'bread',
      name: 'Bröd & Pasta',
      items: [
        { name: 'Fullkornspasta (kokt)' },
        { name: 'Pasta (vit, kokt)' },
        { name: 'Fullkornsbröd' },
        { name: 'Knäckebröd (fullkorn)' },
        { name: 'Tortillabröd' },
      ],
    },
    {
      key: 'roots',
      name: 'Rotfrukter',
      items: [
        { name: 'Potatis (kokt)' },
        { name: 'Sötpotatis (kokt)' },
        { name: 'Pumpa (kokt)' },
        { name: 'Morot (rå)' },
      ],
    },
    {
      key: 'legumes',
      name: 'Baljväxter',
      items: [
        { name: 'Svarta bönor (kokta)' },
        { name: 'Röda linser (kokta)' },
        { name: 'Kikärtor (kokta)' },
        { name: 'Ärtor (gröna, kokta)' },
      ],
    },
    {
      key: 'fruits',
      name: 'Frukt & Bär',
      items: [
        { name: 'Banan' },
        { name: 'Äpple' },
        { name: 'Blåbär' },
        { name: 'Dadlar (torkade)' },
        { name: 'Russin' },
        { name: 'Apelsin' },
        { name: 'Jordgubbar' },
      ],
    },
  ]

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
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
            Kolhydrater
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {categories.map((category) => (
            <div key={category.key}>
              <h3 className="text-lg font-semibold text-gold-light mb-4">{category.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 bg-white/5 border border-gold-primary/20 rounded-lg hover:bg-gold-primary/10 transition-colors"
                  >
                    <p className="text-gray-100 text-sm">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
