'use client'

import { useState, useRef, useCallback } from 'react'
import {
  X,
  Plus,
  Loader2,
  Package,
  Info,
  Upload,
  ImageIcon,
  Database
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ManualProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
}

interface SLVFood {
  slvNummer: number
  name: string
  type: string
  protein: number
  carbs: number
  fat: number
  kcal: number
  fiber: number | null
  sugar: number | null
  salt: number | null
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

const SOURCES = [
  { id: 'ica', label: 'ICA' },
  { id: 'coop', label: 'COOP' },
  { id: 'willys', label: 'Willys' },
  { id: 'hemkop', label: 'Hemköp' },
  { id: 'manual', label: 'Manuell' },
]

export function ManualProductModal({ isOpen, onClose, onProductAdded }: ManualProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // SLV search state
  const [slvResults, setSlvResults] = useState<SLVFood[]>([])
  const [slvLoading, setSlvLoading] = useState(false)
  const [showSlvDropdown, setShowSlvDropdown] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    ean: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    salt: '',
    category: '',
    source: 'ica',
  })

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
    } catch (error) {
      console.error('Error reading file:', error)
      setError('Kunde inte läsa bilden')
    }
  }

  // Fetch nutrition from SLV based on product name
  const fetchFromSLV = useCallback(async () => {
    const query = formData.name.trim()
    if (!query || query.length < 2) {
      setError('Ange ett produktnamn först')
      return
    }

    setSlvLoading(true)
    setShowSlvDropdown(true)
    setSlvResults([])

    try {
      const res = await fetch(`/api/slv-proxy?q=${encodeURIComponent(query)}&limit=8`)
      if (res.ok) {
        const data = await res.json()
        setSlvResults(data.foods || [])
        if (!data.foods || data.foods.length === 0) {
          setError('Inga resultat hittades i SLV')
        }
      }
    } catch (err) {
      console.error('SLV search error:', err)
      setError('Kunde inte hämta data från SLV')
    } finally {
      setSlvLoading(false)
    }
  }, [formData.name])

  // Select an SLV food and populate nutrition fields
  const selectSlvFood = (food: SLVFood) => {
    setFormData(prev => ({
      ...prev,
      kcal: food.kcal.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      fiber: food.fiber?.toString() || '',
      sugar: food.sugar?.toString() || '',
      salt: food.salt?.toString() || '',
    }))
    setSlvResults([])
    setShowSlvDropdown(false)
    setError(null)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      brand: '',
      ean: '',
      kcal: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      salt: '',
      category: '',
      source: 'ica',
    })
    setImagePreview(null)
    setError(null)
    setSuccess(false)
    setSlvResults([])
    setShowSlvDropdown(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    // Validation - only name is required
    if (!formData.name.trim()) {
      setError('Produktnamn krävs')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use the import endpoint which handles Cloudinary uploads
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          brand: formData.brand.trim() || null,
          ean: formData.ean.trim() || undefined, // Let API generate if empty
          kcal: parseFloat(formData.kcal) || 0,
          protein: parseFloat(formData.protein) || 0,
          carbs: parseFloat(formData.carbs) || 0,
          fat: parseFloat(formData.fat) || 0,
          fiber: formData.fiber ? parseFloat(formData.fiber) : null,
          sugar: formData.sugar ? parseFloat(formData.sugar) : null,
          salt: formData.salt ? parseFloat(formData.salt) : null,
          category: formData.category || null,
          source: formData.source,
          image: imagePreview || null // base64 image - will be uploaded to Cloudinary
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte spara produkten')
      }

      setSuccess(true)
      onProductAdded()

      // Reset form after short delay
      setTimeout(() => {
        resetForm()
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Något gick fel')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Lägg till produkt manuellt</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Tips */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Tips för ICA-produkter:</p>
              <p className="text-blue-600 mt-1">
                Gå till produktsidan på ica.se, kopiera namn och näringsvärden (per 100g) och klistra in här.
              </p>
            </div>
          </div>

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
                  Välj bild
                </Button>
                <p className="text-xs text-gray-500">
                  Ladda upp en produktbild. Den sparas automatiskt till Cloudinary.
                </p>
                {imagePreview && (
                  <button
                    onClick={() => {
                      setImagePreview(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Ta bort bild
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

          <div>
            <Label htmlFor="ean">EAN/Streckkod</Label>
            <Input
              id="ean"
              value={formData.ean}
              onChange={(e) => setFormData(prev => ({ ...prev, ean: e.target.value }))}
              placeholder="t.ex. 7310865001234"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Lämna tomt för att generera automatiskt</p>
          </div>

          {/* Macros - the important ones */}
          <div className="border-t pt-4 relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Näringsvärden (per 100g)</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchFromSLV}
                disabled={slvLoading || !formData.name.trim()}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {slvLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Database className="w-4 h-4 mr-2" />
                )}
                Hämta från SLV
              </Button>
            </div>

            {/* SLV Results Dropdown */}
            {showSlvDropdown && slvResults.length > 0 && (
              <div className="absolute left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto mb-3">
                <div className="p-2 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-500">Välj ett livsmedel för att fylla i näringsvärden:</p>
                </div>
                {slvResults.map((food) => (
                  <button
                    key={food.slvNummer}
                    onClick={() => selectSlvFood(food)}
                    className="w-full px-3 py-2 text-left hover:bg-amber-50 border-b last:border-0 transition-colors"
                  >
                    <p className="font-medium text-gray-900 text-sm">{food.name}</p>
                    <p className="text-xs text-gray-500">
                      {food.kcal} kcal | P: {food.protein}g | K: {food.carbs}g | F: {food.fat}g
                    </p>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowSlvDropdown(false)
                    setSlvResults([])
                  }}
                  className="w-full px-3 py-2 text-center text-sm text-gray-500 hover:bg-gray-100 border-t"
                >
                  Stäng
                </button>
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

          {/* Category and Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
            <div>
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
            <div>
              <Label className="text-sm">Källa</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SOURCES.map(src => (
                  <button
                    key={src.id}
                    onClick={() => setFormData(prev => ({ ...prev, source: src.id }))}
                    className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                      formData.source === src.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
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
              Produkten har lagts till i biblioteket!
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
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sparar...
              </>
            ) : success ? (
              'Tillagd!'
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till produkt
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
