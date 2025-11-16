'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Edit, Save, X } from 'lucide-react'

export default function ProteinOverviewPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isEditMode, setIsEditMode] = useState(false)
  const isCoach = (session?.user as any)?.role === 'coach'

  // Portion sizes
  const portions = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

  // Food items organized by category - initial data
  const initialCategories = {
    'egg-dairy': {
      name: 'Ägg & Mejeri',
      order: 0,
      items: [
        { name: 'Kaseinpulver (0%)', proteinPer100g: 80 },
        { name: 'Mjölkproteinpulver (0%)', proteinPer100g: 80 },
        { name: 'Kvarg (naturell 0%)', proteinPer100g: 12 },
        { name: 'Keso (0%)', proteinPer100g: 11 },
        { name: 'Äggvita', proteinPer100g: 11 },
        { name: 'Ägg (hela)', proteinPer100g: 13 },
      ],
    },
    'pork': {
      name: 'Fläsk',
      items: [
        { name: 'Fläskfilé (rå)', proteinPer100g: 22 },
        { name: 'Fläskkotlett (rå)', proteinPer100g: 20 },
      ],
    },
    'fish': {
      name: 'Fisk & Skaldjur',
      items: [
        { name: 'Torsk (rå)', proteinPer100g: 18 },
        { name: 'Lax (rå)', proteinPer100g: 20 },
        { name: 'Räkor (kokta)', proteinPer100g: 24 },
        { name: 'Tonfisk (konserv, vatten)', proteinPer100g: 26 },
        { name: 'Gös (rå)', proteinPer100g: 19 },
        { name: 'Abborre (rå)', proteinPer100g: 19 },
        { name: 'Sej (rå)', proteinPer100g: 17 },
      ],
    },
    'game': {
      name: 'Viltkött',
      items: [
        { name: 'Älgkött (rå)', proteinPer100g: 22 },
        { name: 'Hjortkött (rå)', proteinPer100g: 22 },
        { name: 'Renkött (rå)', proteinPer100g: 22 },
      ],
    },
    'beef': {
      name: 'Nötkött',
      items: [
        { name: 'Nötfärs (5%)', proteinPer100g: 20 },
        { name: 'Nötfilé (rå)', proteinPer100g: 21 },
        { name: 'Rostbiff (rå)', proteinPer100g: 21 },
        { name: 'Oxfilé (rå)', proteinPer100g: 21 },
      ],
    },
    'poultry': {
      name: 'Fågel',
      items: [
        { name: 'Kycklingfilé (rå)', proteinPer100g: 23 },
        { name: 'Kycklingbröst (rå)', proteinPer100g: 23 },
        { name: 'Kalkonbröst (rå)', proteinPer100g: 24 },
      ],
    },
    'vegetarian': {
      name: 'Vegetariskt',
      items: [
        { name: 'Tofu', proteinPer100g: 8 },
        { name: 'Linser (kokta)', proteinPer100g: 9 },
        { name: 'Kikärtor (kokta)', proteinPer100g: 9 },
        { name: 'Jordnötssmör', proteinPer100g: 25 },
        { name: 'Mandlar', proteinPer100g: 21 },
        { name: 'Cashewnötter', proteinPer100g: 18 },
      ],
    },
  }

  const calculateProtein = (proteinPer100g: number, portion: number) => {
    return ((proteinPer100g * portion) / 100).toFixed(1)
  }

  const renderTable = (items: { name: string; proteinPer100g: number }[]) => (
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
                className="px-2 py-2 text-center text-xs font-semibold text-blue-300 border border-[rgba(255,215,0,0.2)] min-w-[50px]"
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
                  {calculateProtein(item.proteinPer100g, portion)}
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
            Protein
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Gram protein per portion
          </p>
        </div>
      </div>

      {/* Protein Table with Tabs */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Protein
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="egg-dairy" className="w-full">
            <TabsList className="grid grid-cols-7 gap-2 bg-[rgba(255,255,255,0.03)] p-1 mb-6">
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
              <strong className="text-[#FFD700]">Tips:</strong> Tabellen visar antal gram protein för olika portionsstorlekar. Kombinera olika proteinkällor för att få ett brett spektrum av aminosyror. Magert kött och fisk är bra val för lågt kaloriintag.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
