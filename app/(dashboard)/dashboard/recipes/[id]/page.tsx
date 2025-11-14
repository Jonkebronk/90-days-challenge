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
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Recept hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 no-print">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/recipes')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till recept
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Skriv ut
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Download className="h-4 w-4 mr-2" />
                Spara som PDF
              </Button>
              <Button
                variant={isFavorited() ? 'default' : 'outline'}
                onClick={handleToggleFavorite}
              >
                <Heart className={`h-4 w-4 mr-2 ${isFavorited() ? 'fill-current' : ''}`} />
                {isFavorited() ? 'Favorit' : 'Lägg till favorit'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8" ref={printRef}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Recipe Header */}
          <div>
            {recipe.coverImage && (
              <div className="mb-6 rounded-lg overflow-hidden h-96">
                <img
                  src={recipe.coverImage}
                  alt={recipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{recipe.category.name}</Badge>
              {recipe.mealType && (
                <Badge variant="outline">{getMealTypeLabel(recipe.mealType)}</Badge>
              )}
              {recipe.difficulty && (
                <Badge variant="outline">{getDifficultyLabel(recipe.difficulty)}</Badge>
              )}
              {recipe.cuisineType && (
                <Badge variant="outline">{recipe.cuisineType}</Badge>
              )}
              {recipe.dietaryTags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-4xl font-bold mb-4">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground mb-6">{recipe.description}</p>
            )}
            <div className="flex flex-wrap gap-6 text-sm">
              {totalTime > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{totalTime} minuter</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span>{recipe.servings} portioner</span>
              </div>
              {recipe.caloriesPerServing && (
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-muted-foreground" />
                  <span>{Math.round(recipe.caloriesPerServing)} kcal/portion</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Ingredients */}
            <div className="lg:col-span-1 space-y-6">
              {/* Servings Adjuster */}
              <Card>
                <CardHeader>
                  <CardTitle>Portioner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServings(Math.max(1, servings - 1))}
                      disabled={servings <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold">{servings}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setServings(servings + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Nutrition Info */}
              {recipe.caloriesPerServing && (
                <Card>
                  <CardHeader>
                    <CardTitle>Näringsvärde per portion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Kalorier</span>
                      <span className="font-semibold">
                        {Math.round(scaleNutrition(recipe.caloriesPerServing))} kcal
                      </span>
                    </div>
                    {recipe.proteinPerServing && (
                      <div className="flex justify-between">
                        <span>Protein</span>
                        <span className="font-semibold">
                          {scaleNutrition(recipe.proteinPerServing).toFixed(1)} g
                        </span>
                      </div>
                    )}
                    {recipe.carbsPerServing && (
                      <div className="flex justify-between">
                        <span>Kolhydrater</span>
                        <span className="font-semibold">
                          {scaleNutrition(recipe.carbsPerServing).toFixed(1)} g
                        </span>
                      </div>
                    )}
                    {recipe.fatPerServing && (
                      <div className="flex justify-between">
                        <span>Fett</span>
                        <span className="font-semibold">
                          {scaleNutrition(recipe.fatPerServing).toFixed(1)} g
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Ingredients */}
              <Card>
                <CardHeader>
                  <CardTitle>Ingredienser</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recipe.ingredients.map((ingredient) => (
                      <li key={ingredient.id} className="flex justify-between items-start">
                        <span className="flex-1">
                          {ingredient.foodItem.name}
                          {ingredient.notes && (
                            <span className="text-sm text-muted-foreground"> ({ingredient.notes})</span>
                          )}
                          {ingredient.optional && (
                            <Badge variant="outline" className="ml-2 text-xs">Valfri</Badge>
                          )}
                        </span>
                        <span className="font-semibold ml-4">
                          {ingredient.displayAmount && ingredient.displayUnit
                            ? `${ingredient.displayAmount} ${ingredient.displayUnit}`
                            : `${Math.round(scaleIngredient(ingredient.amount))} g`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Video */}
              {recipe.videoUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle>Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(recipe.videoUrl!, '_blank')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Se instruktionsvideo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Instructions */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Instruktioner</CardTitle>
                </CardHeader>
                <CardContent>
                  {recipe.instructions.length === 0 ? (
                    <p className="text-muted-foreground">Inga instruktioner ännu.</p>
                  ) : (
                    <ol className="space-y-6">
                      {recipe.instructions.map((instruction) => (
                        <li key={instruction.id} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                              {instruction.stepNumber}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-base">{instruction.instruction}</p>
                            {instruction.duration && (
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {instruction.duration} minuter
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Hide elements that shouldn't be printed */
          .no-print {
            display: none !important;
          }

          /* Reset page styles */
          body {
            background: white !important;
          }

          /* Optimize layout for printing */
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }

          /* Ensure images fit */
          img {
            max-height: 300px !important;
            page-break-inside: avoid;
          }

          /* Improve readability */
          .text-muted-foreground {
            color: #666 !important;
          }

          /* Ensure cards don't have backgrounds */
          .bg-white,
          .bg-gray-50 {
            background: white !important;
          }

          /* Remove shadows and borders for cleaner print */
          .shadow,
          .shadow-lg,
          .shadow-md {
            box-shadow: none !important;
          }

          /* Ensure proper page breaks */
          .space-y-6 > * {
            page-break-inside: avoid;
          }

          /* Make sure ingredient and instruction lists are readable */
          ul,
          ol {
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
