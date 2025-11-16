'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Save,
  ArrowLeft,
  Trash2,
  UtensilsCrossed,
  ChefHat,
  Users,
  Pencil,
  Apple,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { AddMealOptionDialog } from '@/components/AddMealOptionDialog'
import { AssignTemplateDialog } from '@/components/AssignTemplateDialog'

type TemplateMealOption = {
  id: string
  optionType: string
  recipeId: string | null
  servingMultiplier: number | null
  customName: string | null
  customDescription: string | null
  customFoodItems: any
  calculatedProtein: number
  calculatedFat: number
  calculatedCarbs: number
  calculatedCalories: number
  isDefault: boolean
  orderIndex: number
  notes: string | null
  recipe?: {
    id: string
    title: string
    coverImage: string | null
    caloriesPerServing: number | null
    proteinPerServing: number | null
    carbsPerServing: number | null
    fatPerServing: number | null
  }
}

type TemplateMealItem = {
  id: string
  name: string
  amount: string
  protein: number
  fat: number
  carbs: number
  calories: number
  orderIndex: number
}

type TemplateMeal = {
  id: string
  name: string
  mealType: string
  description: string | null
  targetProtein: number | null
  targetFat: number | null
  targetCarbs: number | null
  targetCalories: number | null
  orderIndex: number
  items: TemplateMealItem[]
  options: TemplateMealOption[]
}

type Assignment = {
  id: string
  userId: string
  active: boolean
  user: {
    id: string
    name: string | null
    email: string
  }
}

type MealPlanTemplate = {
  id: string
  name: string
  description: string | null
  generalAdvice: string | null
  targetProtein: number | null
  targetFat: number | null
  targetCarbs: number | null
  targetCalories: number | null
  published: boolean
  tags: string[]
  meals: TemplateMeal[]
  assignments?: Assignment[]
}

export default function MealPlanTemplatePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<MealPlanTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddMealDialogOpen, setIsAddMealDialogOpen] = useState(false)
  const [isEditMealDialogOpen, setIsEditMealDialogOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<TemplateMeal | null>(null)
  const [isAddOptionDialogOpen, setIsAddOptionDialogOpen] = useState(false)
  const [selectedMealForOption, setSelectedMealForOption] = useState<string | null>(null)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    generalAdvice: '',
    targetProtein: '',
    targetFat: '',
    targetCarbs: '',
    targetCalories: '',
  })

  const [mealFormData, setMealFormData] = useState({
    name: '',
    mealType: 'breakfast',
    description: '',
    targetProtein: '',
    targetFat: '',
    targetCarbs: '',
    targetCalories: '',
  })

  const [isAddIngredientDialogOpen, setIsAddIngredientDialogOpen] = useState(false)
  const [selectedMealForIngredient, setSelectedMealForIngredient] = useState<string | null>(null)
  const [ingredientFormData, setIngredientFormData] = useState({
    name: '',
    amount: '',
    protein: '',
    fat: '',
    carbs: '',
    calories: '',
  })

  useEffect(() => {
    if (session?.user && templateId) {
      fetchTemplate()
    }
  }, [session, templateId])

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        generalAdvice: template.generalAdvice || '',
        targetProtein: template.targetProtein?.toString() || '',
        targetFat: template.targetFat?.toString() || '',
        targetCarbs: template.targetCarbs?.toString() || '',
        targetCalories: template.targetCalories?.toString() || '',
      })
    }
  }, [template])

  const fetchTemplate = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/meal-plan-templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data.template)
      } else {
        toast.error('Kunde inte hämta måltidsplan')
        router.push('/dashboard/content/meal-plans')
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!formData.name) {
      toast.error('Namn krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/meal-plan-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          generalAdvice: formData.generalAdvice || null,
          targetProtein: formData.targetProtein ? parseFloat(formData.targetProtein) : null,
          targetFat: formData.targetFat ? parseFloat(formData.targetFat) : null,
          targetCarbs: formData.targetCarbs ? parseFloat(formData.targetCarbs) : null,
          targetCalories: formData.targetCalories
            ? parseFloat(formData.targetCalories)
            : null,
        }),
      })

      if (response.ok) {
        toast.success('Måltidsplan uppdaterad')
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte uppdatera måltidsplan')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMeal = async () => {
    if (!mealFormData.name) {
      toast.error('Måltidsnamn krävs')
      return
    }

    try {
      const response = await fetch(`/api/meal-plan-templates/${templateId}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: mealFormData.name,
          mealType: mealFormData.mealType,
          description: mealFormData.description || null,
          targetProtein: mealFormData.targetProtein
            ? parseFloat(mealFormData.targetProtein)
            : null,
          targetFat: mealFormData.targetFat
            ? parseFloat(mealFormData.targetFat)
            : null,
          targetCarbs: mealFormData.targetCarbs
            ? parseFloat(mealFormData.targetCarbs)
            : null,
          targetCalories: mealFormData.targetCalories
            ? parseFloat(mealFormData.targetCalories)
            : null,
        }),
      })

      if (response.ok) {
        toast.success('Måltid tillagd')
        setIsAddMealDialogOpen(false)
        setMealFormData({
          name: '',
          mealType: 'breakfast',
          description: '',
          targetProtein: '',
          targetFat: '',
          targetCarbs: '',
          targetCalories: '',
        })
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till måltid')
      }
    } catch (error) {
      console.error('Error adding meal:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleEditMeal = async () => {
    if (!mealFormData.name || !editingMeal) {
      toast.error('Måltidsnamn krävs')
      return
    }

    try {
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${editingMeal.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: mealFormData.name,
            mealType: mealFormData.mealType,
            description: mealFormData.description || null,
            targetProtein: mealFormData.targetProtein
              ? parseFloat(mealFormData.targetProtein)
              : null,
            targetFat: mealFormData.targetFat
              ? parseFloat(mealFormData.targetFat)
              : null,
            targetCarbs: mealFormData.targetCarbs
              ? parseFloat(mealFormData.targetCarbs)
              : null,
            targetCalories: mealFormData.targetCalories
              ? parseFloat(mealFormData.targetCalories)
              : null,
          }),
        }
      )

      if (response.ok) {
        toast.success('Måltid uppdaterad')
        setIsEditMealDialogOpen(false)
        setEditingMeal(null)
        setMealFormData({
          name: '',
          mealType: 'breakfast',
          description: '',
          targetProtein: '',
          targetFat: '',
          targetCarbs: '',
          targetCalories: '',
        })
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte uppdatera måltid')
      }
    } catch (error) {
      console.error('Error updating meal:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const openEditMealDialog = (meal: TemplateMeal) => {
    setEditingMeal(meal)
    setMealFormData({
      name: meal.name,
      mealType: meal.mealType,
      description: meal.description || '',
      targetProtein: meal.targetProtein?.toString() || '',
      targetFat: meal.targetFat?.toString() || '',
      targetCarbs: meal.targetCarbs?.toString() || '',
      targetCalories: meal.targetCalories?.toString() || '',
    })
    setIsEditMealDialogOpen(true)
  }

  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    if (!confirm(`Är du säker på att du vill radera "${mealName}"?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${mealId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Måltid raderad')
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera måltid')
      }
    } catch (error) {
      console.error('Error deleting meal:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleReorderMeal = async (mealId: string, direction: 'up' | 'down') => {
    if (!template) return

    const sortedMeals = [...template.meals].sort((a, b) => a.orderIndex - b.orderIndex)
    const currentIndex = sortedMeals.findIndex((m) => m.id === mealId)

    if (currentIndex === -1) return
    if (direction === 'up' && currentIndex === 0) return
    if (direction === 'down' && currentIndex === sortedMeals.length - 1) return

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const currentMeal = sortedMeals[currentIndex]
    const swapMeal = sortedMeals[swapIndex]

    // Swap orderIndex values
    const tempOrderIndex = currentMeal.orderIndex
    currentMeal.orderIndex = swapMeal.orderIndex
    swapMeal.orderIndex = tempOrderIndex

    try {
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/reorder`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            meals: sortedMeals.map((m) => ({
              id: m.id,
              orderIndex: m.orderIndex,
            })),
          }),
        }
      )

      if (response.ok) {
        toast.success('Måltidsordning uppdaterad')
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ändra ordning')
      }
    } catch (error) {
      console.error('Error reordering meal:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleAddIngredient = async () => {
    if (!ingredientFormData.name || !ingredientFormData.amount) {
      toast.error('Råvara och mängd krävs')
      return
    }

    if (!selectedMealForIngredient) return

    try {
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${selectedMealForIngredient}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: ingredientFormData.name,
            amount: ingredientFormData.amount,
            protein: ingredientFormData.protein ? parseFloat(ingredientFormData.protein) : 0,
            fat: ingredientFormData.fat ? parseFloat(ingredientFormData.fat) : 0,
            carbs: ingredientFormData.carbs ? parseFloat(ingredientFormData.carbs) : 0,
            calories: ingredientFormData.calories ? parseFloat(ingredientFormData.calories) : 0,
          }),
        }
      )

      if (response.ok) {
        toast.success('Råvara tillagd')
        setIsAddIngredientDialogOpen(false)
        setSelectedMealForIngredient(null)
        setIngredientFormData({
          name: '',
          amount: '',
          protein: '',
          fat: '',
          carbs: '',
          calories: '',
        })
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till råvara')
      }
    } catch (error) {
      console.error('Error adding ingredient:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteIngredient = async (mealId: string, itemId: string) => {
    if (!confirm('Är du säker på att du vill radera denna råvara?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/meal-plan-templates/${templateId}/meals/${mealId}/items/${itemId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Råvara raderad')
        fetchTemplate()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera råvara')
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      toast.error('Ett fel uppstod')
    }
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">Måltidsplan hittades inte</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/content/meal-plans')}
            className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
              Redigera Måltidsplan
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              Lägg till måltider och alternativ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsAssignDialogOpen(true)}
            className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
          >
            <Users className="h-4 w-4 mr-2" />
            Tilldela klienter
            {template?.assignments && template.assignments.length > 0 && (
              <Badge className="ml-2 bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                {template.assignments.filter((a) => a.active).length}
              </Badge>
            )}
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara ändringar'}
          </Button>
        </div>
      </div>

      {/* Template Details Card */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Plandetaljer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-[rgba(255,255,255,0.8)]">
                Namn *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="targetCalories" className="text-[rgba(255,255,255,0.8)]">
                Mål kalorier
              </Label>
              <Input
                id="targetCalories"
                type="number"
                value={formData.targetCalories}
                onChange={(e) =>
                  setFormData({ ...formData, targetCalories: e.target.value })
                }
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description" className="text-[rgba(255,255,255,0.8)]">
              Beskrivning
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
            />
          </div>
          <div>
            <Label htmlFor="generalAdvice" className="text-[rgba(255,255,255,0.8)]">
              Generella råd
            </Label>
            <Textarea
              id="generalAdvice"
              value={formData.generalAdvice}
              onChange={(e) => setFormData({ ...formData, generalAdvice: e.target.value })}
              rows={4}
              placeholder="Skriv generella råd som visas för klienten..."
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="targetProtein" className="text-[rgba(255,255,255,0.8)]">
                Mål protein (g)
              </Label>
              <Input
                id="targetProtein"
                type="number"
                step="0.1"
                value={formData.targetProtein}
                onChange={(e) =>
                  setFormData({ ...formData, targetProtein: e.target.value })
                }
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="targetFat" className="text-[rgba(255,255,255,0.8)]">
                Mål fett (g)
              </Label>
              <Input
                id="targetFat"
                type="number"
                step="0.1"
                value={formData.targetFat}
                onChange={(e) => setFormData({ ...formData, targetFat: e.target.value })}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="targetCarbs" className="text-[rgba(255,255,255,0.8)]">
                Mål kolhydrater (g)
              </Label>
              <Input
                id="targetCarbs"
                type="number"
                step="0.1"
                value={formData.targetCarbs}
                onChange={(e) => setFormData({ ...formData, targetCarbs: e.target.value })}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals Card */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
              Måltider ({template.meals.length})
            </CardTitle>
            <Button
              onClick={() => setIsAddMealDialogOpen(true)}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till måltid
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {template.meals.length === 0 ? (
            <div className="text-center py-8">
              <UtensilsCrossed className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">Inga måltider ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                Lägg till din första måltid för att komma igång.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {template.meals
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((meal, index, sortedArray) => (
                  <Card
                    key={meal.id}
                    className="bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)]"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-white">
                            {meal.name}
                          </CardTitle>
                          <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1">
                            {meal.mealType} •{' '}
                            {meal.targetCalories
                              ? `${meal.targetCalories} kcal`
                              : 'Inget mål satt'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                            {meal.options.length} alternativ
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorderMeal(meal.id, 'up')}
                            disabled={index === 0}
                            title="Flytta upp"
                            className="hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReorderMeal(meal.id, 'down')}
                            disabled={index === sortedArray.length - 1}
                            title="Flytta ner"
                            className="hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditMealDialog(meal)}
                            title="Redigera måltid"
                            className="hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMeal(meal.id, meal.name)}
                            title="Radera måltid"
                            className="hover:bg-[rgba(255,0,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Ingredients Table */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                            Råvaror
                          </h3>
                          <Button
                            onClick={() => {
                              setSelectedMealForIngredient(meal.id)
                              setIsAddIngredientDialogOpen(true)
                            }}
                            size="sm"
                            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Lägg till råvara
                          </Button>
                        </div>

                        {meal.items && meal.items.length > 0 ? (
                          <div className="border border-[rgba(255,215,0,0.2)] rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-[rgba(255,215,0,0.05)]">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                                    Råvara
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                                    Mängd
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                                    P
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                                    F
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                                    K
                                  </th>
                                  <th className="px-3 py-2 text-right text-xs font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide">
                                    Kcal
                                  </th>
                                  <th className="px-3 py-2 w-20"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {meal.items
                                  .sort((a, b) => a.orderIndex - b.orderIndex)
                                  .map((item) => (
                                    <tr
                                      key={item.id}
                                      className="border-t border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]"
                                    >
                                      <td className="px-3 py-2 text-sm text-white">
                                        {item.name}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-[rgba(255,255,255,0.8)]">
                                        {item.amount}
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-blue-300">
                                        {item.protein}g
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-yellow-300">
                                        {item.fat}g
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-orange-300">
                                        {item.carbs}g
                                      </td>
                                      <td className="px-3 py-2 text-sm text-right text-[#FFD700]">
                                        {item.calories}
                                      </td>
                                      <td className="px-3 py-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteIngredient(meal.id, item.id)}
                                          className="h-6 w-6 hover:bg-[rgba(255,0,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-red-400"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="border border-dashed border-[rgba(255,215,0,0.3)] rounded-lg p-6 text-center">
                            <p className="text-sm text-[rgba(255,255,255,0.5)]">
                              Inga råvaror tillagda ännu. Klicka på "Lägg till råvara" för att komma igång.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Meal Alternatives Section */}
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.8)] uppercase tracking-wide mb-3">
                          Receptförslag & Alternativ
                        </h3>
                      </div>

                      {meal.options.length > 0 ? (
                        <>
                          <div className="space-y-2">
                            {meal.options
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((option) => (
                                <div
                                  key={option.id}
                                  className="p-3 bg-[rgba(0,0,0,0.2)] border border-[rgba(255,215,0,0.1)] rounded-lg"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {option.optionType === 'recipe' ? (
                                        <ChefHat className="h-5 w-5 text-[#FFD700]" />
                                      ) : option.optionType === 'ingredients' ? (
                                        <Apple className="h-5 w-5 text-[#FFD700]" />
                                      ) : (
                                        <UtensilsCrossed className="h-5 w-5 text-[#FFD700]" />
                                      )}
                                      <div>
                                        <p className="text-white font-medium">
                                          {option.optionType === 'recipe'
                                            ? option.recipe?.title
                                            : option.customName}
                                          {option.isDefault && (
                                            <Badge className="ml-2 bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] text-xs">
                                              Standard
                                            </Badge>
                                          )}
                                        </p>
                                        <p className="text-sm text-[rgba(255,255,255,0.6)]">
                                          {Math.round(option.calculatedCalories)} kcal • P:{' '}
                                          {Math.round(option.calculatedProtein)}g • F:{' '}
                                          {Math.round(option.calculatedFat)}g • K:{' '}
                                          {Math.round(option.calculatedCarbs)}g
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-[rgba(255,0,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-red-400"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Show food items if this is an ingredients option */}
                                  {option.optionType === 'ingredients' && option.customFoodItems && (
                                    <div className="mt-3 border-t border-[rgba(255,215,0,0.1)] pt-3">
                                      <p className="text-xs text-[rgba(255,255,255,0.5)] mb-2">Råvaror:</p>
                                      <div className="space-y-1">
                                        {(option.customFoodItems as any[]).map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between text-xs"
                                          >
                                            <span className="text-[rgba(255,255,255,0.7)]">
                                              {item.name}
                                            </span>
                                            <div className="flex items-center gap-3 text-[rgba(255,255,255,0.5)]">
                                              <span>{item.amountG}g</span>
                                              <span>
                                                P: {item.protein.toFixed(1)}g • F: {item.fat.toFixed(1)}g • K: {item.carbs.toFixed(1)}g
                                              </span>
                                              <span>{Math.round(item.calories)} kcal</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedMealForOption(meal.id)
                              setIsAddOptionDialogOpen(true)
                            }}
                            className="w-full mt-3 bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Lägg till alternativ
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-[rgba(255,255,255,0.6)] mb-3">
                            Inga alternativ ännu
                          </p>
                          <Button
                            onClick={() => {
                              setSelectedMealForOption(meal.id)
                              setIsAddOptionDialogOpen(true)
                            }}
                            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Lägg till första alternativet
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Meal Dialog */}
      <Dialog open={isAddMealDialogOpen} onOpenChange={setIsAddMealDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Lägg till måltid
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Skapa en ny måltid för denna måltidsplan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mealName" className="text-[rgba(255,255,255,0.8)]">
                Måltidsnamn *
              </Label>
              <Input
                id="mealName"
                value={mealFormData.name}
                onChange={(e) =>
                  setMealFormData({ ...mealFormData, name: e.target.value })
                }
                placeholder="t.ex. Frukost"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="mealType" className="text-[rgba(255,255,255,0.8)]">
                Måltidstyp *
              </Label>
              <Select
                value={mealFormData.mealType}
                onValueChange={(value) =>
                  setMealFormData({ ...mealFormData, mealType: value })
                }
              >
                <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                  <SelectItem
                    value="breakfast"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Frukost
                  </SelectItem>
                  <SelectItem
                    value="lunch"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Lunch
                  </SelectItem>
                  <SelectItem
                    value="dinner"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Middag
                  </SelectItem>
                  <SelectItem
                    value="snack"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Mellanmål
                  </SelectItem>
                  <SelectItem
                    value="evening"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Kvällsmål
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mealDescription" className="text-[rgba(255,255,255,0.8)]">
                Beskrivning
              </Label>
              <Textarea
                id="mealDescription"
                value={mealFormData.description}
                onChange={(e) =>
                  setMealFormData({ ...mealFormData, description: e.target.value })
                }
                placeholder="T.ex. 'Ät inom 30 min efter uppvakning'"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)] min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="mealTargetCalories"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Mål kalorier
                </Label>
                <Input
                  id="mealTargetCalories"
                  type="number"
                  step="1"
                  value={mealFormData.targetCalories}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetCalories: e.target.value })
                  }
                  placeholder="500"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="mealTargetProtein"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Mål protein (g)
                </Label>
                <Input
                  id="mealTargetProtein"
                  type="number"
                  step="0.1"
                  value={mealFormData.targetProtein}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetProtein: e.target.value })
                  }
                  placeholder="30"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label htmlFor="mealTargetFat" className="text-[rgba(255,255,255,0.8)]">
                  Mål fett (g)
                </Label>
                <Input
                  id="mealTargetFat"
                  type="number"
                  step="0.1"
                  value={mealFormData.targetFat}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetFat: e.target.value })
                  }
                  placeholder="15"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="mealTargetCarbs"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Mål kolhydrater (g)
                </Label>
                <Input
                  id="mealTargetCarbs"
                  type="number"
                  step="0.1"
                  value={mealFormData.targetCarbs}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetCarbs: e.target.value })
                  }
                  placeholder="50"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsAddMealDialogOpen(false)}
              className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleAddMeal}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              Lägg till måltid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meal Dialog */}
      <Dialog open={isEditMealDialogOpen} onOpenChange={setIsEditMealDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Redigera måltid
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Uppdatera måltidsinformation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editMealName" className="text-[rgba(255,255,255,0.8)]">
                Måltidsnamn *
              </Label>
              <Input
                id="editMealName"
                value={mealFormData.name}
                onChange={(e) =>
                  setMealFormData({ ...mealFormData, name: e.target.value })
                }
                placeholder="t.ex. Frukost"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="editMealType" className="text-[rgba(255,255,255,0.8)]">
                Måltidstyp *
              </Label>
              <Select
                value={mealFormData.mealType}
                onValueChange={(value) =>
                  setMealFormData({ ...mealFormData, mealType: value })
                }
              >
                <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                  <SelectItem
                    value="breakfast"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Frukost
                  </SelectItem>
                  <SelectItem
                    value="lunch"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Lunch
                  </SelectItem>
                  <SelectItem
                    value="dinner"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Middag
                  </SelectItem>
                  <SelectItem
                    value="snack"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Mellanmål
                  </SelectItem>
                  <SelectItem
                    value="evening"
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    Kvällsmål
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editMealDescription" className="text-[rgba(255,255,255,0.8)]">
                Beskrivning
              </Label>
              <Textarea
                id="editMealDescription"
                value={mealFormData.description}
                onChange={(e) =>
                  setMealFormData({ ...mealFormData, description: e.target.value })
                }
                placeholder="T.ex. 'Ät inom 30 min efter uppvakning'"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)] min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="editMealTargetCalories"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Mål kalorier
                </Label>
                <Input
                  id="editMealTargetCalories"
                  type="number"
                  step="1"
                  value={mealFormData.targetCalories}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetCalories: e.target.value })
                  }
                  placeholder="500"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="editMealTargetProtein"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Mål protein (g)
                </Label>
                <Input
                  id="editMealTargetProtein"
                  type="number"
                  step="0.1"
                  value={mealFormData.targetProtein}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetProtein: e.target.value })
                  }
                  placeholder="30"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label htmlFor="editMealTargetFat" className="text-[rgba(255,255,255,0.8)]">
                  Mål fett (g)
                </Label>
                <Input
                  id="editMealTargetFat"
                  type="number"
                  step="0.1"
                  value={mealFormData.targetFat}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetFat: e.target.value })
                  }
                  placeholder="15"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label
                  htmlFor="editMealTargetCarbs"
                  className="text-[rgba(255,255,255,0.8)]"
                >
                  Mål kolhydrater (g)
                </Label>
                <Input
                  id="editMealTargetCarbs"
                  type="number"
                  step="0.1"
                  value={mealFormData.targetCarbs}
                  onChange={(e) =>
                    setMealFormData({ ...mealFormData, targetCarbs: e.target.value })
                  }
                  placeholder="50"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsEditMealDialogOpen(false)
                setEditingMeal(null)
              }}
              className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleEditMeal}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              Spara ändringar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Meal Option Dialog */}
      {selectedMealForOption && (
        <AddMealOptionDialog
          open={isAddOptionDialogOpen}
          onOpenChange={setIsAddOptionDialogOpen}
          templateId={templateId}
          mealId={selectedMealForOption}
          onSuccess={fetchTemplate}
        />
      )}

      {/* Assign Template Dialog */}
      {template && (
        <AssignTemplateDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          templateId={templateId}
          templateName={template.name}
          existingAssignments={template.assignments || []}
          onSuccess={fetchTemplate}
        />
      )}

      {/* Add Ingredient Dialog */}
      <Dialog open={isAddIngredientDialogOpen} onOpenChange={setIsAddIngredientDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Lägg till råvara
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Ange råvarans namn, mängd och näringsinnehåll.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ingredientName" className="text-[rgba(255,255,255,0.8)]">
                  Råvara *
                </Label>
                <Input
                  id="ingredientName"
                  value={ingredientFormData.name}
                  onChange={(e) =>
                    setIngredientFormData({ ...ingredientFormData, name: e.target.value })
                  }
                  placeholder="t.ex. Havregryn"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
              <div>
                <Label htmlFor="ingredientAmount" className="text-[rgba(255,255,255,0.8)]">
                  Mängd *
                </Label>
                <Input
                  id="ingredientAmount"
                  value={ingredientFormData.amount}
                  onChange={(e) =>
                    setIngredientFormData({ ...ingredientFormData, amount: e.target.value })
                  }
                  placeholder="t.ex. 50g, 3 styck"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ingredientProtein" className="text-[rgba(255,255,255,0.8)]">
                  Protein (g)
                </Label>
                <Input
                  id="ingredientProtein"
                  type="number"
                  step="0.1"
                  value={ingredientFormData.protein}
                  onChange={(e) =>
                    setIngredientFormData({ ...ingredientFormData, protein: e.target.value })
                  }
                  placeholder="0"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label htmlFor="ingredientFat" className="text-[rgba(255,255,255,0.8)]">
                  Fett (g)
                </Label>
                <Input
                  id="ingredientFat"
                  type="number"
                  step="0.1"
                  value={ingredientFormData.fat}
                  onChange={(e) =>
                    setIngredientFormData({ ...ingredientFormData, fat: e.target.value })
                  }
                  placeholder="0"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ingredientCarbs" className="text-[rgba(255,255,255,0.8)]">
                  Kolhydrater (g)
                </Label>
                <Input
                  id="ingredientCarbs"
                  type="number"
                  step="0.1"
                  value={ingredientFormData.carbs}
                  onChange={(e) =>
                    setIngredientFormData({ ...ingredientFormData, carbs: e.target.value })
                  }
                  placeholder="0"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div>
                <Label htmlFor="ingredientCalories" className="text-[rgba(255,255,255,0.8)]">
                  Kalorier
                </Label>
                <Input
                  id="ingredientCalories"
                  type="number"
                  step="0.1"
                  value={ingredientFormData.calories}
                  onChange={(e) =>
                    setIngredientFormData({ ...ingredientFormData, calories: e.target.value })
                  }
                  placeholder="0"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsAddIngredientDialogOpen(false)
                setIngredientFormData({
                  name: '',
                  amount: '',
                  protein: '',
                  fat: '',
                  carbs: '',
                  calories: '',
                })
              }}
              className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleAddIngredient}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              Lägg till råvara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
