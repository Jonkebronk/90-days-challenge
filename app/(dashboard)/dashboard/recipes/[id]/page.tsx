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
  Clock,
  Users,
  Heart,
  Flame,
  Plus,
  Minus,
  ChefHat,
  Play,
  Printer,
  Download
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
  const [servings, setServings] = useState(1)
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
        setServings(data.recipe.servings)
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

  const scaleIngredient = (amount: number) => {
    if (!recipe) return amount
    return (amount * servings) / recipe.servings
  }

  const scaleNutrition = (value?: number | null) => {
    if (!recipe || !value) return 0
    return (value * servings) / recipe.servings
  }

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

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-[#0a0a0a]">
        <Card className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)]">
          <CardContent className="p-6">
            <p className="text-[rgba(255,255,255,0.6)]">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-[#0a0a0a]">
        <p className="text-[rgba(255,255,255,0.6)]">Laddar...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="container mx-auto p-6 min-h-screen bg-[#0a0a0a]">
        <Card className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)]">
          <CardContent className="p-6">
            <p className="text-[rgba(255,255,255,0.6)]">Recept hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[rgba(10,10,10,0.95)] border-b border-[rgba(255,215,0,0.3)] sticky top-0 z-10 no-print backdrop-blur-[10px]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/recipes')}
              className="text-white hover:bg-[rgba(255,215,0,0.1)]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-white hover:bg-[rgba(255,215,0,0.1)]"
              >
                <Printer className="h-4 w-4 mr-2" />
                Skriv ut
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrint}
                className="text-white hover:bg-[rgba(255,215,0,0.1)]"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className="text-white hover:bg-[rgba(255,215,0,0.1)]"
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorited() ? 'fill-red-500 text-red-500' : ''}`} />
                Favorit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-3xl" ref={printRef}>
        {/* Cover Image */}
        {recipe.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={recipe.coverImage}
              alt={recipe.title}
              className="w-full h-64 object-cover"
            />
          </div>
        )}

        {/* Recipe Title */}
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">{recipe.title}</h1>
        <p className="text-base text-[rgba(255,255,255,0.6)] mb-8">{servings} {servings === 1 ? 'portion' : 'portioner'}</p>

        {/* Ingredients Section */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">Ingredienser</h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient) => (
              <li key={ingredient.id} className="text-base text-white">
                {ingredient.displayAmount && ingredient.displayUnit
                  ? `${ingredient.displayAmount} ${ingredient.displayUnit}`
                  : `${Math.round(scaleIngredient(ingredient.amount))} g`}{' '}
                {ingredient.foodItem.name}
                {ingredient.notes && `, ${ingredient.notes}`}
                {ingredient.optional && ' (valfri)'}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions Section */}
        {recipe.instructions.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">Tillagningsinstruktioner</h2>
            {recipe.description && (
              <p className="text-sm text-[rgba(255,255,255,0.6)] mb-4 italic">({recipe.description})</p>
            )}
            <ol className="space-y-3 list-decimal list-inside">
              {recipe.instructions.map((instruction) => (
                <li key={instruction.id} className="text-base text-white">
                  {instruction.instruction}
                  {instruction.duration && ` (${instruction.duration} min)`}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Recipe Credit */}
        {recipe.category && (
          <p className="text-sm italic text-[rgba(255,255,255,0.4)] mb-8">
            Recept: {recipe.category.name}
          </p>
        )}

        {/* Nutrition Section */}
        {recipe.caloriesPerServing && (() => {
          // Calculate total recipe weight from ingredients
          const totalWeight = recipe.ingredients.reduce((sum, ing) => sum + ing.amount, 0)
          const totalCalories = recipe.caloriesPerServing * recipe.servings
          const totalProtein = (recipe.proteinPerServing || 0) * recipe.servings
          const totalFat = (recipe.fatPerServing || 0) * recipe.servings
          const totalCarbs = (recipe.carbsPerServing || 0) * recipe.servings

          return (
            <div className="border-t border-[rgba(255,215,0,0.3)] pt-8">
              <div className="grid grid-cols-2 gap-8">
                {/* Per 100g */}
                <div>
                  <h3 className="font-bold text-sm uppercase mb-4 text-[#FFD700]">NÄRING PER 100 G</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-white">{Math.round((totalCalories * 100) / totalWeight)} kcal</span>
                    </div>
                    {recipe.proteinPerServing && (
                      <div>
                        <span className="text-white">{((totalProtein * 100) / totalWeight).toFixed(1)} g protein</span>
                      </div>
                    )}
                    {recipe.fatPerServing && (
                      <div>
                        <span className="text-white">{((totalFat * 100) / totalWeight).toFixed(1)} g fett</span>
                      </div>
                    )}
                    {recipe.carbsPerServing && (
                      <div>
                        <span className="text-white">{((totalCarbs * 100) / totalWeight).toFixed(1)} g kolh.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per Portion */}
                <div>
                  <h3 className="font-bold text-sm uppercase mb-4 text-[#FFD700]">NÄRING PER PORTION</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-white">{Math.round(scaleNutrition(recipe.caloriesPerServing))} kcal</span>
                    </div>
                    {recipe.proteinPerServing && (
                      <div>
                        <span className="text-white">{scaleNutrition(recipe.proteinPerServing).toFixed(1)} g protein</span>
                      </div>
                    )}
                    {recipe.fatPerServing && (
                      <div>
                        <span className="text-white">{scaleNutrition(recipe.fatPerServing).toFixed(1)} g fett</span>
                      </div>
                    )}
                    {recipe.carbsPerServing && (
                      <div>
                        <span className="text-white">{scaleNutrition(recipe.carbsPerServing).toFixed(1)} g kolh.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Portion Adjuster - Floating */}
        <div className="no-print fixed bottom-8 right-8 bg-[rgba(10,10,10,0.95)] shadow-lg rounded-lg border-2 border-[rgba(255,215,0,0.3)] p-4 backdrop-blur-[10px]">
          <p className="text-sm font-medium mb-2 text-[#FFD700]">Antal portioner</p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
              className="border-[rgba(255,215,0,0.3)] text-white hover:bg-[rgba(255,215,0,0.1)]"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-xl font-bold w-8 text-center text-white">{servings}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setServings(servings + 1)}
              className="border-[rgba(255,215,0,0.3)] text-white hover:bg-[rgba(255,215,0,0.1)]"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
