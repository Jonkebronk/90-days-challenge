'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, ChefHat, Settings2, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { RecipeCustomizerDialog } from '@/components/recipe-customizer'
import type { CalculatedMacros } from '@/lib/types/meal-plan-generator'

type Recipe = {
  id: string
  title: string
  coverImage: string | null
  caloriesPerServing: number | null
  proteinPerServing: number | null
  carbsPerServing: number | null
  fatPerServing: number | null
  servings: number
  mealType: string | null
  difficulty: string | null
  published: boolean
  category: {
    id: string
    name: string
  }
}

type RecipeCategory = {
  id: string
  name: string
}

type RecipeSelectionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (recipe: Recipe, servingMultiplier: number) => void
  // Optional props for recipe customization
  mealPlanId?: string
  mealIndex?: number
  targetMacros?: CalculatedMacros
  onCustomizeSuccess?: () => void
}

export function RecipeSelectionDialog({
  open,
  onOpenChange,
  onSelect,
  mealPlanId,
  mealIndex,
  targetMacros,
  onCustomizeSuccess,
}: RecipeSelectionDialogProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [servingMultipliers, setServingMultipliers] = useState<Record<string, number>>({})

  // Customizer state
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [selectedRecipeForCustomize, setSelectedRecipeForCustomize] = useState<string | null>(null)

  // Favorites state
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Check if customization is available
  const canCustomize = !!(mealPlanId && mealIndex !== undefined)

  useEffect(() => {
    if (open) {
      fetchRecipes()
      fetchCategories()
      fetchFavorites()
    }
  }, [open])

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/recipes/favorites')
      if (res.ok) {
        const data = await res.json()
        const favIds = new Set<string>()
        for (const fav of data.favorites || []) {
          if (fav.recipeId) {
            favIds.add(fav.recipeId)
          }
        }
        setFavorites(favIds)
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
    }
  }

  const toggleFavorite = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isFavorite = favorites.has(recipeId)

    // Optimistic update
    if (isFavorite) {
      setFavorites(prev => {
        const next = new Set(prev)
        next.delete(recipeId)
        return next
      })
    } else {
      setFavorites(prev => new Set(prev).add(recipeId))
    }

    try {
      // Toggle endpoint handles both add and remove
      const res = await fetch(`/api/recipes/${recipeId}/favorite`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to toggle favorite')
    } catch (err) {
      console.error('Error toggling favorite:', err)
      // Revert on error
      if (isFavorite) {
        setFavorites(prev => new Set(prev).add(recipeId))
      } else {
        setFavorites(prev => {
          const next = new Set(prev)
          next.delete(recipeId)
          return next
        })
      }
    }
  }

  const fetchRecipes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recipes')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes.filter((r: Recipe) => r.published))
      } else {
        toast.error('Kunde inte hämta recept')
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

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

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || recipe.category.id === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleSelectRecipe = (recipe: Recipe) => {
    const multiplier = servingMultipliers[recipe.id] || 1
    onSelect(recipe, multiplier)
    onOpenChange(false)
    // Reset state
    setSearchTerm('')
    setSelectedCategory('all')
    setServingMultipliers({})
  }

  const getServingMultiplier = (recipeId: string) => {
    return servingMultipliers[recipeId] || 1
  }

  const setServingMultiplier = (recipeId: string, value: number) => {
    setServingMultipliers((prev) => ({ ...prev, [recipeId]: value }))
  }

  // Handle clicking "Anpassa" button
  const handleCustomizeRecipe = (recipeId: string) => {
    setSelectedRecipeForCustomize(recipeId)
    setCustomizerOpen(true)
  }

  // Handle successful customization
  const handleCustomizeSuccess = () => {
    setCustomizerOpen(false)
    setSelectedRecipeForCustomize(null)
    onOpenChange(false)
    onCustomizeSuccess?.()
    toast.success('Recept anpassat och tillagt i måltiden')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Välj recept</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Sök och välj ett recept från receptbanken
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search" className="text-zinc-700">
              Sök recept
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sök efter recept..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category" className="text-zinc-700">
              Kategori
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Alla kategorier
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recipe List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            <p className="text-zinc-500 text-center py-8">Laddar...</p>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-zinc-300 mb-4" />
              <p className="text-zinc-500">Inga recept hittades.</p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const multiplier = getServingMultiplier(recipe.id)
              return (
                <div
                  key={recipe.id}
                  className="p-4 bg-white border border-zinc-200 rounded-lg hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {recipe.coverImage ? (
                      <img
                        src={recipe.coverImage}
                        alt={recipe.title}
                        className="w-16 h-16 object-cover rounded-lg shrink-0 bg-zinc-100"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-zinc-100 rounded-lg flex items-center justify-center shrink-0">
                        <ChefHat className="h-8 w-8 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-zinc-900 font-medium">{recipe.title}</h3>
                        <button
                          onClick={(e) => toggleFavorite(recipe.id, e)}
                          className={`p-1.5 rounded-full transition-colors shrink-0 ${
                            favorites.has(recipe.id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'text-zinc-300 hover:text-red-400'
                          }`}
                          title={favorites.has(recipe.id) ? 'Ta bort favorit' : 'Lägg till favorit'}
                        >
                          <Heart
                            className="h-5 w-5"
                            fill={favorites.has(recipe.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs">
                          {recipe.category.name}
                        </Badge>
                        {recipe.mealType && (
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">
                            {recipe.mealType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {recipe.caloriesPerServing || recipe.proteinPerServing || recipe.fatPerServing || recipe.carbsPerServing ? (
                          <>
                            {recipe.caloriesPerServing ? `${Math.round(recipe.caloriesPerServing * multiplier)} kcal` : null}
                            {recipe.caloriesPerServing && (recipe.proteinPerServing || recipe.fatPerServing || recipe.carbsPerServing) ? ' • ' : null}
                            {recipe.proteinPerServing ? `P: ${Math.round(recipe.proteinPerServing * multiplier)}g` : null}
                            {recipe.proteinPerServing && (recipe.fatPerServing || recipe.carbsPerServing) ? ' • ' : null}
                            {recipe.fatPerServing ? `F: ${Math.round(recipe.fatPerServing * multiplier)}g` : null}
                            {recipe.fatPerServing && recipe.carbsPerServing ? ' • ' : null}
                            {recipe.carbsPerServing ? `K: ${Math.round(recipe.carbsPerServing * multiplier)}g` : null}
                          </>
                        ) : (
                          <span className="text-zinc-400 italic">Makros ej angivna</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Portioner och knappar på egen rad */}
                  <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-zinc-100">
                    <Label
                      htmlFor={`multiplier-${recipe.id}`}
                      className="text-sm text-zinc-500"
                    >
                      Portioner:
                    </Label>
                    <Input
                      id={`multiplier-${recipe.id}`}
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={multiplier}
                      onChange={(e) =>
                        setServingMultiplier(recipe.id, parseFloat(e.target.value) || 1)
                      }
                      className="w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {canCustomize && (
                      <Button
                        onClick={() => handleCustomizeRecipe(recipe.id)}
                        variant="outline"
                        className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        Anpassa
                      </Button>
                    )}
                    <Button
                      onClick={() => handleSelectRecipe(recipe)}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Välj
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </DialogContent>

      {/* Recipe Customizer Dialog */}
      {canCustomize && selectedRecipeForCustomize && (
        <RecipeCustomizerDialog
          recipeId={selectedRecipeForCustomize}
          mealPlanId={mealPlanId!}
          mealIndex={mealIndex!}
          targetMacros={targetMacros}
          open={customizerOpen}
          onOpenChange={setCustomizerOpen}
          onSuccess={handleCustomizeSuccess}
        />
      )}
    </Dialog>
  )
}
