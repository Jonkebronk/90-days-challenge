'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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

export default function RecipeSubcategoryPage({
  params
}: {
  params: Promise<{ slug: string, subcategorySlug: string }>
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [slug, setSlug] = useState<string>('')
  const [subcategorySlug, setSubcategorySlug] = useState<string>('')
  const [category, setCategory] = useState<RecipeCategory | null>(null)
  const [subcategory, setSubcategory] = useState<RecipeSubcategory | null>(null)
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const isCoach = (session?.user as any)?.role === 'coach'

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug)
      setSubcategorySlug(p.subcategorySlug)
    })
  }, [params])

  useEffect(() => {
    if (session?.user && slug && subcategorySlug) {
      fetchData()
    }
  }, [session, slug, subcategorySlug])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch category info
      const categoryResponse = await fetch('/api/recipe-categories')
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json()
        const foundCategory = categoryData.categories.find((c: RecipeCategory) => c.slug === slug)
        if (foundCategory) {
          setCategory(foundCategory)

          // Fetch subcategories
          const subcategoriesResponse = await fetch(`/api/recipe-subcategories?categoryId=${foundCategory.id}`)
          if (subcategoriesResponse.ok) {
            const subcategoriesData = await subcategoriesResponse.json()
            const foundSubcategory = subcategoriesData.subcategories.find((s: RecipeSubcategory) => s.slug === subcategorySlug)

            if (foundSubcategory) {
              setSubcategory(foundSubcategory)

              // Fetch recipes for this subcategory
              const recipesResponse = await fetch(`/api/recipes?categoryId=${foundCategory.id}`)
              if (recipesResponse.ok) {
                const recipesData = await recipesResponse.json()
                const filteredRecipes = recipesData.recipes.filter((r: Recipe) => r.subcategory?.id === foundSubcategory.id)
                setRecipes(filteredRecipes)
              }
            } else {
              toast.error('Subkategori hittades inte')
              router.push(`/dashboard/recipes/category/${slug}`)
            }
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

  if (!category || !subcategory) {
    return null
  }

  const Icon = getIconComponent(category.icon)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => router.push(`/dashboard/recipes/category/${slug}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-gold-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka till {category.name}</span>
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
              {subcategory.name}
            </h1>
          </div>

          <p className="text-gray-400 text-sm tracking-[1px]">
            {recipes.length} {recipes.length === 1 ? 'recept' : 'recept'}
          </p>

          <div className="h-[2px] bg-gradient-to-r from-transparent via-gold-primary to-transparent mt-6 opacity-20" />
        </div>
      </div>

      {/* Recipes Grid */}
      {recipes.length === 0 ? (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="text-center py-16">
            <ChefHat className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Inga recept i denna subkategori ännu
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <Card
              key={recipe.id}
              onClick={() => handleRecipeClick(recipe)}
              className="group relative bg-white/5 border-2 border-gold-primary/20 hover:border-gold-primary/60 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-[10px] overflow-hidden"
            >
              {/* Cover Image */}
              {recipe.coverImage && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={recipe.coverImage}
                    alt={recipe.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gold-light mb-2 group-hover:text-gold-primary transition-colors">
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
                    <span>{recipe.servings}</span>
                  </div>
                  {recipe.caloriesPerServing && (
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4" />
                      <span>{Math.round(recipe.caloriesPerServing)} kcal</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recipe Quick View Dialog (for coaches) */}
      {isCoach && selectedRecipe && (
        <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-dark-card border-2 border-gold-primary/20">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold text-gold-light">
                  {selectedRecipe.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/dashboard/content/recipes/${selectedRecipe.id}/edit`)}
                    className="border-gold-primary/30 hover:bg-gold-primary/10"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Redigera
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRecipe(null)}
                    className="hover:bg-gold-primary/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogDescription className="text-gray-400">
                {selectedRecipe.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedRecipe.coverImage && (
                <img
                  src={selectedRecipe.coverImage}
                  alt={selectedRecipe.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="flex items-center gap-6 text-sm text-gray-400">
                {(selectedRecipe.prepTimeMinutes || selectedRecipe.cookTimeMinutes) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{(selectedRecipe.prepTimeMinutes || 0) + (selectedRecipe.cookTimeMinutes || 0)} min</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{selectedRecipe.servings} portioner</span>
                </div>
                {selectedRecipe.caloriesPerServing && (
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4" />
                    <span>{Math.round(selectedRecipe.caloriesPerServing)} kcal</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => router.push(`/dashboard/recipes/${selectedRecipe.id}`)}
                className="w-full bg-gold-primary hover:bg-gold-secondary text-black font-semibold"
              >
                Visa fullständigt recept
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
