'use client'

import { useState } from 'react'
import { FileJson, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useFoodLogStore, FoodLogItem } from '@/lib/stores/food-log-store'

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

      // Handle both array and object with items
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

      // Validate and normalize items
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

    // Reset
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
          <h3 className="font-medium text-sm text-zinc-400">Förhandsvisning</h3>
          <span className="text-sm text-zinc-500">{parsedItems.length} produkter</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {parsedItems.map((item, idx) => (
            <div key={idx} className="bg-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{item.name}</div>
                <div className="text-emerald-400 text-sm">{Math.round(item.kcal)} kcal</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-zinc-500">{Math.round(item.portionG)}g</div>
                <div className="text-xs text-zinc-500">
                  P: {Math.round(item.protein)}g · K: {Math.round(item.carbs)}g · F: {Math.round(item.fat)}g
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Totalt</span>
            <span className="text-emerald-400 font-bold">{Math.round(totals.kcal)} kcal</span>
          </div>
          <div className="text-sm text-zinc-400 text-right mt-1">
            P: {Math.round(totals.protein)}g · K: {Math.round(totals.carbs)}g · F: {Math.round(totals.fat)}g
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setParsedItems(null)}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Tillbaka
          </button>
          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Importera & logga
          </button>
        </div>
      </div>
    )
  }

  // Show input form
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-zinc-400">JSON-data</label>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder={exampleJson}
          rows={8}
          className="w-full mt-1 bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm resize-none"
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {parseError}
        </div>
      )}

      <button
        onClick={handleParse}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
      >
        <FileJson className="w-4 h-4" />
        Förhandsgranska
      </button>

      <div className="text-xs text-zinc-500 space-y-1">
        <p>Stödda format:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Array med produkter</li>
          <li>Objekt med items-array</li>
          <li>Enskild produkt</li>
        </ul>
        <p className="mt-2">Obligatoriska fält: name</p>
        <p>Valfria: portionG, kcal, protein, carbs, fat</p>
      </div>
    </div>
  )
}
