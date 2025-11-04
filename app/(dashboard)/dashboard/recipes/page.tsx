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
  const [filterMealType, setFilterMealType] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

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
    if (filterMealType !== 'all' && recipe.mealType !== filterMealType) return false
    if (filterDifficulty !== 'all' && recipe.difficulty !== filterDifficulty) return false
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
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ChefHat className="h-8 w-8" />
          Recept Bank
        </h1>
        <p className="text-muted-foreground mt-1">
          Utforska hälsosamma och näringsrika recept
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök recept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Kategori</Label>
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
              <div>
                <Label className="text-xs">Måltidstyp</Label>
                <Select value={filterMealType} onValueChange={setFilterMealType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla måltider</SelectItem>
                    <SelectItem value="breakfast">Frukost</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Middag</SelectItem>
                    <SelectItem value="snack">Mellanmål</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Svårighetsgrad</Label>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla nivåer</SelectItem>
                    <SelectItem value="easy">Lätt</SelectItem>
                    <SelectItem value="medium">Medel</SelectItem>
                    <SelectItem value="hard">Svår</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{recipes.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Totalt recept</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {recipes.filter(r => isFavorited(r)).length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Favoriter</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Kategorier</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipes by Category */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Laddar...</p>
          </CardContent>
        </Card>
      ) : Object.keys(recipesByCategory).length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Inga recept hittades.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Prova att ändra dina filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(recipesByCategory).map(([categoryName, categoryRecipes]) => (
          <Card key={categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                {categoryName}
                <Badge variant="outline">{categoryRecipes.length} recept</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryRecipes.map(recipe => (
                  <div
                    key={recipe.id}
                    onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                    className="border rounded-lg overflow-hidden hover:shadow-lg cursor-pointer transition-shadow relative group"
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
                        <h3 className="font-semibold text-lg">{recipe.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleToggleFavorite(recipe.id, e)}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              isFavorited(recipe) ? 'fill-red-500 text-red-500' : ''
                            }`}
                          />
                        </Button>
                      </div>
                      {recipe.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        {recipe.mealType && (
                          <Badge variant="secondary">{getMealTypeLabel(recipe.mealType)}</Badge>
                        )}
                        {recipe.difficulty && (
                          <Badge variant="outline">{getDifficultyLabel(recipe.difficulty)}</Badge>
                        )}
                        {recipe.caloriesPerServing && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            {Math.round(recipe.caloriesPerServing)} kcal
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
