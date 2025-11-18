'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface RecipeSubcategory {
  id: string
  name: string
  slug: string
}

interface RecipeCategory {
  id: string
  name: string
  subcategories?: RecipeSubcategory[]
}

interface SimpleIngredient {
  id?: string
  name: string
  amount: string
  unit: string
  grams: string
}

interface SimpleInstruction {
  id?: string
  step: number
  text: string
  duration?: string
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [recipeId, setRecipeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Categories
  const [categories, setCategories] = useState<RecipeCategory[]>([])

  // Recipe basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [subcategories, setSubcategories] = useState<RecipeSubcategory[]>([])
  const [servings, setServings] = useState(1)
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('')
  const [cookTimeMinutes, setCookTimeMinutes] = useState('')

  // Simple ingredients
  const [ingredients, setIngredients] = useState<SimpleIngredient[]>([
    { name: '', amount: '', unit: 'g', grams: '' }
  ])

  // Simple instructions
  const [instructions, setInstructions] = useState<SimpleInstruction[]>([
    { step: 1, text: '', duration: '' }
  ])

  // Nutrition per serving
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params
      setRecipeId(id)
      await Promise.all([fetchRecipe(id), fetchCategories()])
    }
    loadData()
  }, [])

  useEffect(() => {
    if (categoryId) {
      const category = categories.find(c => c.id === categoryId)
      setSubcategories(category?.subcategories || [])
    } else {
      setSubcategories([])
    }
  }, [categoryId, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/recipe-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}`)
      if (response.ok) {
        const data = await response.json()
        const recipe = data.recipe

        setTitle(recipe.title)
        setDescription(recipe.description || '')
        setCategoryId(recipe.categoryId)
        setSubcategoryId(recipe.subcategoryId || '')
        setServings(recipe.servings)
        setPrepTimeMinutes(recipe.prepTimeMinutes?.toString() || '')
        setCookTimeMinutes(recipe.cookTimeMinutes?.toString() || '')

        // Convert existing ingredients to simple format
        if (recipe.ingredients && recipe.ingredients.length > 0) {
          setIngredients(recipe.ingredients.map((ing: any) => ({
            id: ing.id,
            name: ing.foodItem?.name || '',
            amount: ing.displayAmount || '',
            unit: ing.displayUnit || 'g',
            grams: ing.amount?.toString() || ''
          })))
        }

        // Convert existing instructions
        if (recipe.instructions && recipe.instructions.length > 0) {
          setInstructions(recipe.instructions.map((inst: any) => ({
            id: inst.id,
            step: inst.stepNumber,
            text: inst.instruction,
            duration: inst.duration?.toString() || ''
          })))
        }

        // Nutrition
        setCalories(recipe.caloriesPerServing?.toString() || '')
        setProtein(recipe.proteinPerServing?.toString() || '')
        setCarbs(recipe.carbsPerServing?.toString() || '')
        setFat(recipe.fatPerServing?.toString() || '')

        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
      setLoading(false)
    }
  }

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'g', grams: '' }])
  }

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleUpdateIngredient = (index: number, field: keyof SimpleIngredient, value: string) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const handleAddInstruction = () => {
    setInstructions([...instructions, { step: instructions.length + 1, text: '', duration: '' }])
  }

  const handleRemoveInstruction = (index: number) => {
    const filtered = instructions.filter((_, i) => i !== index)
    // Renumber steps
    const renumbered = filtered.map((inst, i) => ({ ...inst, step: i + 1 }))
    setInstructions(renumbered)
  }

  const handleUpdateInstruction = (index: number, field: keyof SimpleInstruction, value: string) => {
    const updated = [...instructions]
    updated[index] = { ...updated[index], [field]: value }
    setInstructions(updated)
  }

  const handleSave = async () => {
    if (!title || !categoryId) {
      alert('Titel och kategori krävs')
      return
    }

    setSaving(true)
    try {
      // Save basic recipe info
      const recipeResponse = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId,
          subcategoryId: subcategoryId || null,
          servings,
          prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes) : null,
          cookTimeMinutes: cookTimeMinutes ? parseInt(cookTimeMinutes) : null,
          caloriesPerServing: calories ? parseFloat(calories) : null,
          proteinPerServing: protein ? parseFloat(protein) : null,
          carbsPerServing: carbs ? parseFloat(carbs) : null,
          fatPerServing: fat ? parseFloat(fat) : null,
        })
      })

      if (!recipeResponse.ok) {
        throw new Error('Failed to save recipe')
      }

      alert('Recept sparat!')
      router.push('/dashboard/content/recipes')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Fel vid sparande')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-900">
        <div className="w-12 h-12 border-4 border-gold-primary/30 border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gold-primary/20 bg-white/5 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-gold-light"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Tillbaka</span>
          </button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-gray-100 hover:bg-gold-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Grundinformation */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-100">Grundinformation</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-300">Titel *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="t.ex. Protein pannkakor"
                className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
              />
            </div>

            <div>
              <Label className="text-sm text-gray-300">Beskrivning</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv receptet..."
                rows={2}
                className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-300">Kategori *</Label>
                <Select value={categoryId} onValueChange={(value) => {
                  setCategoryId(value)
                  setSubcategoryId('')
                }}>
                  <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white">
                    <SelectValue placeholder="Välj" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {subcategories.length > 0 && (
                <div>
                  <Label className="text-sm text-gray-300">Subkategori</Label>
                  <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                    <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white">
                      <SelectValue placeholder="Välj (valfritt)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-300">Portioner</Label>
                <Input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ingredienser */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Ingredienser ({ingredients.length})</h2>
            <Button
              onClick={handleAddIngredient}
              size="sm"
              variant="outline"
              className="bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-gray-100"
            >
              <Plus className="w-4 h-4 mr-1" />
              Lägg till
            </Button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-2">
              <div className="col-span-4">Ingrediens</div>
              <div className="col-span-2">Mängd</div>
              <div className="col-span-2">Enhet</div>
              <div className="col-span-2">Vikt (g)</div>
              <div className="col-span-1"></div>
            </div>

            {ingredients.map((ing, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <Input
                    value={ing.name}
                    onChange={(e) => handleUpdateIngredient(index, 'name', e.target.value)}
                    placeholder="Ingrediens..."
                    className="text-sm bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={ing.amount}
                    onChange={(e) => handleUpdateIngredient(index, 'amount', e.target.value)}
                    placeholder="2"
                    className="text-sm bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={ing.unit}
                    onValueChange={(value) => handleUpdateIngredient(index, 'unit', value)}
                  >
                    <SelectTrigger className="text-sm bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">gram (g)</SelectItem>
                      <SelectItem value="dl">deciliter (dl)</SelectItem>
                      <SelectItem value="ml">milliliter (ml)</SelectItem>
                      <SelectItem value="tsk">tesked (tsk)</SelectItem>
                      <SelectItem value="msk">matsked (msk)</SelectItem>
                      <SelectItem value="st">styck (st)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={ing.grams}
                    onChange={(e) => handleUpdateIngredient(index, 'grams', e.target.value)}
                    placeholder="100"
                    className="text-sm bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-[rgba(255,255,255,0.4)] hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tillagningsinstruktioner */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-100">Tillagningsinstruktioner ({instructions.length} steg)</h2>
            <Button
              onClick={handleAddInstruction}
              size="sm"
              variant="outline"
              className="bg-[rgba(255,255,255,0.05)] border-gold-primary/30 text-gray-100"
            >
              <Plus className="w-4 h-4 mr-1" />
              Lägg till steg
            </Button>
          </div>

          <div className="space-y-3">
            {instructions.map((inst, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[rgba(255,215,0,0.2)] flex items-center justify-center text-sm font-medium text-gold-light">
                  {inst.step}
                </div>
                <div className="flex-1">
                  <Textarea
                    value={inst.text}
                    onChange={(e) => handleUpdateInstruction(index, 'text', e.target.value)}
                    placeholder="Beskriv detta steg..."
                    rows={2}
                    className="text-sm bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={inst.duration || ''}
                    onChange={(e) => handleUpdateInstruction(index, 'duration', e.target.value)}
                    placeholder="Min"
                    className="text-sm bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
                  />
                </div>
                <button
                  onClick={() => handleRemoveInstruction(index)}
                  className="text-[rgba(255,255,255,0.4)] hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Näringsinformation */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-100">Näringsinformation (per portion)</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm text-gray-300">Kalorier (kcal)</Label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="400"
                className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Protein (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="25"
                className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Kolhydrater (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="50"
                className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-300">Fett (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="10"
                className="mt-1 bg-[rgba(255,255,255,0.05)] border-gold-primary/20 text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
