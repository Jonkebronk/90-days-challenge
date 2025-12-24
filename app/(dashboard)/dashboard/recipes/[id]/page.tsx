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
  ShoppingCart,
  Check,
  Plus,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

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

type ShoppingList = {
  id: string
  name: string
  color: string
}

export default function RecipeDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const recipeId = params.id as string

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  // Shopping list modal state
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false)
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isAddingToList, setIsAddingToList] = useState(false)
  const [showNewListInput, setShowNewListInput] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)

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

  // Fetch shopping lists
  const fetchShoppingLists = async () => {
    try {
      const res = await fetch('/api/shopping-lists')
      if (res.ok) {
        const data = await res.json()
        const lists = (data.ownLists || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        }))
        setShoppingLists(lists)
        // Auto-select first list if available
        if (lists.length > 0 && !selectedListId) {
          setSelectedListId(lists[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error)
    }
  }

  // Open shopping modal
  const handleOpenShoppingModal = () => {
    if (!recipe) return
    // Pre-select all non-optional ingredients
    const preSelected = new Set<string>()
    recipe.ingredients.forEach(ing => {
      if (!ing.optional) {
        preSelected.add(ing.id)
      }
    })
    setSelectedIngredients(preSelected)
    fetchShoppingLists()
    setIsShoppingModalOpen(true)
  }

  // Toggle ingredient selection
  const toggleIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => {
      const next = new Set(prev)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      return next
    })
  }

  // Select/deselect all
  const selectAllIngredients = () => {
    if (!recipe) return
    const allIds = new Set(recipe.ingredients.map(ing => ing.id))
    setSelectedIngredients(allIds)
  }

  const deselectAllIngredients = () => {
    setSelectedIngredients(new Set())
  }

  // Create new list
  const handleCreateNewList = async () => {
    if (!newListName.trim()) {
      toast.error('Ange ett namn för listan')
      return
    }

    setIsCreatingList(true)
    try {
      const res = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName,
          color: '#10B981', // Green color for recipe lists
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newList = {
          id: data.list.id,
          name: data.list.name,
          color: data.list.color,
        }
        setShoppingLists(prev => [newList, ...prev])
        setSelectedListId(newList.id)
        setShowNewListInput(false)
        setNewListName('')
        toast.success('Lista skapad!')
      } else {
        toast.error('Kunde inte skapa lista')
      }
    } catch (error) {
      toast.error('Ett fel uppstod')
    } finally {
      setIsCreatingList(false)
    }
  }

  // Add selected ingredients to shopping list
  const handleAddToShoppingList = async () => {
    if (!recipe || !selectedListId || selectedIngredients.size === 0) return

    setIsAddingToList(true)
    try {
      const ingredientsToAdd = recipe.ingredients.filter(ing =>
        selectedIngredients.has(ing.id)
      )

      // Add all ingredients as a bulk operation with recipeId
      const items = ingredientsToAdd.map(ing => ({
        customName: `${ing.displayAmount && ing.displayUnit
          ? `${ing.displayAmount} ${ing.displayUnit}`
          : `${Math.round(ing.amount)} g`} ${ing.foodItem.name}`,
        quantity: 1,
        unit: 'st',
        category: 'Recept',
        notes: ing.notes || undefined,
      }))

      const res = await fetch(`/api/shopping-lists/${selectedListId}/items/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, recipeId: recipe.id }),
      })

      if (res.ok) {
        const listName = shoppingLists.find(l => l.id === selectedListId)?.name
        toast.success(`${items.length} ingredienser tillagda i "${listName}"`)
        setIsShoppingModalOpen(false)
      } else {
        toast.error('Kunde inte lägga till ingredienser')
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsAddingToList(false)
    }
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
                onClick={handleOpenShoppingModal}
                className="text-white hover:bg-gold-50 px-2 sm:px-4"
              >
                <ShoppingCart className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Handla</span>
              </Button>
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

      {/* Shopping List Modal */}
      <Dialog open={isShoppingModalOpen} onOpenChange={setIsShoppingModalOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.98)] border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gold-primary" />
              Handla ingredienser
            </DialogTitle>
          </DialogHeader>

          {recipe && (
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Recipe info */}
              <div className="bg-gold-primary/10 rounded-lg p-3 mb-4">
                <p className="text-sm text-white font-medium">{recipe.title}</p>
                <p className="text-xs text-gray-400">{recipe.servings} portioner • {recipe.ingredients.length} ingredienser</p>
              </div>

              {/* Select/Deselect all */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">
                  {selectedIngredients.size} av {recipe.ingredients.length} valda
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllIngredients}
                    className="text-xs text-gold-primary hover:underline"
                  >
                    Välj alla
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={deselectAllIngredients}
                    className="text-xs text-gray-400 hover:underline"
                  >
                    Avmarkera
                  </button>
                </div>
              </div>

              {/* Ingredients list */}
              <div className="flex-1 overflow-auto space-y-1 mb-4 pr-1">
                {recipe.ingredients.map(ing => {
                  const isSelected = selectedIngredients.has(ing.id)
                  const displayText = ing.displayAmount && ing.displayUnit
                    ? `${ing.displayAmount} ${ing.displayUnit} ${ing.foodItem.name}`
                    : `${Math.round(ing.amount)} g ${ing.foodItem.name}`

                  return (
                    <button
                      key={ing.id}
                      onClick={() => toggleIngredient(ing.id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                        isSelected
                          ? 'bg-green-500/20 border border-green-500/50'
                          : 'bg-white/5 border border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-green-500' : 'border-2 border-gray-500'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm flex-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {displayText}
                        {ing.optional && <span className="text-gray-500 ml-1">(valfri)</span>}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Shopping list selector */}
              <div className="border-t border-gold-primary/20 pt-4">
                <p className="text-sm text-gray-300 mb-2">Välj inköpslista:</p>

                {showNewListInput ? (
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="Namn på ny lista..."
                      className="bg-black/30 border-gold-primary/30 text-white text-sm"
                      autoFocus
                    />
                    <Button
                      onClick={handleCreateNewList}
                      disabled={isCreatingList}
                      size="sm"
                      className="bg-gold-primary text-black hover:bg-gold-secondary"
                    >
                      {isCreatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Skapa'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowNewListInput(false)
                        setNewListName('')
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400"
                    >
                      Avbryt
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-auto mb-3">
                    {shoppingLists.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-2">Inga listor ännu</p>
                    ) : (
                      shoppingLists.map(list => (
                        <button
                          key={list.id}
                          onClick={() => setSelectedListId(list.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all ${
                            selectedListId === list.id
                              ? 'bg-gold-primary/20 border border-gold-primary/50'
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <span className="text-sm text-white truncate">{list.name}</span>
                          {selectedListId === list.id && (
                            <Check className="h-4 w-4 text-gold-primary ml-auto" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {!showNewListInput && (
                  <button
                    onClick={() => setShowNewListInput(true)}
                    className="flex items-center gap-2 text-sm text-gold-primary hover:underline mb-4"
                  >
                    <Plus className="h-4 w-4" />
                    Skapa ny lista
                  </button>
                )}

                {/* Add button */}
                <Button
                  onClick={handleAddToShoppingList}
                  disabled={isAddingToList || selectedIngredients.size === 0 || !selectedListId}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3"
                >
                  {isAddingToList ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Lägger till...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Lägg till {selectedIngredients.size} ingredienser
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
