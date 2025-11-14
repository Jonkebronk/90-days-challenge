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
import { Search, ChefHat } from 'lucide-react'
import { toast } from 'sonner'

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
}

export function RecipeSelectionDialog({
  open,
  onOpenChange,
  onSelect,
}: RecipeSelectionDialogProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [servingMultipliers, setServingMultipliers] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) {
      fetchRecipes()
      fetchCategories()
    }
  }, [open])

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            Välj recept
          </DialogTitle>
          <DialogDescription className="text-[rgba(255,255,255,0.6)]">
            Sök och välj ett recept från receptbanken
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search" className="text-[rgba(255,255,255,0.8)]">
              Sök recept
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sök efter recept..."
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category" className="text-[rgba(255,255,255,0.8)]">
              Kategori
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                <SelectItem
                  value="all"
                  className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                >
                  Alla kategorier
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
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
            <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">Inga recept hittades.</p>
            </div>
          ) : (
            filteredRecipes.map((recipe) => {
              const multiplier = getServingMultiplier(recipe.id)
              return (
                <div
                  key={recipe.id}
                  className="flex items-center justify-between p-4 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg hover:border-[rgba(255,215,0,0.4)] transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {recipe.coverImage ? (
                      <img
                        src={recipe.coverImage}
                        alt={recipe.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                        <ChefHat className="h-8 w-8 text-[rgba(255,215,0,0.5)]" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{recipe.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-[rgba(255,215,0,0.1)] text-[#FFD700] border border-[rgba(255,215,0,0.3)] text-xs">
                          {recipe.category.name}
                        </Badge>
                        {recipe.mealType && (
                          <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)] text-xs">
                            {recipe.mealType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">
                        {recipe.caloriesPerServing
                          ? `${Math.round(recipe.caloriesPerServing * multiplier)} kcal`
                          : '-'}{' '}
                        •{' '}
                        {recipe.proteinPerServing
                          ? `P: ${Math.round(recipe.proteinPerServing * multiplier)}g`
                          : '-'}{' '}
                        •{' '}
                        {recipe.fatPerServing
                          ? `F: ${Math.round(recipe.fatPerServing * multiplier)}g`
                          : '-'}{' '}
                        •{' '}
                        {recipe.carbsPerServing
                          ? `K: ${Math.round(recipe.carbsPerServing * multiplier)}g`
                          : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`multiplier-${recipe.id}`}
                        className="text-sm text-[rgba(255,255,255,0.6)] whitespace-nowrap"
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
                        className="w-20 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                      />
                    </div>
                    <Button
                      onClick={() => handleSelectRecipe(recipe)}
                      className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
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
    </Dialog>
  )
}
