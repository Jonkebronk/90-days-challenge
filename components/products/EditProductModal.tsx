'use client'

import { useState, useRef, useEffect } from 'react'
import {
  X,
  Loader2,
  Package,
  Upload,
  ImageIcon,
  Save,
  Search,
  Database,
  ChevronDown,
  ChevronUp,
  Pill,
  Atom,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SUBCATEGORIES_BY_CATEGORY } from '@/lib/products/subcategories'

interface SLVFood {
  slvNummer: number
  name: string
  type: string
  // Macros
  protein: number
  carbs: number
  fat: number
  kcal: number
  fiber: number | null
  sugar: number | null
  salt: number | null
  // Fat breakdown
  saturatedFat: number | null
  monounsatFat: number | null
  polyunsatFat: number | null
  cholesterol: number | null
  // Vitamins
  vitaminA: number | null
  vitaminD: number | null
  vitaminE: number | null
  vitaminC: number | null
  vitaminB6: number | null
  vitaminB12: number | null
  thiamin: number | null
  riboflavin: number | null
  niacin: number | null
  folate: number | null
  // Minerals
  calcium: number | null
  iron: number | null
  magnesium: number | null
  phosphorus: number | null
  potassium: number | null
  zinc: number | null
  selenium: number | null
  iodine: number | null
}

interface Product {
  id: string
  ean: string
  name: string
  brand: string | null
  category: string | null
  subCategory?: string | null
  image: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  sugar?: number | null
  salt?: number | null
  // Fat breakdown
  saturatedFat?: number | null
  monounsatFat?: number | null
  polyunsatFat?: number | null
  cholesterol?: number | null
  // Vitamins
  vitaminA?: number | null
  vitaminD?: number | null
  vitaminE?: number | null
  vitaminC?: number | null
  vitaminB6?: number | null
  vitaminB12?: number | null
  thiamin?: number | null
  riboflavin?: number | null
  niacin?: number | null
  folate?: number | null
  // Minerals
  calcium?: number | null
  iron?: number | null
  magnesium?: number | null
  phosphorus?: number | null
  potassium?: number | null
  zinc?: number | null
  selenium?: number | null
  iodine?: number | null
  // SLV reference
  slvNummer?: number | null
  source: string
}

interface EditProductModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
  onProductUpdated: () => void
}

const CATEGORIES = [
  { id: 'mejeri', label: 'Mejeri' },
  { id: 'kott', label: 'Kött' },
  { id: 'fisk', label: 'Fisk' },
  { id: 'brod', label: 'Bröd' },
  { id: 'frukt', label: 'Frukt' },
  { id: 'gronsaker', label: 'Grönsaker' },
  { id: 'dryck', label: 'Dryck' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'fryst', label: 'Fryst' },
  { id: 'torrvaror', label: 'Torrvaror' },
]

interface DbSubcategory {
  key: string
  label: string
  parentKey: string | null
}

export function EditProductModal({ isOpen, product, onClose, onProductUpdated }: EditProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null)

  // SLV search state
  const [showSLVSearch, setShowSLVSearch] = useState(false)
  const [slvSearchTerm, setSlvSearchTerm] = useState('')
  const [slvResults, setSlvResults] = useState<SLVFood[]>([])
  const [slvLoading, setSlvLoading] = useState(false)

  // Micronutrient sections state
  const [showVitamins, setShowVitamins] = useState(false)
  const [showMinerals, setShowMinerals] = useState(false)

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Database subcategories
  const [dbSubcategories, setDbSubcategories] = useState<DbSubcategory[]>([])

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    salt: '',
    category: '',
    // Micronutrients
    saturatedFat: '',
    vitaminA: '',
    vitaminD: '',
    vitaminC: '',
    vitaminB12: '',
    folate: '',
    calcium: '',
    iron: '',
    magnesium: '',
    potassium: '',
    zinc: '',
    iodine: '',
    slvNummer: null as number | null,
    subCategory: '',
    source: '',
  })

  // Fetch subcategories from database when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/product-categories')
        .then(res => res.ok ? res.json() : { subcategories: [] })
        .then(data => setDbSubcategories(data.subcategories || []))
        .catch(() => setDbSubcategories([]))
    }
  }, [isOpen])

  // Get all subcategories for a category (merge hardcoded + database)
  const getSubcategoriesForCategory = (categoryKey: string): { key: string; label: string }[] => {
    const hardcoded = SUBCATEGORIES_BY_CATEGORY[categoryKey.toLowerCase()] || []
    const fromDb = dbSubcategories.filter(s => s.parentKey === categoryKey.toLowerCase())

    // Merge: start with hardcoded, add db ones that don't exist
    const mergedMap = new Map<string, { key: string; label: string }>()
    for (const sub of hardcoded) {
      mergedMap.set(sub.key, { key: sub.key, label: sub.label })
    }
    for (const sub of fromDb) {
      if (!mergedMap.has(sub.key)) {
        mergedMap.set(sub.key, { key: sub.key, label: sub.label })
      }
    }
    return Array.from(mergedMap.values())
  }

  // Initialize form when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        kcal: product.kcal?.toString() || '',
        protein: product.protein?.toString() || '',
        carbs: product.carbs?.toString() || '',
        fat: product.fat?.toString() || '',
        fiber: product.fiber?.toString() || '',
        sugar: product.sugar?.toString() || '',
        salt: product.salt?.toString() || '',
        category: product.category || '',
        // Micronutrients
        saturatedFat: product.saturatedFat?.toString() || '',
        vitaminA: product.vitaminA?.toString() || '',
        vitaminD: product.vitaminD?.toString() || '',
        vitaminC: product.vitaminC?.toString() || '',
        vitaminB12: product.vitaminB12?.toString() || '',
        folate: product.folate?.toString() || '',
        calcium: product.calcium?.toString() || '',
        iron: product.iron?.toString() || '',
        magnesium: product.magnesium?.toString() || '',
        potassium: product.potassium?.toString() || '',
        zinc: product.zinc?.toString() || '',
        iodine: product.iodine?.toString() || '',
        slvNummer: product.slvNummer || null,
        subCategory: product.subCategory || '',
        source: product.source || '',
      })
      setImagePreview(product.image || null)
      setNewImageBase64(null)
      setError(null)
      setSuccess(false)
    }
  }, [product])

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle image selection
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await fileToBase64(file)
      setImagePreview(base64)
      setNewImageBase64(base64)
    } catch (error) {
      console.error('Error reading file:', error)
      setError('Kunde inte läsa bilden')
    }
  }

  const handleClose = () => {
    setError(null)
    setSuccess(false)
    setNewImageBase64(null)
    setShowSLVSearch(false)
    setSlvSearchTerm('')
    setSlvResults([])
    setShowDeleteConfirm(false)
    setIsDeleting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  // Delete product handler
  const handleDelete = async () => {
    if (!product) return

    setIsDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte ta bort produkten')
      }

      onProductUpdated()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Något gick fel vid borttagning')
      setIsDeleting(false)
    }
  }

  // SLV search function
  const searchSLV = async (query: string) => {
    if (query.length < 2) {
      setSlvResults([])
      return
    }

    setSlvLoading(true)
    try {
      const res = await fetch(`/api/slv-proxy?q=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setSlvResults(data.foods || [])
      }
    } catch (err) {
      console.error('SLV search error:', err)
    } finally {
      setSlvLoading(false)
    }
  }

  // Handle SLV search input with debounce
  useEffect(() => {
    if (!showSLVSearch) return
    const timer = setTimeout(() => {
      searchSLV(slvSearchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [slvSearchTerm, showSLVSearch])

  // Apply SLV food data to form
  const handleSLVSelect = (food: SLVFood) => {
    setFormData(prev => ({
      ...prev,
      // Macros
      kcal: food.kcal.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      fiber: food.fiber?.toString() || '',
      sugar: food.sugar?.toString() || '',
      salt: food.salt?.toString() || '',
      // Micronutrients
      saturatedFat: food.saturatedFat?.toString() || '',
      vitaminA: food.vitaminA?.toString() || '',
      vitaminD: food.vitaminD?.toString() || '',
      vitaminC: food.vitaminC?.toString() || '',
      vitaminB12: food.vitaminB12?.toString() || '',
      folate: food.folate?.toString() || '',
      calcium: food.calcium?.toString() || '',
      iron: food.iron?.toString() || '',
      magnesium: food.magnesium?.toString() || '',
      potassium: food.potassium?.toString() || '',
      zinc: food.zinc?.toString() || '',
      iodine: food.iodine?.toString() || '',
      slvNummer: food.slvNummer,
    }))
    setShowSLVSearch(false)
    setSlvSearchTerm('')
    setSlvResults([])
  }

  const handleSubmit = async () => {
    if (!product) return

    // Validation - only name is required
    if (!formData.name.trim()) {
      setError('Produktnamn krävs')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          brand: formData.brand.trim() || null,
          kcal: parseFloat(formData.kcal) || 0,
          protein: parseFloat(formData.protein) || 0,
          carbs: parseFloat(formData.carbs) || 0,
          fat: parseFloat(formData.fat) || 0,
          fiber: formData.fiber ? parseFloat(formData.fiber) : null,
          sugar: formData.sugar ? parseFloat(formData.sugar) : null,
          salt: formData.salt ? parseFloat(formData.salt) : null,
          category: formData.category || null,
          subCategory: formData.subCategory || null,
          source: formData.source || undefined,
          image: newImageBase64 || undefined,
          // Micronutrients
          saturatedFat: formData.saturatedFat ? parseFloat(formData.saturatedFat) : null,
          vitaminA: formData.vitaminA ? parseFloat(formData.vitaminA) : null,
          vitaminD: formData.vitaminD ? parseFloat(formData.vitaminD) : null,
          vitaminC: formData.vitaminC ? parseFloat(formData.vitaminC) : null,
          vitaminB12: formData.vitaminB12 ? parseFloat(formData.vitaminB12) : null,
          folate: formData.folate ? parseFloat(formData.folate) : null,
          calcium: formData.calcium ? parseFloat(formData.calcium) : null,
          iron: formData.iron ? parseFloat(formData.iron) : null,
          magnesium: formData.magnesium ? parseFloat(formData.magnesium) : null,
          potassium: formData.potassium ? parseFloat(formData.potassium) : null,
          zinc: formData.zinc ? parseFloat(formData.zinc) : null,
          iodine: formData.iodine ? parseFloat(formData.iodine) : null,
          slvNummer: formData.slvNummer || null,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte uppdatera produkten')
      }

      setSuccess(true)
      onProductUpdated()

      // Close after short delay
      setTimeout(() => {
        handleClose()
      }, 1000)

    } catch (err: any) {
      setError(err.message || 'Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !product) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-gold-primary" />
            <h2 className="text-lg font-semibold">Redigera produkt</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image upload */}
          <div>
            <Label className="text-sm">Produktbild</Label>
            <div className="mt-2 flex items-start gap-4">
              {/* Preview */}
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
              </div>
              {/* Upload button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {imagePreview ? 'Byt bild' : 'Välj bild'}
                </Button>
                <p className="text-xs text-gray-500">
                  Ladda upp en ny produktbild.
                </p>
                {newImageBase64 && (
                  <button
                    onClick={() => {
                      setImagePreview(product.image || null)
                      setNewImageBase64(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Ångra bildändring
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Produktnamn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="t.ex. Kycklingfilé"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="brand">Varumärke</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="t.ex. ICA Basic"
                className="mt-1"
              />
            </div>
          </div>

          {/* Macros */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Näringsvärden (per 100g)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSLVSearch(!showSLVSearch)
                  if (!showSLVSearch && formData.name) {
                    setSlvSearchTerm(formData.name.split(' ')[0]) // Pre-fill with first word of name
                  }
                }}
                className="text-xs gap-1.5"
              >
                <Database className="w-3.5 h-3.5" />
                {showSLVSearch ? 'Stäng SLV' : 'Hämta från SLV'}
              </Button>
            </div>

            {/* SLV Search Panel */}
            {showSLVSearch && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={slvSearchTerm}
                    onChange={(e) => setSlvSearchTerm(e.target.value)}
                    placeholder="Sök livsmedel (t.ex. banan, kyckling...)"
                    className="pl-9 bg-white"
                    autoFocus
                  />
                </div>

                {slvLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-600">Söker...</span>
                  </div>
                )}

                {!slvLoading && slvResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
                    {slvResults.map((food) => (
                      <button
                        key={food.slvNummer}
                        onClick={() => handleSLVSelect(food)}
                        className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {food.name}
                        </div>
                        <div className="flex gap-2 mt-1 text-xs">
                          <span className="text-orange-600">{food.kcal} kcal</span>
                          <span className="text-rose-600">P: {food.protein}g</span>
                          <span className="text-blue-600">K: {food.carbs}g</span>
                          <span className="text-amber-600">F: {food.fat}g</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {!slvLoading && slvSearchTerm.length >= 2 && slvResults.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Inga resultat för &quot;{slvSearchTerm}&quot;
                  </p>
                )}

                {slvSearchTerm.length < 2 && (
                  <p className="text-xs text-gray-500 text-center">
                    Skriv minst 2 tecken för att söka i Livsmedelsverkets databas
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="kcal" className="text-sm">Kcal</Label>
                <Input
                  id="kcal"
                  type="number"
                  step="0.1"
                  value={formData.kcal}
                  onChange={(e) => setFormData(prev => ({ ...prev, kcal: e.target.value }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="protein" className="text-sm">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={formData.protein}
                  onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-sm">Kolhydrater (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={formData.carbs}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fat" className="text-sm">Fett (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={formData.fat}
                  onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Extra nutrition */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="fiber" className="text-sm text-gray-600">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                value={formData.fiber}
                onChange={(e) => setFormData(prev => ({ ...prev, fiber: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="sugar" className="text-sm text-gray-600">Socker (g)</Label>
              <Input
                id="sugar"
                type="number"
                step="0.1"
                value={formData.sugar}
                onChange={(e) => setFormData(prev => ({ ...prev, sugar: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="salt" className="text-sm text-gray-600">Salt (g)</Label>
              <Input
                id="salt"
                type="number"
                step="0.1"
                value={formData.salt}
                onChange={(e) => setFormData(prev => ({ ...prev, salt: e.target.value }))}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          {/* Vitamins Section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowVitamins(!showVitamins)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-gray-900">Vitaminer</span>
                {(formData.vitaminA || formData.vitaminC || formData.vitaminD || formData.vitaminB12 || formData.folate) ? (
                  <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                    Har data
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    Har inte data
                  </span>
                )}
              </div>
              {showVitamins ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showVitamins && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="vitaminA" className="text-xs text-gray-600">Vitamin A (µg)</Label>
                  <Input
                    id="vitaminA"
                    type="number"
                    step="0.1"
                    value={formData.vitaminA}
                    onChange={(e) => setFormData(prev => ({ ...prev, vitaminA: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="vitaminD" className="text-xs text-gray-600">Vitamin D (µg)</Label>
                  <Input
                    id="vitaminD"
                    type="number"
                    step="0.01"
                    value={formData.vitaminD}
                    onChange={(e) => setFormData(prev => ({ ...prev, vitaminD: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="vitaminC" className="text-xs text-gray-600">Vitamin C (mg)</Label>
                  <Input
                    id="vitaminC"
                    type="number"
                    step="0.1"
                    value={formData.vitaminC}
                    onChange={(e) => setFormData(prev => ({ ...prev, vitaminC: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="vitaminB12" className="text-xs text-gray-600">Vitamin B12 (µg)</Label>
                  <Input
                    id="vitaminB12"
                    type="number"
                    step="0.01"
                    value={formData.vitaminB12}
                    onChange={(e) => setFormData(prev => ({ ...prev, vitaminB12: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="folate" className="text-xs text-gray-600">Folat (µg)</Label>
                  <Input
                    id="folate"
                    type="number"
                    step="0.1"
                    value={formData.folate}
                    onChange={(e) => setFormData(prev => ({ ...prev, folate: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Minerals Section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowMinerals(!showMinerals)}
              className="w-full flex items-center justify-between py-2 text-left"
            >
              <div className="flex items-center gap-2">
                <Atom className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-900">Mineraler</span>
                {(formData.calcium || formData.iron || formData.magnesium || formData.zinc || formData.potassium || formData.iodine) ? (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    Har data
                  </span>
                ) : (
                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    Har inte data
                  </span>
                )}
              </div>
              {showMinerals ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {showMinerals && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label htmlFor="calcium" className="text-xs text-gray-600">Kalcium (mg)</Label>
                  <Input
                    id="calcium"
                    type="number"
                    step="0.1"
                    value={formData.calcium}
                    onChange={(e) => setFormData(prev => ({ ...prev, calcium: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="iron" className="text-xs text-gray-600">Järn (mg)</Label>
                  <Input
                    id="iron"
                    type="number"
                    step="0.01"
                    value={formData.iron}
                    onChange={(e) => setFormData(prev => ({ ...prev, iron: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="magnesium" className="text-xs text-gray-600">Magnesium (mg)</Label>
                  <Input
                    id="magnesium"
                    type="number"
                    step="0.1"
                    value={formData.magnesium}
                    onChange={(e) => setFormData(prev => ({ ...prev, magnesium: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="potassium" className="text-xs text-gray-600">Kalium (mg)</Label>
                  <Input
                    id="potassium"
                    type="number"
                    step="0.1"
                    value={formData.potassium}
                    onChange={(e) => setFormData(prev => ({ ...prev, potassium: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="zinc" className="text-xs text-gray-600">Zink (mg)</Label>
                  <Input
                    id="zinc"
                    type="number"
                    step="0.01"
                    value={formData.zinc}
                    onChange={(e) => setFormData(prev => ({ ...prev, zinc: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="iodine" className="text-xs text-gray-600">Jod (µg)</Label>
                  <Input
                    id="iodine"
                    type="number"
                    step="0.1"
                    value={formData.iodine}
                    onChange={(e) => setFormData(prev => ({ ...prev, iodine: e.target.value }))}
                    placeholder="0"
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="border-t pt-4">
            <Label className="text-sm">Kategori</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    category: prev.category === cat.id ? '' : cat.id,
                    subCategory: prev.category === cat.id ? prev.subCategory : '' // Clear subcategory when changing category
                  }))}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                    formData.category === cat.id
                      ? 'bg-gold-primary text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Subcategory - show when category has subcategories */}
            {formData.category && getSubcategoriesForCategory(formData.category).length > 0 && (
              <div className="mt-3">
                <Label className="text-sm text-gray-600">Subkategori</Label>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {getSubcategoriesForCategory(formData.category).map(subcat => (
                    <button
                      key={subcat.key}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        subCategory: prev.subCategory === subcat.key ? '' : subcat.key
                      }))}
                      className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                        formData.subCategory === subcat.key
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {subcat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Source/Källa */}
          <div className="border-t pt-4">
            <Label className="text-sm">Källa</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                onClick={() => setFormData(prev => ({ ...prev, source: 'ica' }))}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  formData.source === 'ica'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ICA
              </button>
            </div>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produkten har uppdaterats!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          {/* Delete confirmation */}
          {showDeleteConfirm ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">Är du säker på att du vill ta bort denna produkt? Detta kan inte ångras.</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Tar bort...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Ja, ta bort
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Avbryt
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || success}
                className="flex-1 bg-gold-primary hover:bg-gold-primary/90 text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : success ? (
                  'Uppdaterad!'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Spara ändringar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
