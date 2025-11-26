'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useReactToPrint } from 'react-to-print'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Heart,
  Printer,
} from 'lucide-react'
import { toast } from 'sonner'

type FoodItem = {
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
}

type Ingredient = {
  id: string
  amount: number
  displayUnit?: string | null
  displayAmount?: string | null
  optional: boolean
  notes?: string | null
  foodItem: FoodItem
}

type Instruction = {
  id: string
  stepNumber: number
  instruction: string
  duration?: number | null
}

type Recipe = {
  id: string
  title: string
  description?: string | null
  servings: number
  prepTimeMinutes?: number | null
  cookTimeMinutes?: number | null
  difficulty?: string | null
  mealType?: string | null
  cuisineType?: string | null
  coverImage?: string | null
  videoUrl?: string | null
  dietaryTags: string[]
  caloriesPerServing?: number | null
  proteinPerServing?: number | null
  carbsPerServing?: number | null
  fatPerServing?: number | null
  category: {
    name: string
  }
  ingredients: Ingredient[]
  instructions: Instruction[]
  favorites: any[]
}

export default function RecipeDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: recipe?.title || 'Recept',
  })

  useEffect(() => {
    if (session?.user) {
      fetchRecipe()
    }
  }, [session, recipeId])

  const fetchRecipe = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/recipes/${recipeId}`)
      if (response.ok) {
        const data = await response.json()
        setRecipe(data.recipe)
      } else {
        toast.error('Kunde inte hämta recept')
        router.push('/dashboard/recipes')
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchRecipe()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const isFavorited = () => {
    return recipe?.favorites && recipe.favorites.length > 0
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gray-900">
        <Card className="bg-gray-900/95 border-2 border-gold-primary/30">
          <CardContent className="p-6">
            <p className="text-gray-400">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gray-900">
        <p className="text-gray-400">Laddar...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-gray-900">
        <Card className="bg-gray-900/95 border-2 border-gold-primary/30">
          <CardContent className="p-6">
            <p className="text-gray-400">Recept hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-900/95 border-b border-gold-primary/30 sticky top-0 z-10 no-print backdrop-blur-[10px]">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white hover:bg-gold-50 px-2 sm:px-4"
            >
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tillbaka</span>
            </Button>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-white hover:bg-gold-50 px-2 sm:px-4"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Skriv ut</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className="text-white hover:bg-gold-50 px-2 sm:px-4"
              >
                <Heart className={`h-4 w-4 sm:mr-2 ${isFavorited() ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="hidden sm:inline">Favorit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12 max-w-3xl" ref={printRef}>
        {/* Cover Image */}
        {recipe.coverImage && (
          <div className="mb-4 sm:mb-8 rounded-lg overflow-hidden">
            <img
              src={recipe.coverImage}
              alt={recipe.title}
              className="w-full h-40 sm:h-64 object-cover"
            />
          </div>
        )}

        {/* Recipe Title */}
        <h1 className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2 bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">{recipe.title}</h1>
        <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-8">{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</p>

        {/* Ingredients Section */}
        <div className="mb-6 sm:mb-10">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">Ingredienser</h2>
          <ul className="space-y-1.5 sm:space-y-2">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="text-sm sm:text-base text-white">
                {ingredient.displayAmount && ingredient.displayUnit
                  ? `${ingredient.displayAmount} ${ingredient.displayUnit}`
                  : `${Math.round(ingredient.amount)} g`}{' '}
                {ingredient.foodItem.name}
                {ingredient.notes && `, ${ingredient.notes}`}
                {ingredient.optional && ' (valfri)'}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions Section */}
        {recipe.instructions.length > 0 && (
          <div className="mb-6 sm:mb-10">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">Tillagningsinstruktioner</h2>
            {recipe.description && (
              <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 italic">({recipe.description})</p>
            )}
            <ol className="space-y-2 sm:space-y-3 list-decimal list-inside">
              {recipe.instructions.map((instruction) => (
                <li key={instruction.id} className="text-sm sm:text-base text-white">
                  {instruction.instruction}
                  {instruction.duration && ` (${instruction.duration} min)`}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Recipe Credit */}
        {recipe.category && (
          <p className="text-xs sm:text-sm italic text-[rgba(255,255,255,0.4)] mb-6 sm:mb-8">
            Recept: {recipe.category.name}
          </p>
        )}

        {/* Nutrition Section */}
        {recipe.caloriesPerServing && (() => {
          // Calculate total recipe weight from ingredients
          const totalWeight = recipe.ingredients.reduce((sum, ing) => sum + ing.amount, 0)
          const totalCalories = Number(recipe.caloriesPerServing) * recipe.servings
          const totalProtein = Number(recipe.proteinPerServing || 0) * recipe.servings
          const totalFat = Number(recipe.fatPerServing || 0) * recipe.servings
          const totalCarbs = Number(recipe.carbsPerServing || 0) * recipe.servings

          return (
            <div className="border-t border-gold-primary/30 pt-6 sm:pt-8">
              <div className="grid grid-cols-2 gap-4 sm:gap-8">
                {/* Per 100g */}
                <div>
                  <h3 className="font-bold text-xs sm:text-sm uppercase mb-2 sm:mb-4 text-gold-light">PER 100 G</h3>
                  <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                    <div>
                      <span className="text-white">{Math.round((totalCalories * 100) / totalWeight)} kcal</span>
                    </div>
                    {totalProtein > 0 && (
                      <div>
                        <span className="text-white">{((totalProtein * 100) / totalWeight).toFixed(1)}g protein</span>
                      </div>
                    )}
                    {totalFat > 0 && (
                      <div>
                        <span className="text-white">{((totalFat * 100) / totalWeight).toFixed(1)}g fett</span>
                      </div>
                    )}
                    {totalCarbs > 0 && (
                      <div>
                        <span className="text-white">{((totalCarbs * 100) / totalWeight).toFixed(1)}g kolh.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per Portion */}
                <div>
                  <h3 className="font-bold text-xs sm:text-sm uppercase mb-2 sm:mb-4 text-gold-light">PER PORTION</h3>
                  <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm">
                    <div>
                      <span className="text-white">{Math.round(recipe.caloriesPerServing)} kcal</span>
                    </div>
                    {recipe.proteinPerServing != null && (
                      <div>
                        <span className="text-white">{Number(recipe.proteinPerServing).toFixed(1)}g protein</span>
                      </div>
                    )}
                    {recipe.fatPerServing != null && (
                      <div>
                        <span className="text-white">{Number(recipe.fatPerServing).toFixed(1)}g fett</span>
                      </div>
                    )}
                    {recipe.carbsPerServing != null && (
                      <div>
                        <span className="text-white">{Number(recipe.carbsPerServing).toFixed(1)}g kolh.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          h1, h2, h3 {
            page-break-after: avoid;
          }

          ul, ol {
            page-break-inside: avoid;
          }

          li {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
