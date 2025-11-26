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
import { ChefHat, Clock, Users, Flame, ArrowLeft, X, Pencil } from 'lucide-react'
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
  const [subcategories, setSubcategories] = useState<RecipeSubcategory[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

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

      // Fetch category info and subcategories
      const categoryResponse = await fetch('/api/recipe-categories')
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        const foundCategory = categoryData.categories.find((c: RecipeCategory) => c.slug === slug)
        if (foundCategory) {
          setCategory(foundCategory)

          // Fetch subcategories for this category
          const subcategoriesResponse = await fetch(`/api/recipe-subcategories?categoryId=${foundCategory.id}`)
          if (subcategoriesResponse.ok) {
            const subcategoriesData = await subcategoriesResponse.json()
            setSubcategories(subcategoriesData.subcategories || [])
          }

          // Still fetch recipes for backward compatibility
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

  const handleRecipeClick = (recipe: Recipe) => {
    if (isCoach) {
      setSelectedRecipe(recipe)
    } else {
      router.push(`/dashboard/recipes/${recipe.id}`)
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
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push('/dashboard/recipes')}
          className="flex items-center gap-2 text-gray-500 hover:text-gold-primary transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka</span>
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-3 sm:mb-4 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-2">
            {category.name}
          </h1>
          <p className="text-gray-400 text-xs">
            {recipes.length} {recipes.length === 1 ? 'recept' : 'recept'}
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-3 sm:mt-4 opacity-30" />
        </div>
      </div>

      {/* Subcategories or Recipes */}
      {subcategories.length > 0 ? (
        // Show subcategory cards - compact style
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {subcategories.map((subcategory) => {
            const subcategoryRecipeCount = recipes.filter(r => r.subcategory?.id === subcategory.id).length
            const categoryColor = category?.color || '#f97316'
            return (
              <div
                key={subcategory.id}
                onClick={() => router.push(`/dashboard/recipes/category/${slug}/${subcategory.slug}`)}
                className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center"
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md"
                  style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)` }}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">
                  {subcategory.name}
                </h3>
                <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5">
                  {subcategoryRecipeCount} recept
                </p>
              </div>
            )
          })}
        </div>
      ) : recipes.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="text-center py-12">
            <ChefHat className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              Inga recept i denna kategori ännu
            </p>
          </CardContent>
        </Card>
      ) : hasSubcategories ? (
        // Column layout with subcategories - compact style
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {Object.entries(groupedRecipes).sort(([a], [b]) => {
            if (a === 'Övrigt') return 1
            if (b === 'Övrigt') return -1
            return a.localeCompare(b, 'sv')
          }).flatMap(([subcategoryName, subcategoryRecipes]) =>
            subcategoryRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe)}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {recipe.coverImage ? (
                  <div className="h-20 sm:h-24 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={recipe.coverImage}
                      alt={recipe.title}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-20 sm:h-24 w-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                    <ChefHat className="h-8 w-8 text-orange-300" />
                  </div>
                )}
                <div className="p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-gold-primary transition-colors">
                    {recipe.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                      <div className="flex items-center gap-0.5 text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]">{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m</span>
                      </div>
                    )}
                    {recipe.caloriesPerServing && (
                      <div className="flex items-center gap-0.5 text-gray-400">
                        <Flame className="h-3 w-3" />
                        <span className="text-[10px]">{Math.round(recipe.caloriesPerServing)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Regular grid without subcategories - compact style
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => handleRecipeClick(recipe)}
              className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              {recipe.coverImage ? (
                <div className="h-20 sm:h-24 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={recipe.coverImage}
                    alt={recipe.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="h-20 sm:h-24 w-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                  <ChefHat className="h-8 w-8 text-orange-300" />
                </div>
              )}
              <div className="p-2 sm:p-3">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-gold-primary transition-colors">
                  {recipe.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  {(recipe.prepTimeMinutes || recipe.cookTimeMinutes) && (
                    <div className="flex items-center gap-0.5 text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span className="text-[10px]">{(recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)}m</span>
                    </div>
                  )}
                  {recipe.caloriesPerServing && (
                    <div className="flex items-center gap-0.5 text-gray-400">
                      <Flame className="h-3 w-3" />
                      <span className="text-[10px]">{Math.round(recipe.caloriesPerServing)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
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

                  {/* Actions */}
                  <div className="flex justify-end pt-4 border-t border-gold-primary/20">
                    <Button
                      onClick={() => {
                        setSelectedRecipe(null)
                        router.push(`/dashboard/content/recipes/${selectedRecipe.id}/edit`)
                      }}
                      className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
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
