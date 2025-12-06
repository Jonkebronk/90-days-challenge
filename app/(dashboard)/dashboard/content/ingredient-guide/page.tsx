'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Printer } from 'lucide-react'

// Ingredient data
const PROTEIN_ITEMS = {
  'Fågel': ['Kycklingfilé', 'Kalkonfilé', 'Kycklingfärs 5%', 'Kycklingkebab'],
  'Nötkött': ['Innanlår', 'Rostbiff', 'Oxfilé', 'Ryggbiff', 'Nötfärs 5%'],
  'Vilt': ['Rådjur', 'Hjort', 'Älg'],
  'Fisk': ['Torsk', 'Sej', 'Abborre', 'Gädda', 'Havskatt', 'Tonfisk', 'Pangasius', 'Tilapia'],
  'Skaldjur': ['Räkor', 'Krabba'],
  'Fläsk': ['Fläskfilé', 'Kassler osötad'],
  'Mejeri': ['Äggvita', 'Keso 1%', 'Kvarg naturell 1%', 'Grekisk yoghurt 0%'],
  'Proteinpulver': ['Whey', 'Kasein'],
}

const CARB_ITEMS = {
  'Ris & Gryn': ['Vitt ris', 'Fullkornsris', 'Havregryn', 'Mannagryn', 'Majsgryn/polenta', 'Couscous', 'Quinoa', 'Matvete'],
  'Pasta': ['Pasta', 'Fullkornspasta'],
  'Potatis & Rotfrukter': ['Potatis', 'Sötpotatis', 'Blandade rotfrukter'],
  'Bröd': ['Osötat bröd råg/surdeg', 'Riskakor'],
  'Frukt': ['Banan', 'Äpple', 'Russin'],
  'Övrigt': ['Rismjöl', 'Honung'],
}

const FAT_ITEMS = {
  'Oljor': ['Olivolja', 'Avokadoolja', 'Kokosolja'],
  'Nötsmör': ['Osötat jordnötssmör', 'Osötat mandelsmör'],
  'Nötter': ['Mandlar', 'Valnötter', 'Cashewnötter', 'Pekannötter', 'Paranötter', 'Hasselnötter', 'Macadamianötter'],
  'Frön': ['Solrosfrön', 'Pumpafrön', 'Sesamfrön'],
  'Övrigt': ['Avokado', 'Ägg (hel)'],
}

const VEGETABLE_ITEMS = {
  'Bladgrönsaker': ['Sallad', 'Spenat', 'Ruccola', 'Grönkål', 'Mangold'],
  'Kål': ['Broccoli', 'Blomkål', 'Vitkål', 'Rödkål', 'Spetskål', 'Brysselkål'],
  'Fruktgrönsaker': ['Gurka', 'Tomat', 'Paprika', 'Zucchini', 'Aubergine'],
  'Lök & Vitlök': ['Gul lök', 'Rödlök', 'Purjolök', 'Vitlök', 'Salladslök'],
  'Övriga': ['Morötter', 'Selleri', 'Sparris', 'Haricots verts', 'Sockerärtor', 'Champinjoner', 'Rädisa', 'Fänkål'],
  'Frysta mixar': ['Wokgrönsaker', 'Blandade grönsaker', 'Grönsaksmix till soppa'],
}

interface IngredientCategoryProps {
  title: string
  items: Record<string, string[]>
  color: string
  borderColor: string
  bgColor: string
  checked: Set<string>
  onToggle: (item: string) => void
}

function IngredientCategory({ title, items, color, borderColor, bgColor, checked, onToggle }: IngredientCategoryProps) {
  return (
    <div className={`border-2 ${borderColor} rounded-lg overflow-hidden`}>
      <div className={`${bgColor} px-3 py-2`}>
        <h3 className={`font-bold text-sm ${color} uppercase tracking-wide`}>{title}</h3>
      </div>
      <div className="p-3 bg-white space-y-3">
        {Object.entries(items).map(([subcategory, ingredients]) => (
          <div key={subcategory}>
            <p className="text-xs font-semibold text-gray-600 mb-1">{subcategory}</p>
            <div className="space-y-1">
              {ingredients.map((ingredient) => (
                <label key={ingredient} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <Checkbox
                    checked={checked.has(ingredient)}
                    onCheckedChange={() => onToggle(ingredient)}
                    className="print:border-gray-400"
                  />
                  <span className="text-sm text-gray-800">{ingredient}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function IngredientGuidePage() {
  const [clientName, setClientName] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [allergies, setAllergies] = useState('')
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev)
      if (next.has(item)) {
        next.delete(item)
      } else {
        next.add(item)
      }
      return next
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          header, nav, .print-hide {
            display: none !important;
          }
          body, main {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-page {
            width: 100% !important;
            max-width: none !important;
            padding: 20px !important;
          }
          .print-break-avoid {
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-page max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        {/* Print Button */}
        <div className="print-hide mb-6">
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Skriv ut / Spara som PDF
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RÅVARUGUIDE</h1>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print-break-avoid">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klientnamn</label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Skriv namn..."
              className="bg-white border-gray-300"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-white border-gray-300"
            />
          </div>
        </div>

        <div className="mb-8 print-break-avoid">
          <label className="block text-sm font-medium text-gray-700 mb-1">Allergier/önskemål</label>
          <Textarea
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Skriv eventuella allergier, intoleranser eller önskemål..."
            className="bg-white border-gray-300 min-h-[80px]"
          />
        </div>

        {/* Macros Grid - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <IngredientCategory
            title="Protein"
            items={PROTEIN_ITEMS}
            color="text-red-600"
            borderColor="border-red-300"
            bgColor="bg-red-50"
            checked={checkedItems}
            onToggle={toggleItem}
          />
          <IngredientCategory
            title="Kolhydrat"
            items={CARB_ITEMS}
            color="text-green-600"
            borderColor="border-green-300"
            bgColor="bg-green-50"
            checked={checkedItems}
            onToggle={toggleItem}
          />
          <IngredientCategory
            title="Fett"
            items={FAT_ITEMS}
            color="text-yellow-600"
            borderColor="border-yellow-300"
            bgColor="bg-yellow-50"
            checked={checkedItems}
            onToggle={toggleItem}
          />
        </div>

        {/* Vegetables Section */}
        <div className="mb-8 print-break-avoid">
          <div className="border-2 border-emerald-300 rounded-lg overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3">
              <h3 className="font-bold text-emerald-700 uppercase tracking-wide">Grönsaker</h3>
              <p className="text-sm text-emerald-600 mt-1 italic">
                Dessa grönsaker har så lågt kaloriinnehåll att du kan äta dem fritt för mättnad och volym.
              </p>
            </div>
            <div className="p-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(VEGETABLE_ITEMS).map(([subcategory, ingredients]) => (
                  <div key={subcategory}>
                    <p className="text-xs font-semibold text-gray-600 mb-2">{subcategory}</p>
                    <div className="space-y-1">
                      {ingredients.map((ingredient) => (
                        <label key={ingredient} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <Checkbox
                            checked={checkedItems.has(ingredient)}
                            onCheckedChange={() => toggleItem(ingredient)}
                            className="print:border-gray-400"
                          />
                          <span className="text-sm text-gray-800">{ingredient}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-8 text-center text-sm text-gray-500">
          <p className="font-medium">Johnny Strand · Friskvårdskompassen</p>
          <p className="mt-1 italic">Alla vikter anges i rått/okokt tillstånd</p>
        </div>
      </div>
    </>
  )
}
