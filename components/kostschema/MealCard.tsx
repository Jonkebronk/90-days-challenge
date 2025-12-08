'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, RefreshCw, Trash2, Check, X } from 'lucide-react'
import { ScaledMeal, ScaledIngredient } from '@/lib/kostschema/types'

interface MealCardProps {
  meal: ScaledMeal
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg') => void
  onDeleteIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg', index: number) => void
  onUpdateGrams?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg', index: number, grams: number) => void
  onAddSupplement?: (mealType: string, supplementId: number) => void
  onRemoveSupplement?: (mealType: string, supplementId: number) => void
}

function IngredientItem({
  ingredient,
  onSwap,
  onDelete,
  onUpdateGrams
}: {
  ingredient: ScaledIngredient
  onSwap: () => void
  onDelete?: () => void
  onUpdateGrams?: (grams: number) => void
}) {
  const [isEditingGrams, setIsEditingGrams] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingGrams && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingGrams])

  const handleGramsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUpdateGrams) {
      setEditValue(Math.round(ingredient.scaledAmount).toString())
      setIsEditingGrams(true)
    }
  }

  const handleSaveGrams = () => {
    const newGrams = parseInt(editValue)
    if (!isNaN(newGrams) && newGrams > 0 && onUpdateGrams) {
      onUpdateGrams(newGrams)
    }
    setIsEditingGrams(false)
  }

  const handleCancelEdit = () => {
    setIsEditingGrams(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveGrams()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="w-full flex items-center gap-1.5 px-2 py-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-lg transition-all group border border-transparent hover:border-zinc-700">
      {/* Swap button */}
      <button
        onClick={onSwap}
        className="p-1.5 rounded hover:bg-zinc-700 transition-colors"
        title="Byt ingrediens"
      >
        <RefreshCw className="h-3.5 w-3.5 text-zinc-500 group-hover:text-gold-500 transition-colors" />
      </button>

      {/* Grams + Name */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {isEditingGrams ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveGrams}
              className="w-16 px-1.5 py-0.5 text-sm bg-zinc-800 border border-gold-500 rounded text-gold-500 font-semibold focus:outline-none"
              min="1"
            />
            <span className="text-sm text-gold-500 font-semibold">g</span>
          </div>
        ) : (
          <button
            onClick={handleGramsClick}
            className={`text-sm text-gold-500 font-semibold hover:bg-gold-500/20 px-1.5 py-0.5 rounded transition-colors ${onUpdateGrams ? 'cursor-pointer' : 'cursor-default'}`}
            title={onUpdateGrams ? 'Klicka för att ändra gram' : undefined}
          >
            {Math.round(ingredient.scaledAmount)}g
          </button>
        )}
        <span className="text-sm text-zinc-200 group-hover:text-white truncate">
          {ingredient.name}
        </span>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
          title="Ta bort ingrediens"
        >
          <Trash2 className="h-3.5 w-3.5 text-zinc-500 hover:text-red-400 transition-colors" />
        </button>
      )}
    </div>
  )
}

function IngredientColumn({
  title,
  ingredients,
  category,
  mealType,
  color,
  onChangeIngredient,
  onAddIngredient,
  onDeleteIngredient,
  onUpdateGrams
}: {
  title: string
  ingredients: ScaledIngredient[]
  category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg'
  mealType: string
  color: 'rose' | 'blue' | 'amber' | 'emerald'
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg') => void
  onDeleteIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg', index: number) => void
  onUpdateGrams?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett' | 'tillagg', index: number, grams: number) => void
}) {
  const colorClasses = {
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  }

  const headerColors = {
    rose: 'bg-rose-500/5 border-rose-500/10',
    blue: 'bg-blue-500/5 border-blue-500/10',
    amber: 'bg-amber-500/5 border-amber-500/10',
    emerald: 'bg-emerald-500/5 border-emerald-500/10'
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${headerColors[color]}`}>
      {/* Header */}
      <div className={`px-3 py-2.5 border-b ${headerColors[color]}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${colorClasses[color].split(' ')[2]}`}>
          {title}
        </p>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-0 bg-zinc-800/30">
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id}>
            {index > 0 && (
              <div className="flex items-center gap-2 py-3">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-gold-500/40 to-gold-500/40" />
                <span className="text-xs text-gold-400 font-bold uppercase tracking-widest px-3 py-1 bg-gold-500/15 rounded-full border border-gold-500/30">eller</span>
                <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent via-gold-500/40 to-gold-500/40" />
              </div>
            )}
            <IngredientItem
              ingredient={ingredient}
              onSwap={() => onChangeIngredient?.(mealType, category, index)}
              onDelete={onDeleteIngredient ? () => onDeleteIngredient(mealType, category, index) : undefined}
              onUpdateGrams={onUpdateGrams ? (grams) => onUpdateGrams(mealType, category, index, grams) : undefined}
            />
          </div>
        ))}

        {ingredients.length === 0 && (
          <div className="py-3 text-sm text-zinc-600 italic text-center">Ingen källa</div>
        )}

        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-zinc-700/30 text-zinc-500 hover:text-gold-500 text-xs transition-colors py-1.5"
          >
            <Plus className="h-3 w-3" />
            <span>Lägg till alternativ</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function MealCard({
  meal,
  onChangeIngredient,
  onAddIngredient,
  onDeleteIngredient,
  onUpdateGrams,
  onAddSupplement,
  onRemoveSupplement
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-gradient-to-b from-zinc-800/80 to-zinc-900/80 rounded-2xl overflow-hidden border border-zinc-700/50 shadow-lg">
      {/* Header */}
      <button
        className="w-full cursor-pointer py-4 px-5 hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-white text-lg">{meal.name}</div>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              {meal.kcalPercent}%
            </span>
          </div>
          <div className="flex items-center gap-5">
            {/* Macro pills */}
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/20">
                {meal.kcal} kcal
              </span>
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400">
                P {meal.protein}g
              </span>
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400">
                K {meal.carbs}g
              </span>
              <span className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">
                F {meal.fat}g
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-500" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          <div className="grid grid-cols-3 gap-3">
            <IngredientColumn
              title="Kolhydrat"
              ingredients={meal.template.kolhydrat}
              category="kolhydrat"
              mealType={meal.type}
              color="blue"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
              onDeleteIngredient={onDeleteIngredient}
              onUpdateGrams={onUpdateGrams}
            />
            <IngredientColumn
              title="Protein"
              ingredients={meal.template.protein}
              category="protein"
              mealType={meal.type}
              color="rose"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
              onDeleteIngredient={onDeleteIngredient}
              onUpdateGrams={onUpdateGrams}
            />
            <IngredientColumn
              title="Fett"
              ingredients={meal.template.fett}
              category="fett"
              mealType={meal.type}
              color="amber"
              onChangeIngredient={onChangeIngredient}
              onAddIngredient={onAddIngredient}
              onDeleteIngredient={onDeleteIngredient}
              onUpdateGrams={onUpdateGrams}
            />
          </div>

          {/* Tillägg (Grönsaker/Sallad) */}
          <div className="mt-4 pt-4 border-t border-zinc-700/30">
            <div className="rounded-xl overflow-hidden border bg-emerald-500/5 border-emerald-500/10">
              <div className="px-3 py-2.5 border-b bg-emerald-500/5 border-emerald-500/10">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Tillägg (grönsaker/sallad)
                </p>
              </div>
              <div className="p-2.5 space-y-0 bg-zinc-800/30">
                {meal.template.tillagg.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && (
                      <div className="flex items-center gap-2 py-3">
                        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-gold-500/40 to-gold-500/40" />
                        <span className="text-xs text-gold-400 font-bold uppercase tracking-widest px-3 py-1 bg-gold-500/15 rounded-full border border-gold-500/30">eller</span>
                        <div className="h-0.5 flex-1 bg-gradient-to-l from-transparent via-gold-500/40 to-gold-500/40" />
                      </div>
                    )}
                    <IngredientItem
                      ingredient={item}
                      onSwap={() => onChangeIngredient?.(meal.type, 'tillagg', index)}
                      onDelete={onDeleteIngredient ? () => onDeleteIngredient(meal.type, 'tillagg', index) : undefined}
                      onUpdateGrams={onUpdateGrams ? (grams) => onUpdateGrams(meal.type, 'tillagg', index, grams) : undefined}
                    />
                  </div>
                ))}
                {meal.template.tillagg.length === 0 && (
                  <div className="py-3 text-sm text-zinc-600 italic text-center">Ingen tillägg</div>
                )}
                {onAddIngredient && (
                  <button
                    onClick={() => onAddIngredient(meal.type, 'tillagg')}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-zinc-700/30 text-zinc-500 hover:text-emerald-400 text-xs transition-colors py-1.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Lägg till grönsaker/sallad</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kosttillskott */}
          <div className="mt-3">
            <div className="rounded-xl overflow-hidden border bg-purple-500/5 border-purple-500/10">
              <div className="px-3 py-2.5 border-b bg-purple-500/5 border-purple-500/10">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Kosttillskott
                </p>
              </div>
              <div className="p-2.5 bg-zinc-800/30">
                {meal.template.kosttillskott && meal.template.kosttillskott.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {meal.template.kosttillskott.map((item) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400 font-medium"
                      >
                        <span>{item.amount} {item.unit} {item.name}</span>
                        {onRemoveSupplement && (
                          <button
                            onClick={() => onRemoveSupplement(meal.type, item.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-sm text-zinc-600 italic text-center">Inga kosttillskott</div>
                )}
                {onAddSupplement && (
                  <button
                    onClick={() => onAddSupplement(meal.type, 0)}
                    className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-zinc-700/30 text-zinc-500 hover:text-purple-400 text-xs transition-colors py-1.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Lägg till kosttillskott</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
