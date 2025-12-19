'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MealEditor, EditorMeal, EditorFood } from './MealEditor'
import { ClientSchemasBrowser } from './ClientSchemasBrowser'
import { toast } from 'sonner'
import { Plus, Save, Loader2, Copy, ArrowLeft } from 'lucide-react'

interface CatalogCategory {
  id: string
  name: string
}

interface CatalogSchemaEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schemaId?: string | null
  categories: CatalogCategory[]
  onSave: () => void
}

export function CatalogSchemaEditor({
  open,
  onOpenChange,
  schemaId,
  categories,
  onSave
}: CatalogSchemaEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'client-schemas'>('edit')

  // Schema data
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [calorieLevel, setCalorieLevel] = useState(2000)
  const [meals, setMeals] = useState<EditorMeal[]>([])

  // Load existing schema if editing
  useEffect(() => {
    if (open && schemaId) {
      loadSchema(schemaId)
    } else if (open && !schemaId) {
      // Reset form for new schema
      setCategoryId(categories[0]?.id || '')
      setName('')
      setDescription('')
      setCalorieLevel(2000)
      setMeals([])
    }
  }, [open, schemaId, categories])

  const loadSchema = async (id: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/catalog/schemas/${id}`)
      if (res.ok) {
        const data = await res.json()
        const schema = data.schema
        setCategoryId(schema.categoryId)
        setName(schema.name)
        setDescription(schema.description || '')
        setCalorieLevel(schema.calorieLevel)
        setMeals(
          schema.meals.map((m: any) => ({
            id: m.id,
            name: m.name,
            time: m.time,
            foods: m.foods.map((f: any) => ({
              id: f.id,
              name: f.name,
              amountG: f.amountG,
              category: f.category,
              protein: f.protein,
              carbs: f.carbs,
              fat: f.fat,
              kcal: f.kcal,
            })),
          }))
        )
      }
    } catch (error) {
      console.error('Error loading schema:', error)
      toast.error('Kunde inte ladda schemat')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => {
      const mealTotals = meal.foods.reduce(
        (mAcc, food) => ({
          protein: mAcc.protein + food.protein,
          carbs: mAcc.carbs + food.carbs,
          fat: mAcc.fat + food.fat,
          kcal: mAcc.kcal + food.kcal,
        }),
        { protein: 0, carbs: 0, fat: 0, kcal: 0 }
      )
      return {
        protein: acc.protein + mealTotals.protein,
        carbs: acc.carbs + mealTotals.carbs,
        fat: acc.fat + mealTotals.fat,
        kcal: acc.kcal + mealTotals.kcal,
      }
    },
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  )

  const handleAddMeal = () => {
    const newMeal: EditorMeal = {
      id: `meal-${Date.now()}`,
      name: 'Frukost',
      time: '07:00',
      foods: [],
    }
    setMeals([...meals, newMeal])
  }

  const handleUpdateMeal = (index: number, updatedMeal: EditorMeal) => {
    const newMeals = [...meals]
    newMeals[index] = updatedMeal
    setMeals(newMeals)
  }

  const handleDeleteMeal = (index: number) => {
    setMeals(meals.filter((_, i) => i !== index))
  }

  const handleImportClientSchema = (clientMeals: EditorMeal[]) => {
    setMeals(clientMeals)
    setActiveTab('edit')
    toast.success('Schema importerat!')
  }

  const handleSave = async () => {
    if (!categoryId) {
      toast.error('Välj en kategori')
      return
    }
    if (!name.trim()) {
      toast.error('Ange ett namn')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        categoryId,
        name: name.trim(),
        description: description.trim() || null,
        calorieLevel,
        totalProtein: Math.round(totals.protein),
        totalCarbs: Math.round(totals.carbs),
        totalFat: Math.round(totals.fat),
        totalKcal: Math.round(totals.kcal),
        meals: meals.map((meal, mealIdx) => ({
          name: meal.name,
          time: meal.time,
          totalProtein: meal.foods.reduce((sum, f) => sum + f.protein, 0),
          totalCarbs: meal.foods.reduce((sum, f) => sum + f.carbs, 0),
          totalFat: meal.foods.reduce((sum, f) => sum + f.fat, 0),
          totalKcal: meal.foods.reduce((sum, f) => sum + f.kcal, 0),
          orderIndex: mealIdx,
          foods: meal.foods.map((food, foodIdx) => ({
            name: food.name,
            amountG: food.amountG,
            category: food.category,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            kcal: food.kcal,
            orderIndex: foodIdx,
          })),
        })),
      }

      const url = schemaId
        ? `/api/catalog/schemas/${schemaId}`
        : '/api/catalog/schemas'
      const method = schemaId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success(schemaId ? 'Schema uppdaterat!' : 'Schema skapat!')
        onSave()
        onOpenChange(false)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ett fel uppstod')
      }
    } catch (error) {
      console.error('Error saving schema:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-4xl sm:max-w-5xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <SheetTitle>{schemaId ? 'Redigera kostschema' : 'Skapa nytt kostschema'}</SheetTitle>
              <SheetDescription>
                Lägg till måltider och livsmedel för att bygga ett komplett kostschema
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-gold-primary" />
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 pt-4 shrink-0">
                <TabsList className="grid grid-cols-2 w-full max-w-sm">
                  <TabsTrigger value="edit">Redigera schema</TabsTrigger>
                  <TabsTrigger value="client-schemas">Klientscheman</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="edit" className="flex-1 overflow-hidden m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Schema Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Kategori</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Kalorinivå</Label>
                        <Input
                          type="number"
                          value={calorieLevel}
                          onChange={(e) => setCalorieLevel(parseInt(e.target.value) || 0)}
                          placeholder="2000"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Namn</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="T.ex. Högprotein 2200 kcal"
                      />
                    </div>

                    <div>
                      <Label>Beskrivning (valfritt)</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Kort beskrivning av schemat"
                        rows={2}
                      />
                    </div>

                    {/* Macro Summary */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-700">Beräknade makros</h3>
                        <div className="text-xl font-bold text-gray-900">
                          {Math.round(totals.kcal)} <span className="text-sm font-normal text-gray-500">kcal</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-red-600 mb-1">Protein</p>
                          <p className="text-lg font-bold text-red-700">{Math.round(totals.protein)}g</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-amber-600 mb-1">Kolhydrater</p>
                          <p className="text-lg font-bold text-amber-700">{Math.round(totals.carbs)}g</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-xs text-blue-600 mb-1">Fett</p>
                          <p className="text-lg font-bold text-blue-700">{Math.round(totals.fat)}g</p>
                        </div>
                      </div>
                    </div>

                    {/* Meals */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Måltider ({meals.length})</h3>
                        <Button onClick={handleAddMeal} size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Lägg till måltid
                        </Button>
                      </div>

                      {meals.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed">
                          <p className="text-gray-500 mb-3">Inga måltider tillagda</p>
                          <Button onClick={handleAddMeal} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Lägg till första måltiden
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {meals.map((meal, index) => (
                            <MealEditor
                              key={meal.id}
                              meal={meal}
                              onUpdate={(updated) => handleUpdateMeal(index, updated)}
                              onDelete={() => handleDeleteMeal(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="client-schemas" className="flex-1 overflow-hidden m-0">
                <ClientSchemasBrowser onImport={handleImportClientSchema} />
              </TabsContent>
            </Tabs>

            <SheetFooter className="px-6 py-4 border-t shrink-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {schemaId ? 'Uppdatera' : 'Spara schema'}
                  </>
                )}
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
