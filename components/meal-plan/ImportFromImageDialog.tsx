'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Upload,
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Database,
  Image as ImageIcon,
  Search,
  X,
  Edit2
} from 'lucide-react'
import { toast } from 'sonner'

interface SLVMatch {
  slvNummer: number
  name: string
  slv_protein: number
  slv_fat: number
  slv_carbs: number
  slv_kcal: number
}

interface SLVFood {
  slvNummer: number
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface AlternativeItem {
  name: string
  slv_match?: SLVMatch | null
}

interface ParsedItem {
  name: string
  alternatives?: string[]
  alternatives_enriched?: AlternativeItem[]
  amount: number
  unit: string
  protein: number
  fat: number
  carbs: number
  kcal: number
  slv_match: SLVMatch | null
  category?: 'protein' | 'kolhydrat' | 'fett'
}

interface ParsedMeal {
  mealNumber: number
  name: string
  items: ParsedItem[]
}

interface ParsedPlan {
  name: string
  meals: ParsedMeal[]
  totals: {
    protein: number
    fat: number
    carbs: number
    kcal: number
  }
}

interface ImportFromImageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (plan: ParsedPlan) => void
}

export function ImportFromImageDialog({
  open,
  onOpenChange,
  onImport
}: ImportFromImageDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'review'>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null)
  const [expandedMeals, setExpandedMeals] = useState<Set<number>>(new Set())
  const [planName, setPlanName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // SLV search state
  const [searchingItem, setSearchingItem] = useState<{ mealIndex: number; itemIndex: number } | null>(null)
  const [slvSearchTerm, setSlvSearchTerm] = useState('')
  const [slvSearchResults, setSlvSearchResults] = useState<SLVFood[]>([])
  const [isSearchingSLV, setIsSearchingSLV] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset state
    setError(null)
    setParsedPlan(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
      setStep('preview')
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!imagePreview) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/meal-plan-templates/import-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imagePreview })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze image')
      }

      setParsedPlan(data.parsedPlan)
      setPlanName(data.parsedPlan.name)
      // Expand all meals by default
      setExpandedMeals(new Set(data.parsedPlan.meals.map((_: ParsedMeal, i: number) => i)))
      setStep('review')
    } catch (err: any) {
      setError(err.message || 'Kunde inte analysera bilden')
      toast.error('Kunde inte analysera bilden')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImport = () => {
    if (!parsedPlan) return

    onImport({
      ...parsedPlan,
      name: planName || parsedPlan.name
    })
    onOpenChange(false)
    resetState()
  }

  const resetState = () => {
    setStep('upload')
    setImagePreview(null)
    setParsedPlan(null)
    setExpandedMeals(new Set())
    setPlanName('')
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const toggleMeal = (index: number) => {
    const newExpanded = new Set(expandedMeals)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMeals(newExpanded)
  }

  // SLV search functions
  const searchSLV = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSlvSearchResults([])
      return
    }

    setIsSearchingSLV(true)
    try {
      const res = await fetch(`/api/slv-proxy?q=${encodeURIComponent(query)}&limit=10`)
      const data = await res.json()
      setSlvSearchResults(data.foods || [])
    } catch (err) {
      console.error('SLV search error:', err)
      setSlvSearchResults([])
    } finally {
      setIsSearchingSLV(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (slvSearchTerm) {
        searchSLV(slvSearchTerm)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [slvSearchTerm, searchSLV])

  const openSLVSearch = (mealIndex: number, itemIndex: number, currentName: string) => {
    setSearchingItem({ mealIndex, itemIndex })
    setSlvSearchTerm(currentName.split('/')[0].trim()) // Use first part of name for search
    setSlvSearchResults([])
  }

  const closeSLVSearch = () => {
    setSearchingItem(null)
    setSlvSearchTerm('')
    setSlvSearchResults([])
  }

  const selectSLVMatch = (food: SLVFood) => {
    if (!parsedPlan || !searchingItem) return

    const updatedPlan = { ...parsedPlan }
    const item = updatedPlan.meals[searchingItem.mealIndex].items[searchingItem.itemIndex]

    item.slv_match = {
      slvNummer: food.slvNummer,
      name: food.name,
      slv_protein: food.protein,
      slv_fat: food.fat,
      slv_carbs: food.carbs,
      slv_kcal: food.kcal
    }

    setParsedPlan(updatedPlan)
    closeSLVSearch()
  }

  const renderUploadStep = () => (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all"
      >
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <Upload className="w-8 h-8 text-amber-600" />
        </div>
        <p className="font-medium text-gray-900">Ladda upp kostschema</p>
        <p className="text-sm text-gray-500 mt-1">
          Dra och släpp eller klicka för att välja bild
        </p>
        <p className="text-xs text-gray-400 mt-2">
          PNG, JPG eller PDF-skärmdump
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {imagePreview && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={imagePreview}
            alt="Kostschema förhandsgranskning"
            className="w-full max-h-64 object-contain bg-gray-50"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={resetState}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={resetState}
          className="flex-1"
        >
          Byt bild
        </Button>
        <Button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyserar...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Analysera bild
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderReviewStep = () => {
    if (!parsedPlan) return null

    const slvMatchCount = parsedPlan.meals.reduce((acc, meal) =>
      acc + meal.items.filter(item => item.slv_match).length, 0
    )
    const totalItems = parsedPlan.meals.reduce((acc, meal) =>
      acc + meal.items.length, 0
    )

    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Plan name */}
        <div>
          <Label>Schemanamn</Label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Mitt kostschema"
          />
        </div>

        {/* SLV match summary */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span className="text-sm text-emerald-700">
            {slvMatchCount} av {totalItems} ingredienser matchade i Livsmedelsverket
          </span>
        </div>

        {/* Totals */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Dagstotaler</h4>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-amber-600">
                {Math.round(parsedPlan.totals.kcal)}
              </div>
              <div className="text-xs text-gray-500">kcal</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {Math.round(parsedPlan.totals.protein)}g
              </div>
              <div className="text-xs text-gray-500">Protein</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                {Math.round(parsedPlan.totals.carbs)}g
              </div>
              <div className="text-xs text-gray-500">Kolhydrater</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {Math.round(parsedPlan.totals.fat)}g
              </div>
              <div className="text-xs text-gray-500">Fett</div>
            </div>
          </div>
        </div>

        {/* Meals */}
        <div className="space-y-3">
          {parsedPlan.meals.map((meal, mealIndex) => (
            <div key={mealIndex} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Meal header */}
              <button
                onClick={() => toggleMeal(mealIndex)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{meal.name}</span>
                  <span className="text-xs text-gray-500">
                    ({meal.items.length} ingredienser)
                  </span>
                </div>
                {expandedMeals.has(mealIndex) ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {/* Meal items - categorized */}
              {expandedMeals.has(mealIndex) && (
                <div className="p-3 space-y-3">
                  {/* Group items by category */}
                  {(['kolhydrat', 'protein', 'fett'] as const).map(category => {
                    const categoryItems = meal.items.filter(item => item.category === category)
                    if (categoryItems.length === 0) return null

                    const categoryLabels = {
                      protein: { label: 'Proteinkällor', color: 'rose', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', textColor: 'text-rose-700' },
                      kolhydrat: { label: 'Kolhydratskällor', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-700' },
                      fett: { label: 'Fettkällor', color: 'amber', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', textColor: 'text-amber-700' }
                    }
                    const cat = categoryLabels[category]

                    return (
                      <div key={category} className={`${cat.bgColor} ${cat.borderColor} border rounded-lg overflow-hidden`}>
                        <div className={`px-3 py-1.5 ${cat.bgColor} border-b ${cat.borderColor}`}>
                          <span className={`text-xs font-bold uppercase tracking-wide ${cat.textColor}`}>
                            {cat.label}
                          </span>
                        </div>
                        <div className="bg-white/80 p-2">
                          {categoryItems.map((item) => {
                            const itemIndex = meal.items.indexOf(item)
                            const isSearching = searchingItem?.mealIndex === mealIndex && searchingItem?.itemIndex === itemIndex
                            const hasAlternatives = (item.alternatives_enriched && item.alternatives_enriched.length > 0) ||
                                                   (item.alternatives && item.alternatives.length > 0)

                            // Extract main ingredient name (before "eller" or "/")
                            const mainName = item.name.split(/\s+eller\s+/i)[0].split('/')[0].trim()

                            return (
                              <div key={itemIndex} className="mb-2 last:mb-0">
                                {/* Main ingredient box */}
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {mainName}
                                      </span>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {item.amount}{item.unit} · P: {item.protein}g · K: {item.carbs}g · F: {item.fat}g · {Math.round(item.kcal)} kcal
                                      </div>
                                      {item.slv_match && (
                                        <button
                                          onClick={() => openSLVSearch(mealIndex, itemIndex, item.name)}
                                          className="text-xs text-emerald-600 flex items-center gap-1 mt-1 hover:text-emerald-700 hover:underline"
                                        >
                                          <Check className="w-3 h-3" />
                                          SLV: {item.slv_match.name}
                                          <Edit2 className="w-3 h-3 ml-1" />
                                        </button>
                                      )}
                                      {!item.slv_match && (
                                        <button
                                          onClick={() => openSLVSearch(mealIndex, itemIndex, item.name)}
                                          className="text-xs text-amber-600 flex items-center gap-1 mt-1 hover:text-amber-700 hover:underline"
                                        >
                                          <AlertCircle className="w-3 h-3" />
                                          Ingen SLV-matchning
                                          <Search className="w-3 h-3 ml-1" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* ELLER divider and alternative boxes */}
                                {item.alternatives_enriched && item.alternatives_enriched.map((alt, altIndex) => (
                                  <div key={altIndex}>
                                    {/* ELLER divider */}
                                    <div className="flex items-center gap-2 py-1.5 px-2">
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">ELLER</span>
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                                    </div>
                                    {/* Alternative box */}
                                    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2.5">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {alt.name}
                                      </span>
                                      {alt.slv_match && (
                                        <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                          <Check className="w-3 h-3" />
                                          SLV: {alt.slv_match.name}
                                        </div>
                                      )}
                                      {!alt.slv_match && (
                                        <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                          <AlertCircle className="w-3 h-3" />
                                          Ingen SLV-matchning
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {/* Fallback: plain alternatives without enriched data */}
                                {!item.alternatives_enriched && item.alternatives && item.alternatives.map((alt, altIndex) => (
                                  <div key={altIndex}>
                                    {/* ELLER divider */}
                                    <div className="flex items-center gap-2 py-1.5 px-2">
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">ELLER</span>
                                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                                    </div>
                                    {/* Alternative box */}
                                    <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-2.5">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {alt}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                                {/* Inline SLV search */}
                                {isSearching && (
                                  <div className="mt-3 border border-gray-200 rounded-lg bg-gray-50 p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Search className="w-4 h-4 text-gray-400" />
                                      <Input
                                        value={slvSearchTerm}
                                        onChange={(e) => setSlvSearchTerm(e.target.value)}
                                        placeholder="Sök i Livsmedelsverket..."
                                        className="flex-1 h-8 text-sm"
                                        autoFocus
                                      />
                                      <button
                                        onClick={closeSLVSearch}
                                        className="p-1 hover:bg-gray-200 rounded"
                                      >
                                        <X className="w-4 h-4 text-gray-500" />
                                      </button>
                                    </div>

                                    {isSearchingSLV && (
                                      <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Söker...
                                      </div>
                                    )}

                                    {!isSearchingSLV && slvSearchResults.length > 0 && (
                                      <div className="max-h-48 overflow-y-auto space-y-1">
                                        {slvSearchResults.map((food) => (
                                          <button
                                            key={food.slvNummer}
                                            onClick={() => selectSLVMatch(food)}
                                            className="w-full text-left p-2 hover:bg-white rounded border border-transparent hover:border-emerald-200 transition-colors"
                                          >
                                            <div className="font-medium text-sm text-gray-900 truncate">
                                              {food.name}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                              P: {food.protein}g · K: {food.carbs}g · F: {food.fat}g · {food.kcal} kcal/100g
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {!isSearchingSLV && slvSearchTerm.length >= 2 && slvSearchResults.length === 0 && (
                                      <div className="text-sm text-gray-500 py-2">
                                        Inga resultat för &quot;{slvSearchTerm}&quot;
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setStep('preview')}
            className="flex-1"
          >
            Tillbaka
          </Button>
          <Button
            onClick={handleImport}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-2" />
            Importera schema
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetState()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && 'Importera kostschema från bild'}
            {step === 'preview' && 'Förhandsgranskning'}
            {step === 'review' && 'Granska importerat schema'}
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && renderUploadStep()}
        {step === 'preview' && renderPreviewStep()}
        {step === 'review' && renderReviewStep()}
      </DialogContent>
    </Dialog>
  )
}
