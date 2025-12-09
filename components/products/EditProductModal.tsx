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
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SLVFood {
  slvNummer: number
  name: string
  type: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

interface Product {
  id: string
  ean: string
  name: string
  brand: string | null
  category: string | null
  image: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  sugar?: number | null
  salt?: number | null
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
  { id: 'kött', label: 'Kött' },
  { id: 'fisk', label: 'Fisk' },
  { id: 'bröd', label: 'Bröd' },
  { id: 'frukt', label: 'Frukt' },
  { id: 'grönsaker', label: 'Grönsaker' },
  { id: 'dryck', label: 'Dryck' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'fryst', label: 'Fryst' },
  { id: 'torrvaror', label: 'Torrvaror' },
]

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
  })

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
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
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
      kcal: food.kcal.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
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
          image: newImageBase64 || undefined // Only send if new image uploaded
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

          {/* EAN (read-only) */}
          <div>
            <Label className="text-sm text-gray-500">EAN/Streckkod</Label>
            <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded mt-1">{product.ean}</p>
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
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {slvResults.map((food) => (
                      <button
                        key={food.slvNummer}
                        onClick={() => handleSLVSelect(food)}
                        className="w-full text-left p-2 rounded-lg hover:bg-blue-100 transition-colors"
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
                    Inga resultat för "{slvSearchTerm}"
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

          {/* Category */}
          <div className="border-t pt-4">
            <Label className="text-sm">Kategori</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    category: prev.category === cat.id ? '' : cat.id
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
        <div className="p-4 border-t bg-gray-50 flex gap-3">
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
      </div>
    </div>
  )
}
