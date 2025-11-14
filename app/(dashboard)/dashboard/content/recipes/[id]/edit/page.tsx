'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Calculator } from 'lucide-react'
import Link from 'next/link'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { IngredientTable } from '@/components/recipe-editor/IngredientTable'
import { InstructionList } from '@/components/recipe-editor/InstructionList'
import {
  RecipeIngredient,
  RecipeInstruction,
  DIETARY_TAGS,
  MEAL_TYPES,
  DIFFICULTY_LEVELS
} from '@/components/recipe-editor/types'

interface RecipeCategory {
  id: string
  name: string
}

export default function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [recipeId, setRecipeId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)

  // Categories
  const [categories, setCategories] = useState<RecipeCategory[]>([])

  // Recipe basic info
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [servings, setServings] = useState(1)
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | null>(null)
  const [cookTimeMinutes, setCookTimeMinutes] = useState<number | null>(null)
  const [difficulty, setDifficulty] = useState('')
  const [mealType, setMealType] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [dietaryTags, setDietaryTags] = useState<string[]>([])
  const [published, setPublished] = useState(false)

  // Nutrition
  const [caloriesPerServing, setCaloriesPerServing] = useState<number | null>(null)
  const [proteinPerServing, setProteinPerServing] = useState<number | null>(null)
  const [carbsPerServing, setCarbsPerServing] = useState<number | null>(null)
  const [fatPerServing, setFatPerServing] = useState<number | null>(null)

  // Ingredients & Instructions
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [instructions, setInstructions] = useState<RecipeInstruction[]>([])

  useEffect(() => {
    const loadData = async () => {
      const { id } = await params
      setRecipeId(id)
      await Promise.all([fetchRecipe(id), fetchCategories()])
    }
    loadData()
  }, [])

  const fetchRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}`)
      if (response.ok) {
        const data = await response.json()
        const recipe = data.recipe

        setTitle(recipe.title)
        setDescription(recipe.description || '')
        setCategoryId(recipe.categoryId)
        setServings(recipe.servings)
        setPrepTimeMinutes(recipe.prepTimeMinutes)
        setCookTimeMinutes(recipe.cookTimeMinutes)
        setDifficulty(recipe.difficulty || '')
        setMealType(recipe.mealType || '')
        setCoverImage(recipe.coverImage || '')
        setVideoUrl(recipe.videoUrl || '')
        setDietaryTags(recipe.dietaryTags || [])
        setPublished(recipe.published)

        setCaloriesPerServing(recipe.caloriesPerServing)
        setProteinPerServing(recipe.proteinPerServing)
        setCarbsPerServing(recipe.carbsPerServing)
        setFatPerServing(recipe.fatPerServing)

        setIngredients(recipe.ingredients || [])
        setInstructions(recipe.instructions || [])
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
      toast({
        title: 'Error',
        description: 'Failed to load recipe',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/recipe-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAddIngredient = async (ingredient: Partial<RecipeIngredient>) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ingredient)
      })

      if (response.ok) {
        const data = await response.json()
        setIngredients([...ingredients, data.ingredient])
        toast({ title: 'Ingrediens tillagd' })
      }
    } catch (error) {
      console.error('Error adding ingredient:', error)
      toast({ title: 'Error', description: 'Failed to add ingredient', variant: 'destructive' })
    }
  }

  const handleUpdateIngredient = async (id: string, field: keyof RecipeIngredient, value: any) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        const data = await response.json()
        setIngredients(ingredients.map(ing => ing.id === id ? data.ingredient : ing))
      }
    } catch (error) {
      console.error('Error updating ingredient:', error)
    }
  }

  const handleDeleteIngredient = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/ingredients/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setIngredients(ingredients.filter(ing => ing.id !== id))
        toast({ title: 'Ingrediens borttagen' })
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
    }
  }

  const handleAddInstruction = async (instruction: Partial<RecipeInstruction>) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instruction)
      })

      if (response.ok) {
        const data = await response.json()
        setInstructions([...instructions, data.instruction])
        toast({ title: 'Steg tillagt' })
      }
    } catch (error) {
      console.error('Error adding instruction:', error)
      toast({ title: 'Error', description: 'Failed to add instruction', variant: 'destructive' })
    }
  }

  const handleUpdateInstruction = async (id: string, field: keyof RecipeInstruction, value: any) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/instructions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        const data = await response.json()
        setInstructions(instructions.map(inst => inst.id === id ? data.instruction : inst))
      }
    } catch (error) {
      console.error('Error updating instruction:', error)
    }
  }

  const handleDeleteInstruction = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/instructions/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setInstructions(instructions.filter(inst => inst.id !== id))
        toast({ title: 'Steg borttaget' })
      }
    } catch (error) {
      console.error('Error deleting instruction:', error)
    }
  }

  const handleCalculateNutrition = async () => {
    setCalculating(true)
    try {
      const response = await fetch(`/api/recipes/${recipeId}/calculate-nutrition`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        setCaloriesPerServing(data.nutrition.caloriesPerServing)
        setProteinPerServing(data.nutrition.proteinPerServing)
        setCarbsPerServing(data.nutrition.carbsPerServing)
        setFatPerServing(data.nutrition.fatPerServing)
        toast({ title: 'Näring beräknad automatiskt!' })
      }
    } catch (error) {
      console.error('Error calculating nutrition:', error)
      toast({ title: 'Error', description: 'Failed to calculate nutrition', variant: 'destructive' })
    } finally {
      setCalculating(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Titel krävs', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          categoryId,
          servings,
          prepTimeMinutes,
          cookTimeMinutes,
          difficulty,
          mealType,
          coverImage,
          videoUrl,
          dietaryTags,
          published,
          caloriesPerServing,
          proteinPerServing,
          carbsPerServing,
          fatPerServing
        })
      })

      if (response.ok) {
        toast({ title: 'Recept sparat!' })
        router.push('/dashboard/content/recipes')
      } else {
        toast({ title: 'Error', description: 'Failed to save recipe', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast({ title: 'Error', description: 'Failed to save recipe', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const toggleDietaryTag = (tag: string) => {
    setDietaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  const totalTime = (prepTimeMinutes || 0) + (cookTimeMinutes || 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content/recipes">
            <Button
              variant="ghost"
              size="icon"
              className="text-[rgba(255,255,255,0.7)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
              Redigera Recept
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              Uppdatera recept information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)]"
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>
      </div>

      {/* GRUNDINFORMATION */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Grundinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Proteinrik frukostpaj"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv receptet..."
              rows={3}
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Kategori *</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Måltidstyp</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Välj typ" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Portioner</Label>
              <Input
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Prep (min)</Label>
              <Input
                type="number"
                value={prepTimeMinutes || ''}
                onChange={(e) => setPrepTimeMinutes(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="15"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Tillagning (min)</Label>
              <Input
                type="number"
                value={cookTimeMinutes || ''}
                onChange={(e) => setCookTimeMinutes(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="30"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Svårighetsgrad</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Välj" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[rgba(255,255,255,0.7)] mb-2 block">Dietary Tags</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map(tag => (
                <button
                  key={tag.value}
                  onClick={() => toggleDietaryTag(tag.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    dietaryTags.includes(tag.value)
                      ? 'bg-[#FFD700] text-[#0a0a0a] font-medium'
                      : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.7)] hover:border-[rgba(255,215,0,0.5)]'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="published" className="text-[rgba(255,255,255,0.7)] cursor-pointer">
              Publicera recept
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* BILD */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Bild
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {coverImage && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-[rgba(255,215,0,0.2)]">
              <img src={coverImage} alt={title} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Bild URL</Label>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Video URL (valfri)</Label>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* INGREDIENSER */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
              Ingredienser ({ingredients.length})
            </CardTitle>
            {ingredients.length > 0 && (
              <Button
                onClick={handleCalculateNutrition}
                disabled={calculating}
                size="sm"
                className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {calculating ? 'Beräknar...' : 'Beräkna näring'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <IngredientTable
            ingredients={ingredients}
            onAdd={handleAddIngredient}
            onUpdate={handleUpdateIngredient}
            onDelete={handleDeleteIngredient}
          />
        </CardContent>
      </Card>

      {/* INSTRUKTIONER */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Instruktioner ({instructions.length} steg)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InstructionList
            instructions={instructions}
            onAdd={handleAddInstruction}
            onUpdate={handleUpdateInstruction}
            onDelete={handleDeleteInstruction}
          />
        </CardContent>
      </Card>

      {/* NÄRINGSINFORMATION */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Näringsinformation (per portion)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[rgba(255,255,255,0.6)] mb-4">
            Tryck på &ldquo;Beräkna näring&rdquo; ovan för att automatiskt beräkna från ingredienser, eller ange manuellt:
          </p>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Kalorier (kcal)</Label>
              <Input
                type="number"
                value={caloriesPerServing || ''}
                onChange={(e) => setCaloriesPerServing(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="400"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Protein (g)</Label>
              <Input
                type="number"
                value={proteinPerServing || ''}
                onChange={(e) => setProteinPerServing(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="25"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Kolhydrater (g)</Label>
              <Input
                type="number"
                value={carbsPerServing || ''}
                onChange={(e) => setCarbsPerServing(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="50"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Fett (g)</Label>
              <Input
                type="number"
                value={fatPerServing || ''}
                onChange={(e) => setFatPerServing(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="10"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
