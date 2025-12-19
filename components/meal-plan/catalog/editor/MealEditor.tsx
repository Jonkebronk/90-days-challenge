'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FoodSourceSearch } from './FoodSourceSearch'
import { Plus, Trash2, Clock, GripVertical, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface EditorFood {
  id: string
  name: string
  amountG: number
  category: 'protein' | 'kolhydrat' | 'fett' | 'grönsak' | 'tillskott'
  protein: number
  carbs: number
  fat: number
  kcal: number
}

export interface EditorMeal {
  id: string
  name: string
  time: string
  foods: EditorFood[]
}

interface MealEditorProps {
  meal: EditorMeal
  onUpdate: (meal: EditorMeal) => void
  onDelete: () => void
  isExpanded?: boolean
}

const MEAL_TYPES = [
  { value: 'Frukost', label: 'Frukost' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'Mellanmål', label: 'Mellanmål' },
  { value: 'Middag', label: 'Middag' },
  { value: 'Kvällsmål', label: 'Kvällsmål' },
  { value: 'Pre-workout', label: 'Pre-workout' },
  { value: 'Post-workout', label: 'Post-workout' },
]

const FOOD_CATEGORIES = [
  { value: 'protein', label: 'Protein', color: 'text-red-600' },
  { value: 'kolhydrat', label: 'Kolhydrat', color: 'text-amber-600' },
  { value: 'fett', label: 'Fett', color: 'text-blue-600' },
  { value: 'grönsak', label: 'Grönsak', color: 'text-green-600' },
  { value: 'tillskott', label: 'Tillskott', color: 'text-purple-600' },
]

export function MealEditor({ meal, onUpdate, onDelete, isExpanded = true }: MealEditorProps) {
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [editingFood, setEditingFood] = useState<EditorFood | null>(null)
  const [foodSearchCategory, setFoodSearchCategory] = useState<'protein' | 'kolhydrat' | 'fett' | 'grönsak' | undefined>()

  // Calculate meal totals
  const totals = meal.foods.reduce(
    (acc, food) => ({
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
      kcal: acc.kcal + food.kcal,
    }),
    { protein: 0, carbs: 0, fat: 0, kcal: 0 }
  )

  const handleAddFood = (normalizedFood: any) => {
    const scaleFactor = normalizedFood.defaultAmount / 100
    const newFood: EditorFood = {
      id: `food-${Date.now()}`,
      name: normalizedFood.name,
      amountG: normalizedFood.defaultAmount,
      category: foodSearchCategory || 'protein',
      protein: Math.round(normalizedFood.protein * scaleFactor),
      carbs: Math.round(normalizedFood.carbs * scaleFactor),
      fat: Math.round(normalizedFood.fat * scaleFactor),
      kcal: Math.round(normalizedFood.kcal * scaleFactor),
    }
    onUpdate({
      ...meal,
      foods: [...meal.foods, newFood],
    })
    setShowFoodSearch(false)
  }

  const handleUpdateFood = (foodId: string, updates: Partial<EditorFood>) => {
    onUpdate({
      ...meal,
      foods: meal.foods.map((f) => (f.id === foodId ? { ...f, ...updates } : f)),
    })
  }

  const handleDeleteFood = (foodId: string) => {
    onUpdate({
      ...meal,
      foods: meal.foods.filter((f) => f.id !== foodId),
    })
  }

  const handleAmountChange = (food: EditorFood, newAmount: number) => {
    if (newAmount <= 0) return
    const ratio = newAmount / food.amountG
    handleUpdateFood(food.id, {
      amountG: newAmount,
      protein: Math.round(food.protein * ratio),
      carbs: Math.round(food.carbs * ratio),
      fat: Math.round(food.fat * ratio),
      kcal: Math.round(food.kcal * ratio),
    })
  }

  const getCategoryBadge = (category: string) => {
    const cat = FOOD_CATEGORIES.find((c) => c.value === category)
    return cat ? (
      <span className={cn('text-xs font-medium', cat.color)}>{cat.label.charAt(0)}</span>
    ) : null
  }

  return (
    <Card className="border-gray-200">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
            <div className="flex items-center gap-2">
              <Select
                value={meal.name}
                onValueChange={(value) => onUpdate({ ...meal, name: value })}
              >
                <SelectTrigger className="w-[140px] h-8 text-sm font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                <Input
                  type="time"
                  value={meal.time}
                  onChange={(e) => onUpdate({ ...meal, time: e.target.value })}
                  className="w-24 h-8 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-xs">
              <span className="text-red-600 font-medium">{Math.round(totals.protein)}P</span>
              <span className="text-amber-600 font-medium">{Math.round(totals.carbs)}K</span>
              <span className="text-blue-600 font-medium">{Math.round(totals.fat)}F</span>
              <span className="font-medium">{Math.round(totals.kcal)} kcal</span>
            </div>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-4 pb-4">
          {/* Foods Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">LIVSMEDEL</th>
                  <th className="px-3 py-2 text-right font-medium w-20">MÄNGD</th>
                  <th className="px-3 py-2 text-right font-medium w-14">P</th>
                  <th className="px-3 py-2 text-right font-medium w-14">K</th>
                  <th className="px-3 py-2 text-right font-medium w-14">F</th>
                  <th className="px-3 py-2 text-right font-medium w-16">KCAL</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {meal.foods.map((food, idx) => (
                  <tr key={food.id} className={cn('border-t', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(food.category)}
                        <span className="text-gray-900">{food.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Input
                        type="number"
                        value={food.amountG}
                        onChange={(e) => handleAmountChange(food, parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-xs text-right p-1"
                      />
                      <span className="text-gray-500 text-xs ml-1">g</span>
                    </td>
                    <td className="px-3 py-2 text-right text-red-600">{food.protein}</td>
                    <td className="px-3 py-2 text-right text-amber-600">{food.carbs}</td>
                    <td className="px-3 py-2 text-right text-blue-600">{food.fat}</td>
                    <td className="px-3 py-2 text-right font-medium">{food.kcal}</td>
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFood(food.id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {meal.foods.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">
                      Inga livsmedel tillagda
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-medium">
                <tr>
                  <td className="px-3 py-2">Totalt</td>
                  <td></td>
                  <td className="px-3 py-2 text-right text-red-600">{Math.round(totals.protein)}g</td>
                  <td className="px-3 py-2 text-right text-amber-600">{Math.round(totals.carbs)}g</td>
                  <td className="px-3 py-2 text-right text-blue-600">{Math.round(totals.fat)}g</td>
                  <td className="px-3 py-2 text-right">{Math.round(totals.kcal)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Food Buttons */}
          <div className="flex gap-2 mt-3">
            {FOOD_CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant="outline"
                size="sm"
                onClick={() => {
                  setFoodSearchCategory(cat.value as any)
                  setShowFoodSearch(true)
                }}
                className={cn('text-xs', cat.color)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Food Search Dialog */}
          <Dialog open={showFoodSearch} onOpenChange={setShowFoodSearch}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  Lägg till {FOOD_CATEGORIES.find((c) => c.value === foodSearchCategory)?.label || 'livsmedel'}
                </DialogTitle>
              </DialogHeader>
              <FoodSourceSearch
                onSelect={handleAddFood}
                category={foodSearchCategory}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      )}
    </Card>
  )
}
