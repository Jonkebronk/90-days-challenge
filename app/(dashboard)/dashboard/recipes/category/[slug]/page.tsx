'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChefHat, Clock, Users, Flame, ArrowLeft, X, Pencil, Save } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

type RecipeSubcategory = {
  id: string
  name: string
  slug: string
}

type RecipeCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

type Recipe = {
  id: string
  title: string
  description?: string | null
  servings: number
  prepTimeMinutes?: number | null
  cookTimeMinutes?: number | null
  difficulty?: string | null
  coverImage?: string | null
  caloriesPerServing?: number | null
  category: RecipeCategory
  subcategory?: RecipeSubcategory | null
}

export default function RecipeCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [slug, setSlug] = useState<string>('')
  const [category, setCategory] = useState<RecipeCategory | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [availableSubcategories, setAvailableSubcategories] = useState<RecipeSubcategory[]>([])
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const isCoach = (session?.user as any)?.role === 'coach'

  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  useEffect(() => {
    if (session?.user && slug) {
      fetchCategoryAndRecipes()
    }
  }, [session, slug])

  const fetchCategoryAndRecipes = async () => {
    try {
      setIsLoading(true)

      // Fetch category info
      const categoryResponse = await fetch('/api/recipe-categories')
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        const foundCategory = categoryData.categories.find((c: RecipeCategory) => c.slug === slug)
        if (foundCategory) {
          setCategory(foundCategory)

          // Fetch recipes for this category
          const recipesResponse = await fetch(`/api/recipes?categoryId=${foundCategory.id}`)
          if (recipesResponse.ok) {
            const recipesData = await recipesResponse.json()
            setRecipes(recipesData.recipes)
          }
        } else {
          toast.error('Kategori hittades inte')
          router.push('/dashboard/recipes')
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubcategories = async () => {
    try {
      const response = await fetch('/api/recipe-subcategories')
      if (response.ok) {
        const data = await response.json()
        setAvailableSubcategories(data.subcategories || [])
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }

  const handleRecipeClick = (recipe: Recipe) => {
    if (isCoach) {
      setSelectedRecipe(recipe)
      setSelectedSubcategoryId(recipe.subcategory?.id || 'none')
      if (availableSubcategories.length === 0) {
        fetchSubcategories()
      }
    } else {
      router.push(`/dashboard/recipes/${recipe.id}`)
    }
  }

  const handleSaveSubcategory = async () => {
    if (!selectedRecipe) return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/recipes/${selectedRecipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subcategoryId: selectedSubcategoryId && selectedSubcategoryId !== 'none' ? selectedSubcategoryId : null,
        }),
      })

      if (response.ok) {
        toast.success('Subkategori uppdaterad')
        setSelectedRecipe(null)
        fetchCategoryAndRecipes()
      } else {
        toast.error('Kunde inte uppdatera')
      }
    } catch (error) {
      console.error('Error updating recipe:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return ChefHat
    const Icon = (LucideIcons as any)[iconName] || ChefHat
    return Icon
  }

  // Group recipes by subcategory
  const groupedRecipes = recipes.reduce((acc, recipe) => {
    const key = recipe.subcategory?.name || 'Övrigt'
    if (!acc[key]) acc[key] = []
    acc[key].push(recipe)
    return acc
  }, {} as Record<string, Recipe[]>)

  const hasSubcategories = Object.keys(groupedRecipes).length > 1 || !groupedRecipes['Övrigt']

  if (!session?.user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!category) {
    return null
  }

  const Icon = getIconComponent(category.icon)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/recipes')}
          className="flex items-center gap-2 text-gray-400 hover:text-gold-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka till kategorier</span>
        </button>

        <div className="text-center">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mb-6 opacity-20" />

          <div className="flex items-center justify-center gap-4 mb-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${category.color}20` }}
            >
              <Icon className="h-8 w-8" style={{ color: category.color }} />
            </div>
            <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent">
              {category.name}
            </h1>
          </div>

          <p className="text-gray-400 text-sm tracking-[1px]">
            {recipes.length} {recipes.length === 1 ? 'recept' : 'recept'}
          </p>

          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
        </div>
      </div>

      {/* Recipes */}
      {recipes.length === 0 ? (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="text-center py-16">
            <ChefHat className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Inga recept i denna kategori ännu
            </p>
          </CardContent>
        </Card>
      ) : hasSubcategories ? (
        // Column layout with subcategories
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Object.entries(groupedRecipes).sort(([a], [b]) => {
            if (a === 'Övrigt') return 1
            if (b === 'Övrigt') return -1
            return a.localeCompare(b, 'sv')
          }).map(([subcategoryName, subcategoryRecipes]) => (
            <Card
              key={subcategoryName}
              className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]"
            >
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gold-light mb-4 tracking-[1px] text-center">
                  {subcategoryName}
                </h3>
                <div className="space-y-3">
                  {subcategoryRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => handleRecipeClick(recipe)}
                      className="group p-4 bg-white/5 border border-gold-primary/20 hover:border-gold-primary/60 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                    >
                      <h4 className="text-sm font-semibold text-gray-200 mb-2 group-hover:text-gold-light transition-colors">
                        {recipe.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{recipe.servings}</span>
                        </div>
                        {recipe.caloriesPerServing && (
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            <span>{Math.round(recipe.caloriesPerServing)} kcal</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Regular grid without subcategories
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              onClick={() => handleRecipeClick(recipe)}
              className="group relative bg-white/5 border-2 border-gold-primary/20 hover:border-gold-primary/60 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-[10px] overflow-hidden"
            >
              {/* Cover Image */}
              {recipe.coverImage ? (
                <div className="h-48 w-full bg-gray-900 overflow-hidden">
                  <img
                    src={recipe.coverImage}
                    alt={recipe.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-48 w-full bg-gradient-to-br from-gold-primary/10 to-gold-secondary/10 flex items-center justify-center">
                  <ChefHat className="h-16 w-16 text-gold-primary/30" />
                </div>
              )}

              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gold-light mb-2 tracking-[1px] group-hover:text-gold-primary transition-colors">
                  {recipe.title}
                </h3>

                {recipe.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</span>
                  </div>
                  {recipe.caloriesPerServing && (
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      <span>{Math.round(recipe.caloriesPerServing)} kcal</span>
                    </div>
                  )}
                </div>

                {recipe.difficulty && (
                  <div className="mt-3">
                    <Badge className="bg-gold-primary/10 text-gold-primary border border-gold-primary/30">
                      {recipe.difficulty}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Edit Dialog (Coach Only) */}
      {isCoach && (
        <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
          <DialogContent className="bg-[#0a0a0a] border-2 border-gold-primary/30 text-white max-w-2xl">
            {selectedRecipe && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-gold-light flex items-center justify-between">
                    {selectedRecipe.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedRecipe(null)}
                      className="text-gray-400 hover:text-gold-light"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Visa och redigera receptinformation
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Cover Image */}
                  {selectedRecipe.coverImage && (
                    <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-gold-primary/20">
                      <img
                        src={selectedRecipe.coverImage}
                        alt={selectedRecipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Description */}
                  {selectedRecipe.description && (
                    <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-4">
                      <p className="text-gray-300">{selectedRecipe.description}</p>
                    </div>
                  )}

                  {/* Recipe Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Portioner</p>
                      <p className="text-xl font-bold text-gold-light">{selectedRecipe.servings}</p>
                    </div>
                    {selectedRecipe.prepTimeMinutes && (
                      <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Förberedelsetid</p>
                        <p className="text-xl font-bold text-gold-light">{selectedRecipe.prepTimeMinutes} min</p>
                      </div>
                    )}
                    {selectedRecipe.cookTimeMinutes && (
                      <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Tillagningstid</p>
                        <p className="text-xl font-bold text-gold-light">{selectedRecipe.cookTimeMinutes} min</p>
                      </div>
                    )}
                    {selectedRecipe.caloriesPerServing && (
                      <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">Kalorier</p>
                        <p className="text-xl font-bold text-gold-light">{Math.round(selectedRecipe.caloriesPerServing)}</p>
                        <p className="text-xs text-gray-400">/portion</p>
                      </div>
                    )}
                  </div>

                  {/* Subcategory Selection */}
                  <div className="bg-white/5 border border-gold-primary/20 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Subkategori</p>
                    <Select value={selectedSubcategoryId} onValueChange={setSelectedSubcategoryId}>
                      <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                        <SelectValue placeholder="Välj subkategori (valfritt)" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                        <SelectItem value="none" className="text-white">Ingen subkategori</SelectItem>
                        {availableSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id} className="text-white">
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gold-primary/20">
                    <Button
                      onClick={handleSaveSubcategory}
                      disabled={isSaving}
                      className="flex-1 bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Sparar...' : 'Spara subkategori'}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRecipe(null)
                        router.push(`/dashboard/recipes/${selectedRecipe.id}/edit`)
                      }}
                      variant="outline"
                      className="border-gold-primary/50 text-gold-light hover:bg-gold-50/10"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Redigera recept
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
