'use client'

import { useState } from 'react'
import { FileJson, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useFoodLogStore, FoodLogItem } from '@/lib/stores/food-log-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

const exampleJson = `[
  {
    "name": "Kycklingbröst",
    "portionG": 150,
    "kcal": 248,
    "protein": 46.5,
    "carbs": 0,
    "fat": 5.4
  },
  {
    "name": "Ris, kokt",
    "portionG": 200,
    "kcal": 260,
    "protein": 5.4,
    "carbs": 56,
    "fat": 0.6
  }
]`

export function JsonImportTab() {
  const [jsonInput, setJsonInput] = useState('')
  const [parsedItems, setParsedItems] = useState<FoodLogItem[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { isLoading, createLog } = useFoodLogStore()

  const handleParse = () => {
    setParseError(null)
    setParsedItems(null)

    if (!jsonInput.trim()) {
      setParseError('Klistra in JSON-data')
      return
    }

    try {
      const data = JSON.parse(jsonInput)

      let items: any[] = []
      if (Array.isArray(data)) {
        items = data
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items
      } else if (typeof data === 'object' && data.name) {
        items = [data]
      } else {
        throw new Error('Okänt format')
      }

      const validated = items.map((item, idx) => {
        if (!item.name) {
          throw new Error(`Produkt ${idx + 1} saknar namn`)
        }

        return {
          name: item.name,
          portionG: item.portionG || item.portion_g || item.portion || 100,
          kcal: item.kcal || item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || item.carbohydrates || 0,
          fat: item.fat || item.fett || 0
        }
      })

      setParsedItems(validated)
    } catch (error) {
      if (error instanceof SyntaxError) {
        setParseError('Ogiltig JSON-syntax')
      } else if (error instanceof Error) {
        setParseError(error.message)
      } else {
        setParseError('Kunde inte tolka data')
      }
    }
  }

  const handleImport = async () => {
    if (!parsedItems) return

    await createLog({
      type: 'manual',
      items: parsedItems
    })

    setJsonInput('')
    setParsedItems(null)
  }

  const calculateTotals = () => {
    if (!parsedItems) return null
    return parsedItems.reduce(
      (acc, item) => ({
        kcal: acc.kcal + item.kcal,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }

  // Show preview
  if (parsedItems) {
    const totals = calculateTotals()!

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Förhandsvisning</h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {parsedItems.length} produkter
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {parsedItems.map((item, idx) => (
            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                <div className="font-semibold text-gold-primary text-sm">{Math.round(item.kcal)} kcal</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-gray-500">{Math.round(item.portionG)}g</div>
                <div className="text-xs text-gray-500">
                  P: {Math.round(item.protein)}g · K: {Math.round(item.carbs)}g · F: {Math.round(item.fat)}g
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-gold-primary/10 to-orange-100 border border-gold-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Totalt</span>
            <span className="font-bold text-lg bg-gradient-to-r from-gold-primary to-orange-500 bg-clip-text text-transparent">
              {Math.round(totals.kcal)} kcal
            </span>
          </div>
          <div className="text-sm text-gray-600 text-right mt-1">
            P: {Math.round(totals.protein)}g · K: {Math.round(totals.carbs)}g · F: {Math.round(totals.fat)}g
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setParsedItems(null)}
            className="flex-1 border-gray-300"
          >
            Tillbaka
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Importera & logga
          </Button>
        </div>
      </div>
    )
  }

  // Show input form
  return (
    <div className="space-y-4">
      <div>
        <Label>JSON-data</Label>
        <Textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={exampleJson}
          rows={8}
          className="mt-1 font-mono text-sm"
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {parseError}
        </div>
      )}

      <Button
        onClick={handleParse}
        className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
      >
        <FileJson className="w-4 h-4 mr-2" />
        Förhandsgranska
      </Button>

      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
        <p className="font-medium text-gray-700">Stödda format:</p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li>Array med produkter</li>
          <li>Objekt med items-array</li>
          <li>Enskild produkt</li>
        </ul>
        <p className="mt-2">Obligatoriska fält: <span className="font-medium">name</span></p>
        <p>Valfria: portionG, kcal, protein, carbs, fat</p>
      </div>
    </div>
  )
}
