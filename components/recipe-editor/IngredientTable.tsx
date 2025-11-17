import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { RecipeIngredient, FoodItem, DISPLAY_UNITS } from './types'
import { FoodItemSelector } from './FoodItemSelector'
import { calculateIngredientNutrition } from '@/lib/calculations/recipe-nutrition'

interface IngredientTableProps {
  ingredients: RecipeIngredient[]
  onAdd: (ingredient: Partial<RecipeIngredient>) => void
  onUpdate: (id: string, field: keyof RecipeIngredient, value: any) => void
  onDelete: (id: string) => void
}

export function IngredientTable({ ingredients, onAdd, onUpdate, onDelete }: IngredientTableProps) {
  const [newIngredient, setNewIngredient] = useState<{
    foodItem: FoodItem | null
    amount: number
    displayUnit: string
    displayAmount: string
  }>({
    foodItem: null,
    amount: 0,
    displayUnit: 'g',
    displayAmount: ''
  })

  const handleAdd = () => {
    if (!newIngredient.foodItem || newIngredient.amount <= 0) {
      return
    }

    onAdd({
      foodItemId: newIngredient.foodItem.id,
      foodItem: newIngredient.foodItem,
      amount: newIngredient.amount,
      displayUnit: newIngredient.displayUnit,
      displayAmount: newIngredient.displayAmount,
      optional: false,
      notes: null,
      orderIndex: ingredients.length
    })

    // Reset form
    setNewIngredient({
      foodItem: null,
      amount: 0,
      displayUnit: 'g',
      displayAmount: ''
    })
  }

  return (
    <div className="space-y-4">
      {/* Existing Ingredients Table */}
      {ingredients.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <table className="min-w-[700px] w-full">
            <thead>
              <tr className="bg-[rgba(74,103,65,0.3)] border-b-2 border-[rgba(255,215,0,0.2)]">
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-[rgba(255,255,255,0.9)]">
                  Ingrediens
                </th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-[rgba(255,255,255,0.9)]">
                  Mängd
                </th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-[rgba(255,255,255,0.9)]">
                  Enhet
                </th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-[rgba(255,255,255,0.9)]">
                  Vikt (g)
                </th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium text-[rgba(255,255,255,0.9)]">
                  Kcal
                </th>
                <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs md:text-sm font-medium text-[rgba(255,255,255,0.9)]">

                </th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map((ingredient, index) => {
                const nutrition = ingredient.foodItem
                  ? calculateIngredientNutrition(ingredient.foodItem, ingredient.amount)
                  : null

                return (
                  <tr
                    key={ingredient.id}
                    className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.05)] transition-colors"
                  >
                    <td className="px-2 md:px-4 py-2 md:py-3 text-[rgba(255,255,255,0.9)] text-xs md:text-sm">
                      {ingredient.foodItem?.name || 'Unknown'}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3">
                      <Input
                        type="text"
                        value={ingredient.displayAmount || ''}
                        onChange={(e) => onUpdate(ingredient.id, 'displayAmount', e.target.value)}
                        placeholder="2"
                        className="w-16 md:w-20 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs md:text-sm"
                      />
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3">
                      <Select
                        value={ingredient.displayUnit || 'g'}
                        onValueChange={(value) => onUpdate(ingredient.id, 'displayUnit', value)}
                      >
                        <SelectTrigger className="w-20 md:w-24 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs md:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DISPLAY_UNITS.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3">
                      <Input
                        type="number"
                        value={ingredient.amount}
                        onChange={(e) => onUpdate(ingredient.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-20 md:w-24 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-xs md:text-sm"
                      />
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-[rgba(255,255,255,0.7)] text-xs md:text-sm">
                      {nutrition?.calories || 0}
                    </td>
                    <td className="px-2 md:px-4 py-2 md:py-3 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(ingredient.id)}
                        className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)] h-8 w-8 md:h-10 md:w-10"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Ingredient Form */}
      <div className="p-4 bg-[rgba(255,255,255,0.02)] border-2 border-[rgba(255,215,0,0.1)] rounded-lg">
        <h4 className="text-sm font-medium text-[rgba(255,255,255,0.9)] mb-3">
          Lägg till ingrediens
        </h4>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
            <FoodItemSelector
              onSelect={(foodItem) => setNewIngredient(prev => ({ ...prev, foodItem }))}
              placeholder="Sök ingrediens..."
            />
          </div>
          <div>
            <Input
              type="text"
              value={newIngredient.displayAmount}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, displayAmount: e.target.value }))}
              placeholder="Mängd (t.ex. 2)"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white"
            />
          </div>
          <div>
            <Select
              value={newIngredient.displayUnit}
              onValueChange={(value) => setNewIngredient(prev => ({ ...prev, displayUnit: value }))}
            >
              <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPLAY_UNITS.map(unit => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="number"
              value={newIngredient.amount || ''}
              onChange={(e) => setNewIngredient(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              placeholder="Vikt (g)"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white"
            />
          </div>
        </div>
        <Button
          onClick={handleAdd}
          disabled={!newIngredient.foodItem || newIngredient.amount <= 0}
          className="mt-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till
        </Button>
      </div>
    </div>
  )
}
