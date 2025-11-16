'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  ChefHat,
  Search,
  Clock,
  Users,
  Heart,
  Filter,
  Flame
} from 'lucide-react'
import { toast } from 'sonner'

type RecipeCategory = {
  id: string
  name: string
}

type Recipe = {
  id: string
  title: string
  description?: string | null
  categoryId: string
  servings: number
  prepTimeMinutes?: number | null
  cookTimeMinutes?: number | null
  difficulty?: string | null
  mealType?: string | null
  cuisineType?: string | null
  coverImage?: string | null
  dietaryTags: string[]
  caloriesPerServing?: number | null
  category: RecipeCategory
  favorites: any[]
  _count: {
    favorites: number
  }
}

export default function RecipeBankPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  useEffect(() => {
    if (session?.user) {
      fetchRecipes()
      fetchCategories()
    }
  }, [session])

  const fetchRecipes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recipes?published=true')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes)
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

  const handleToggleFavorite = async (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchRecipes()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const isFavorited = (recipe: Recipe) => {
    return recipe.favorites && recipe.favorites.length > 0
  }

  const filteredRecipes = recipes.filter(recipe => {
    if (searchQuery && !recipe.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterCategory !== 'all' && recipe.category.id !== filterCategory) return false
    return true
  })

  const recipesByCategory = filteredRecipes.reduce((acc, recipe) => {
    const categoryName = recipe.category.name
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(recipe)
    return acc
  }, {} as Record<string, Recipe[]>)

  const getDifficultyLabel = (difficulty?: string | null) => {
    const labels: Record<string, string> = {
      easy: 'Lätt',
      medium: 'Medel',
      hard: 'Svår'
    }
    return difficulty ? labels[difficulty] || difficulty : null
  }

  const getMealTypeLabel = (mealType?: string | null) => {
    const labels: Record<string, string> = {
      breakfast: 'Frukost',
      lunch: 'Lunch',
      dinner: 'Middag',
      snack: 'Mellanmål',
      dessert: 'Dessert'
    }
    return mealType ? labels[mealType] || mealType : null
  }

  const getTotalTime = (recipe: Recipe) => {
    const prep = recipe.prepTimeMinutes || 0
    const cook = recipe.cookTimeMinutes || 0
    return prep + cook
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-gray-700">Du måste vara inloggad för att se denna sida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
          <ChefHat className="h-8 w-8 text-gold-primary" />
          Recept
        </h1>
        <p className="text-gray-600 mt-1">
          Utforska hälsosamma och näringsrika recept
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold-primary" />
          <Input
            placeholder="Sök recept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-gold-primary" />
          <div className="flex-1">
            <Label className="text-xs text-gray-700">Kategori</Label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla kategorier</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">{recipes.length}</p>
            <p className="text-sm text-gray-600 mt-1">Totalt recept</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
              {recipes.filter(r => isFavorited(r)).length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Favoriter</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="text-center">
            <p className="text-3xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">{categories.length}</p>
            <p className="text-sm text-gray-600 mt-1">Kategorier</p>
          </div>
        </div>
      </div>

      {/* Recipes by Category */}
      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-center text-gray-600">Laddar...</p>
        </div>
      ) : Object.keys(recipesByCategory).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ChefHat className="h-12 w-12 mx-auto text-gold-primary mb-4" />
          <p className="text-gray-600">Inga recept hittades.</p>
          <p className="text-sm text-gray-500 mt-1">
            Prova att ändra dina filter.
          </p>
        </div>
      ) : (
        Object.entries(recipesByCategory).map(([categoryName, categoryRecipes]) => (
          <div key={categoryName} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold flex items-center gap-2 text-gold-primary">
                <ChefHat className="h-5 w-5" />
                {categoryName}
                <Badge className="bg-gold-primary/10 text-gold-primary border border-gold-primary/30">
                  {categoryRecipes.length} recept
                </Badge>
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gold-primary hover:shadow-lg cursor-pointer transition-all relative group"
                  >
                    {recipe.coverImage && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={recipe.coverImage}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{recipe.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleToggleFavorite(recipe.id, e)}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              isFavorited(recipe) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                            }`}
                          />
                        </Button>
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        {recipe.mealType && (
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
                            {getMealTypeLabel(recipe.mealType)}
                          </Badge>
                        )}
                        {recipe.difficulty && (
                          <Badge className="bg-gold-primary/10 text-gold-primary border border-gold-primary/30">
                            {getDifficultyLabel(recipe.difficulty)}
                          </Badge>
                        )}
                        {recipe.caloriesPerServing && (
                          <Badge className="bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {Math.round(recipe.caloriesPerServing)} kcal
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {getTotalTime(recipe) > 0 && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTotalTime(recipe)} min
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {recipe.servings} portioner
                        </div>
                      </div>
                      {recipe.dietaryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {recipe.dietaryTags.slice(0, 3).map(tag => (
                            <Badge key={tag} className="text-xs bg-green-100 text-green-700 border border-green-200">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
