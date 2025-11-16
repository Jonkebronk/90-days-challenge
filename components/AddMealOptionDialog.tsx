'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ChefHat, UtensilsCrossed, Apple, Plus, Trash2, Search } from 'lucide-react'
import { RecipeSelectionDialog } from './RecipeSelectionDialog'
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
  category: {
    id: string
    name: string
  }
}

type FoodItem = {
  id: string
  name: string
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  commonServingSize: string | null
}

type SelectedFoodItem = {
  foodItemId: string
  name: string
  amountG: number
  protein: number
  fat: number
  carbs: number
  calories: number
}

type AddMealOptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  mealId: string
  onSuccess: () => void
}

export function AddMealOptionDialog({
  open,
  onOpenChange,
  templateId,
  mealId,
  onSuccess,
}: AddMealOptionDialogProps) {
  const [activeTab, setActiveTab] = useState('recipe')
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Recipe option state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [servingMultiplier, setServingMultiplier] = useState(1)
  const [recipeIsDefault, setRecipeIsDefault] = useState(false)
  const [recipeNotes, setRecipeNotes] = useState('')

  // Custom option state
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [customProtein, setCustomProtein] = useState('')
  const [customFat, setCustomFat] = useState('')
  const [customCarbs, setCustomCarbs] = useState('')
  const [customCalories, setCustomCalories] = useState('')
  const [customIsDefault, setCustomIsDefault] = useState(false)
  const [customNotes, setCustomNotes] = useState('')

  // Food items option state
  const [foodItemsName, setFoodItemsName] = useState('')
  const [selectedFoodItems, setSelectedFoodItems] = useState<SelectedFoodItem[]>([])
  const [foodItemSearch, setFoodItemSearch] = useState('')
  const [availableFoodItems, setAvailableFoodItems] = useState<FoodItem[]>([])
  const [isLoadingFoodItems, setIsLoadingFoodItems] = useState(false)
  const [foodItemsIsDefault, setFoodItemsIsDefault] = useState(false)
  const [foodItemsNotes, setFoodItemsNotes] = useState('')

  const handleRecipeSelect = (recipe: Recipe, multiplier: number) => {
    setSelectedRecipe(recipe)
    setServingMultiplier(multiplier)
    setIsRecipeDialogOpen(false)
  }

  const handleAddRecipeOption = async () => {
    if (!selectedRecipe) {
      toast.error('Välj ett recept')
      return
    }

    const calculatedProtein =
      (selectedRecipe.proteinPerServing || 0) * servingMultiplier
    const calculatedFat = (selectedRecipe.fatPerServing || 0) * servingMultiplier
    const calculatedCarbs = (selectedRecipe.carbsPerServing || 0) * servingMultiplier
    const calculatedCalories =
      (selectedRecipe.caloriesPerServing || 0) * servingMultiplier

    try {
      setIsSaving(true)
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${mealId}/options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionType: 'recipe',
            recipeId: selectedRecipe.id,
            servingMultiplier,
            calculatedProtein,
            calculatedFat,
            calculatedCarbs,
            calculatedCalories,
            isDefault: recipeIsDefault,
            notes: recipeNotes || null,
          }),
        }
      )

      if (response.ok) {
        toast.success('Receptalternativ tillagt')
        resetForm()
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till alternativ')
      }
    } catch (error) {
      console.error('Error adding recipe option:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddCustomOption = async () => {
    if (!customName) {
      toast.error('Namn krävs')
      return
    }

    if (!customProtein || !customFat || !customCarbs || !customCalories) {
      toast.error('Alla makron måste anges')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${mealId}/options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionType: 'custom',
            customName,
            customDescription: customDescription || null,
            customFoodItems: null, // For now, simplified
            calculatedProtein: parseFloat(customProtein),
            calculatedFat: parseFloat(customFat),
            calculatedCarbs: parseFloat(customCarbs),
            calculatedCalories: parseFloat(customCalories),
            isDefault: customIsDefault,
            notes: customNotes || null,
          }),
        }
      )

      if (response.ok) {
        toast.success('Anpassat alternativ tillagt')
        resetForm()
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till alternativ')
      }
    } catch (error) {
      console.error('Error adding custom option:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  // Fetch food items based on search
  useEffect(() => {
    const fetchFoodItems = async () => {
      if (!foodItemSearch || foodItemSearch.length < 2) {
        setAvailableFoodItems([])
        return
      }

      try {
        setIsLoadingFoodItems(true)
        const response = await fetch(`/api/food-items?search=${encodeURIComponent(foodItemSearch)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setAvailableFoodItems(data.items || [])
        }
      } catch (error) {
        console.error('Error fetching food items:', error)
      } finally {
        setIsLoadingFoodItems(false)
      }
    }

    const debounce = setTimeout(fetchFoodItems, 300)
    return () => clearTimeout(debounce)
  }, [foodItemSearch])

  const handleAddFoodItem = (foodItem: FoodItem, amountG: number) => {
    // Calculate macros based on amount (foodItem values are per 100g)
    const multiplier = amountG / 100
    const newItem: SelectedFoodItem = {
      foodItemId: foodItem.id,
      name: foodItem.name,
      amountG,
      protein: Number(foodItem.proteinG) * multiplier,
      fat: Number(foodItem.fatG) * multiplier,
      carbs: Number(foodItem.carbsG) * multiplier,
      calories: Number(foodItem.calories) * multiplier,
    }

    setSelectedFoodItems([...selectedFoodItems, newItem])
    setFoodItemSearch('')
    setAvailableFoodItems([])
  }

  const handleRemoveFoodItem = (index: number) => {
    setSelectedFoodItems(selectedFoodItems.filter((_, i) => i !== index))
  }

  const handleUpdateFoodItemAmount = (index: number, newAmountG: number) => {
    const updatedItems = [...selectedFoodItems]
    const item = updatedItems[index]

    // Recalculate macros based on original food item values
    const multiplier = newAmountG / 100

    // Find the original food item to get base values
    // For now, we'll scale proportionally from current values
    const currentMultiplier = item.amountG / 100
    const scaleFactor = newAmountG / item.amountG

    updatedItems[index] = {
      ...item,
      amountG: newAmountG,
      protein: item.protein * scaleFactor,
      fat: item.fat * scaleFactor,
      carbs: item.carbs * scaleFactor,
      calories: item.calories * scaleFactor,
    }

    setSelectedFoodItems(updatedItems)
  }

  const calculateTotalMacros = () => {
    return selectedFoodItems.reduce(
      (acc, item) => ({
        protein: acc.protein + item.protein,
        fat: acc.fat + item.fat,
        carbs: acc.carbs + item.carbs,
        calories: acc.calories + item.calories,
      }),
      { protein: 0, fat: 0, carbs: 0, calories: 0 }
    )
  }

  const handleAddFoodItemsOption = async () => {
    if (!foodItemsName) {
      toast.error('Namn krävs')
      return
    }

    if (selectedFoodItems.length === 0) {
      toast.error('Lägg till minst ett livsmedel')
      return
    }

    const totals = calculateTotalMacros()

    try {
      setIsSaving(true)
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${mealId}/options`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            optionType: 'ingredients',
            customName: foodItemsName,
            customDescription: null,
            customFoodItems: selectedFoodItems,
            calculatedProtein: totals.protein,
            calculatedFat: totals.fat,
            calculatedCarbs: totals.carbs,
            calculatedCalories: totals.calories,
            isDefault: foodItemsIsDefault,
            notes: foodItemsNotes || null,
          }),
        }
      )

      if (response.ok) {
        toast.success('Råvaror tillagda')
        resetForm()
        onSuccess()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till råvaror')
      }
    } catch (error) {
      console.error('Error adding food items option:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setActiveTab('recipe')
    setSelectedRecipe(null)
    setServingMultiplier(1)
    setRecipeIsDefault(false)
    setRecipeNotes('')
    setCustomName('')
    setCustomDescription('')
    setCustomProtein('')
    setCustomFat('')
    setCustomCarbs('')
    setCustomCalories('')
    setCustomIsDefault(false)
    setCustomNotes('')
    setFoodItemsName('')
    setSelectedFoodItems([])
    setFoodItemSearch('')
    setAvailableFoodItems([])
    setFoodItemsIsDefault(false)
    setFoodItemsNotes('')
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetForm()
          onOpenChange(isOpen)
        }}
      >
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Lägg till måltidsalternativ
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Välj ett recept eller skapa ett anpassat alternativ
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)]">
              <TabsTrigger
                value="recipe"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Recept
              </TabsTrigger>
              <TabsTrigger
                value="ingredients"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]"
              >
                <Apple className="h-4 w-4 mr-2" />
                Råvaror
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]"
              >
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Anpassat
              </TabsTrigger>
            </TabsList>

            {/* Recipe Tab */}
            <TabsContent value="recipe" className="space-y-4 mt-4">
              {selectedRecipe ? (
                <div className="p-4 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg">
                  <div className="flex items-center gap-4">
                    {selectedRecipe.coverImage ? (
                      <img
                        src={selectedRecipe.coverImage}
                        alt={selectedRecipe.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-[rgba(255,215,0,0.1)] rounded-lg flex items-center justify-center">
                        <ChefHat className="h-10 w-10 text-[rgba(255,215,0,0.5)]" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{selectedRecipe.title}</h3>
                      <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">
                        {Math.round(
                          (selectedRecipe.caloriesPerServing || 0) * servingMultiplier
                        )}{' '}
                        kcal • P:{' '}
                        {Math.round(
                          (selectedRecipe.proteinPerServing || 0) * servingMultiplier
                        )}
                        g • F:{' '}
                        {Math.round((selectedRecipe.fatPerServing || 0) * servingMultiplier)}
                        g • K:{' '}
                        {Math.round(
                          (selectedRecipe.carbsPerServing || 0) * servingMultiplier
                        )}
                        g
                      </p>
                      <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                        {servingMultiplier} portioner
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsRecipeDialogOpen(true)}
                      className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
                    >
                      Byt recept
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsRecipeDialogOpen(true)}
                  className="w-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                >
                  <ChefHat className="h-4 w-4 mr-2" />
                  Välj recept
                </Button>
              )}

              <div>
                <Label htmlFor="recipeNotes" className="text-[rgba(255,255,255,0.8)]">
                  Anteckningar (valfritt)
                </Label>
                <Textarea
                  id="recipeNotes"
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  placeholder="T.ex. 'Byt till laktosfri mjölk'"
                  rows={2}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recipeDefault"
                  checked={recipeIsDefault}
                  onCheckedChange={(checked) => setRecipeIsDefault(checked as boolean)}
                  className="border-[rgba(255,215,0,0.3)]"
                />
                <Label
                  htmlFor="recipeDefault"
                  className="text-sm text-[rgba(255,255,255,0.8)] cursor-pointer"
                >
                  Markera som standardalternativ
                </Label>
              </div>
            </TabsContent>

            {/* Ingredients Tab */}
            <TabsContent value="ingredients" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="ingredientsName" className="text-[rgba(255,255,255,0.8)]">
                  Namn *
                </Label>
                <Input
                  id="ingredientsName"
                  value={foodItemsName}
                  onChange={(e) => setFoodItemsName(e.target.value)}
                  placeholder="T.ex. 'Frukost råvaror'"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              {/* Food Item Search */}
              <div>
                <Label htmlFor="foodSearch" className="text-[rgba(255,255,255,0.8)]">
                  Sök livsmedel
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
                  <Input
                    id="foodSearch"
                    value={foodItemSearch}
                    onChange={(e) => setFoodItemSearch(e.target.value)}
                    placeholder="Sök efter livsmedel..."
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white pl-10"
                  />
                </div>

                {/* Search Results */}
                {availableFoodItems.length > 0 && (
                  <div className="mt-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg max-h-48 overflow-y-auto">
                    {availableFoodItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-[rgba(255,215,0,0.1)] border-b border-[rgba(255,215,0,0.1)] last:border-0 cursor-pointer"
                        onClick={() => {
                          const amount = prompt(`Ange mängd för ${item.name} (gram):`, '100')
                          if (amount && !isNaN(parseFloat(amount))) {
                            handleAddFoodItem(item, parseFloat(amount))
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-[rgba(255,255,255,0.5)]">
                              Per 100g: {Math.round(Number(item.calories))} kcal • P: {Number(item.proteinG).toFixed(1)}g • F: {Number(item.fatG).toFixed(1)}g • K: {Number(item.carbsG).toFixed(1)}g
                            </p>
                          </div>
                          <Plus className="h-4 w-4 text-[#FFD700]" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Food Items */}
              {selectedFoodItems.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[rgba(255,255,255,0.8)]">Valda livsmedel</Label>
                  {selectedFoodItems.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={item.amountG}
                              onChange={(e) => handleUpdateFoodItemAmount(index, parseFloat(e.target.value) || 0)}
                              className="w-20 h-8 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white text-xs"
                            />
                            <span className="text-xs text-[rgba(255,255,255,0.6)]">g</span>
                          </div>
                          <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                            {Math.round(item.calories)} kcal • P: {item.protein.toFixed(1)}g • F: {item.fat.toFixed(1)}g • K: {item.carbs.toFixed(1)}g
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFoodItem(index)}
                          className="hover:bg-[rgba(255,0,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Total Macros */}
                  <div className="p-3 bg-gradient-to-br from-[rgba(255,215,0,0.1)] to-[rgba(255,165,0,0.1)] border border-[rgba(255,215,0,0.3)] rounded-lg">
                    <p className="text-sm font-bold text-[#FFD700] mb-2">Totalt</p>
                    {(() => {
                      const totals = calculateTotalMacros()
                      return (
                        <p className="text-sm text-white">
                          {Math.round(totals.calories)} kcal • P: {totals.protein.toFixed(1)}g • F: {totals.fat.toFixed(1)}g • K: {totals.carbs.toFixed(1)}g
                        </p>
                      )
                    })()}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="ingredientsNotes" className="text-[rgba(255,255,255,0.8)]">
                  Anteckningar (valfritt)
                </Label>
                <Textarea
                  id="ingredientsNotes"
                  value={foodItemsNotes}
                  onChange={(e) => setFoodItemsNotes(e.target.value)}
                  placeholder="T.ex. 'Kan bytas mot laktosfria alternativ'"
                  rows={2}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ingredientsDefault"
                  checked={foodItemsIsDefault}
                  onCheckedChange={(checked) => setFoodItemsIsDefault(checked as boolean)}
                  className="border-[rgba(255,215,0,0.3)]"
                />
                <Label
                  htmlFor="ingredientsDefault"
                  className="text-sm text-[rgba(255,255,255,0.8)] cursor-pointer"
                >
                  Markera som standardalternativ
                </Label>
              </div>
            </TabsContent>

            {/* Custom Tab */}
            <TabsContent value="custom" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="customName" className="text-[rgba(255,255,255,0.8)]">
                  Namn *
                </Label>
                <Input
                  id="customName"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="T.ex. 'Proteinshake'"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div>
                <Label
                  htmlFor="customDescription"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Beskrivning (valfritt)
                </Label>
                <Textarea
                  id="customDescription"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="Beskrivning av måltiden..."
                  rows={2}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customCalories" className="text-[rgba(255,255,255,0.8)]">
                    Kalorier *
                  </Label>
                  <Input
                    id="customCalories"
                    type="number"
                    step="1"
                    value={customCalories}
                    onChange={(e) => setCustomCalories(e.target.value)}
                    placeholder="500"
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="customProtein" className="text-[rgba(255,255,255,0.8)]">
                    Protein (g) *
                  </Label>
                  <Input
                    id="customProtein"
                    type="number"
                    step="0.1"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(e.target.value)}
                    placeholder="30"
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="customFat" className="text-[rgba(255,255,255,0.8)]">
                    Fett (g) *
                  </Label>
                  <Input
                    id="customFat"
                    type="number"
                    step="0.1"
                    value={customFat}
                    onChange={(e) => setCustomFat(e.target.value)}
                    placeholder="10"
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="customCarbs" className="text-[rgba(255,255,255,0.8)]">
                    Kolhydrater (g) *
                  </Label>
                  <Input
                    id="customCarbs"
                    type="number"
                    step="0.1"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(e.target.value)}
                    placeholder="50"
                    className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customNotes" className="text-[rgba(255,255,255,0.8)]">
                  Anteckningar (valfritt)
                </Label>
                <Textarea
                  id="customNotes"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Ytterligare information..."
                  rows={2}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customDefault"
                  checked={customIsDefault}
                  onCheckedChange={(checked) => setCustomIsDefault(checked as boolean)}
                  className="border-[rgba(255,215,0,0.3)]"
                />
                <Label
                  htmlFor="customDefault"
                  className="text-sm text-[rgba(255,255,255,0.8)] cursor-pointer"
                >
                  Markera som standardalternativ
                </Label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={
                activeTab === 'recipe'
                  ? handleAddRecipeOption
                  : activeTab === 'ingredients'
                  ? handleAddFoodItemsOption
                  : handleAddCustomOption
              }
              disabled={
                isSaving ||
                (activeTab === 'recipe' && !selectedRecipe) ||
                (activeTab === 'ingredients' && selectedFoodItems.length === 0)
              }
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Lägger till...' : 'Lägg till alternativ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Selection Dialog */}
      <RecipeSelectionDialog
        open={isRecipeDialogOpen}
        onOpenChange={setIsRecipeDialogOpen}
        onSelect={handleRecipeSelect}
      />
    </>
  )
}
