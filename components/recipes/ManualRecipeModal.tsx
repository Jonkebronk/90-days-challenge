'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X,
  Loader2,
  ChefHat,
  Upload,
  ImageIcon,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Category {
  id: string
  name: string
  slug: string
  subcategories: { id: string; name: string; slug: string }[]
}

interface ManualRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onRecipeAdded: () => void
  initialData?: {
    title?: string
    description?: string
    categoryId?: string
    image?: string | null
    requestId?: string
  }
}

export function ManualRecipeModal({ isOpen, onClose, onRecipeAdded, initialData }: ManualRecipeModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    servings: '4',
    prepTimeMinutes: '',
    cookTimeMinutes: '',
    difficulty: 'medium',
    // Nutrition per serving
    caloriesPerServing: '',
    proteinPerServing: '',
    carbsPerServing: '',
    fatPerServing: '',
  })

  // Fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/recipe-categories')
        .then(res => res.ok ? res.json() : { categories: [] })
        .then(data => setCategories(data.categories || []))
        .catch(() => setCategories([]))
    }
  }, [isOpen])

  // Initialize form with initialData
  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(prev => ({
        ...prev,
        title: initialData.title || '',
        description: initialData.description || '',
        categoryId: initialData.categoryId || '',
      }))
      if (initialData.image) {
        setImagePreview(initialData.image)
      }
    }
  }, [isOpen, initialData])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      categoryId: '',
      subcategoryId: '',
      servings: '4',
      prepTimeMinutes: '',
      cookTimeMinutes: '',
      difficulty: 'medium',
      caloriesPerServing: '',
      proteinPerServing: '',
      carbsPerServing: '',
      fatPerServing: '',
    })
    setImagePreview(null)
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('Receptnamn krävs')
      return
    }

    if (!formData.categoryId) {
      setError('Välj en kategori')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create recipe
      const recipeRes = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId || null,
          servings: parseInt(formData.servings) || 4,
          prepTimeMinutes: formData.prepTimeMinutes ? parseInt(formData.prepTimeMinutes) : null,
          cookTimeMinutes: formData.cookTimeMinutes ? parseInt(formData.cookTimeMinutes) : null,
          difficulty: formData.difficulty || null,
          coverImage: imagePreview,
          caloriesPerServing: formData.caloriesPerServing ? parseFloat(formData.caloriesPerServing) : null,
          proteinPerServing: formData.proteinPerServing ? parseFloat(formData.proteinPerServing) : null,
          carbsPerServing: formData.carbsPerServing ? parseFloat(formData.carbsPerServing) : null,
          fatPerServing: formData.fatPerServing ? parseFloat(formData.fatPerServing) : null,
          published: true,
        })
      })

      if (!recipeRes.ok) {
        const data = await recipeRes.json()
        throw new Error(data.error || 'Kunde inte skapa recept')
      }

      // If this was from a request, mark it as approved
      if (initialData?.requestId) {
        await fetch(`/api/recipe-requests/${initialData.requestId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' })
        })
      }

      setSuccess(true)
      onRecipeAdded()

      setTimeout(() => {
        handleClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Get subcategories for selected category
  const selectedCategory = categories.find(c => c.id === formData.categoryId)
  const subcategories = selectedCategory?.subcategories || []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-gold-primary" />
            <h2 className="text-lg font-semibold">Lägg till recept</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error/Success message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              Receptet har lagts till!
            </div>
          )}

          {/* Image upload */}
          <div>
            <Label className="text-sm font-medium">Bild</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-gold-primary transition-colors"
            >
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImagePreview(null)
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-4">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Klicka för att ladda upp bild</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Receptnamn *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="t.ex. Kycklinggryta med ris"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Beskrivning</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Kort beskrivning av receptet..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Kategori *</Label>
              <div className="relative mt-1">
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value, subcategoryId: '' }))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg appearance-none bg-white pr-10 text-sm"
                >
                  <option value="">Välj kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Underkategori</Label>
              <div className="relative mt-1">
                <select
                  value={formData.subcategoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategoryId: e.target.value }))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg appearance-none bg-white pr-10 text-sm"
                  disabled={!formData.categoryId || subcategories.length === 0}
                >
                  <option value="">Välj underkategori</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Servings and time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="servings" className="text-sm font-medium">Portioner</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="prepTime" className="text-sm font-medium">Förb. (min)</Label>
              <Input
                id="prepTime"
                type="number"
                min="0"
                value={formData.prepTimeMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, prepTimeMinutes: e.target.value }))}
                placeholder="15"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cookTime" className="text-sm font-medium">Tillagningstid</Label>
              <Input
                id="cookTime"
                type="number"
                min="0"
                value={formData.cookTimeMinutes}
                onChange={(e) => setFormData(prev => ({ ...prev, cookTimeMinutes: e.target.value }))}
                placeholder="30"
                className="mt-1"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <Label className="text-sm font-medium">Svårighetsgrad</Label>
            <div className="flex gap-2 mt-2">
              {[
                { id: 'easy', label: 'Lätt' },
                { id: 'medium', label: 'Medium' },
                { id: 'hard', label: 'Svår' },
              ].map(diff => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: diff.id }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.difficulty === diff.id
                      ? 'bg-gold-primary text-black'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nutrition per serving */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Näringsvärden per portion (valfritt)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="kcal" className="text-xs text-gray-500">Kalorier (kcal)</Label>
                <Input
                  id="kcal"
                  type="number"
                  min="0"
                  value={formData.caloriesPerServing}
                  onChange={(e) => setFormData(prev => ({ ...prev, caloriesPerServing: e.target.value }))}
                  placeholder="450"
                  className="mt-0.5"
                />
              </div>
              <div>
                <Label htmlFor="protein" className="text-xs text-gray-500">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.proteinPerServing}
                  onChange={(e) => setFormData(prev => ({ ...prev, proteinPerServing: e.target.value }))}
                  placeholder="35"
                  className="mt-0.5"
                />
              </div>
              <div>
                <Label htmlFor="carbs" className="text-xs text-gray-500">Kolhydrater (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.carbsPerServing}
                  onChange={(e) => setFormData(prev => ({ ...prev, carbsPerServing: e.target.value }))}
                  placeholder="45"
                  className="mt-0.5"
                />
              </div>
              <div>
                <Label htmlFor="fat" className="text-xs text-gray-500">Fett (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.fatPerServing}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatPerServing: e.target.value }))}
                  placeholder="15"
                  className="mt-0.5"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-gold-primary hover:bg-gold-primary/90 text-black font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isLoading ? 'Sparar...' : 'Lägg till recept'}
          </Button>
        </div>
      </div>
    </div>
  )
}
