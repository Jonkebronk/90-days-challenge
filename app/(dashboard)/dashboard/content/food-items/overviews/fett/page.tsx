'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function FettOverviewPage() {
  const router = useRouter()

  // Food items organized by category
  const categories = [
    {
      key: 'nuts',
      name: 'Nötter',
      items: [
        { name: 'Hasselnötter' },
        { name: 'Paranötter' },
        { name: 'Pekannötter' },
        { name: 'Cashewnötter' },
        { name: 'Valnötter' },
        { name: 'Mandlar' },
        { name: 'Macadamianötter' },
        { name: 'Jordnötter' },
      ],
    },
    {
      key: 'seeds',
      name: 'Frön',
      items: [
        { name: 'Sesamfrö' },
        { name: 'Pumpafrön (skalade)' },
        { name: 'Solrosfrön (skalade)' },
        { name: 'Chiafrön' },
        { name: 'Linfrön' },
      ],
    },
    {
      key: 'oils',
      name: 'Oljor & Fetter',
      items: [
        { name: 'Kokosolja' },
        { name: 'Avokadoolja' },
        { name: 'Olivolja' },
        { name: 'Smör' },
        { name: 'Rapsolja' },
      ],
    },
    {
      key: 'spreads',
      name: 'Pålägg & Nötsmör',
      items: [
        { name: 'Jordnötssmör' },
        { name: 'Mandelsmör' },
        { name: 'Avokado' },
        { name: 'Tahini (sesampasta)' },
      ],
    },
    {
      key: 'fruits',
      name: 'Frukt',
      items: [
        { name: 'Avokado' },
        { name: 'Kokosnöt' },
        { name: 'Oliver' },
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
            Fett
          </h1>
          <p className="text-gray-400 mt-1">
            Gram fett per portion
          </p>
        </div>
      </div>

      {/* Fat List */}
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
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
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
    </div>
  )
}
