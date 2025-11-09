'use client'

import { useState } from 'react'
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
import { ChefHat, UtensilsCrossed } from 'lucide-react'
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
            <TabsList className="grid w-full grid-cols-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.3)]">
              <TabsTrigger
                value="recipe"
                className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]"
              >
                <ChefHat className="h-4 w-4 mr-2" />
                Recept
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
              onClick={activeTab === 'recipe' ? handleAddRecipeOption : handleAddCustomOption}
              disabled={isSaving || (activeTab === 'recipe' && !selectedRecipe)}
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
