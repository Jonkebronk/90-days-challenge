'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, RefreshCw, Trash2, Check, X, Dumbbell, Clock, ShoppingBag, Pencil, Sparkles } from 'lucide-react'
import { ScaledMeal, ScaledIngredient, MealTiming } from '@/lib/kostschema/types'
import { RecipeSuggestionPanel } from './RecipeSuggestionPanel'

interface Recipe {
  name: string
  description: string
  instructions: string[]
  tips: string
  suggestedSpices: string[]
  cookingTime: string
}

interface MealCardProps {
  meal: ScaledMeal & { mealTiming?: MealTiming }
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
  onDeleteIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onUpdateGrams?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, grams: number) => void
  onUpdateName?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, name: string) => void
  onFindProducts?: (ingredientName: string, mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddTillagg?: (mealType: string, text: string) => void
  onRemoveTillagg?: (mealType: string, index: number) => void
  onAddSupplement?: (mealType: string, text: string) => void
  onRemoveSupplement?: (mealType: string, index: number) => void
}

// Simple text item for tillägg and kosttillskott
interface FreeTextItem {
  id: number
  text: string
}

function IngredientItem({
  ingredient,
  onSwap,
  onDelete,
  onUpdateGrams,
  onUpdateName,
  onFindProducts
}: {
  ingredient: ScaledIngredient
  onSwap: () => void
  onDelete?: () => void
  onUpdateGrams?: (grams: number) => void
  onUpdateName?: (name: string) => void
  onFindProducts?: () => void
}) {
  const [isEditingGrams, setIsEditingGrams] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editNameValue, setEditNameValue] = useState('')
  const gramsInputRef = useRef<HTMLInputElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingGrams && gramsInputRef.current) {
      gramsInputRef.current.focus()
      gramsInputRef.current.select()
    }
  }, [isEditingGrams])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  const handleGramsClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUpdateGrams) {
      setEditValue(Math.round(ingredient.scaledAmount).toString())
      setIsEditingGrams(true)
    }
  }

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUpdateName) {
      setEditNameValue(ingredient.name)
      setIsEditingName(true)
    }
  }

  const handleSaveGrams = () => {
    const newGrams = parseInt(editValue)
    if (!isNaN(newGrams) && newGrams > 0 && onUpdateGrams) {
      onUpdateGrams(newGrams)
    }
    setIsEditingGrams(false)
  }

  const handleSaveName = () => {
    if (editNameValue.trim() && onUpdateName) {
      onUpdateName(editNameValue.trim())
    }
    setIsEditingName(false)
  }

  const handleCancelEdit = () => {
    setIsEditingGrams(false)
    setIsEditingName(false)
  }

  const handleGramsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveGrams()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className="w-full flex items-center gap-1.5 px-2 py-2 bg-white hover:bg-zinc-50 rounded-lg transition-all group border border-transparent hover:border-zinc-200">
      {/* Swap button */}
      <button
        onClick={onSwap}
        className="p-1.5 rounded hover:bg-zinc-100 transition-colors"
        title="Byt ingrediens"
      >
        <RefreshCw className="h-3.5 w-3.5 text-zinc-400 group-hover:text-gold-600 transition-colors" />
      </button>

      {/* Grams + Name */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {isEditingGrams ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={gramsInputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleGramsKeyDown}
              onBlur={handleSaveGrams}
              className="w-16 px-1.5 py-0.5 text-sm bg-white border border-gold-500 rounded text-gold-600 font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              min="1"
            />
            <span className="text-sm text-gold-600 font-semibold">g</span>
          </div>
        ) : (
          <button
            onClick={handleGramsClick}
            className={`text-sm text-gold-600 font-semibold hover:bg-gold-100 px-1.5 py-0.5 rounded transition-colors ${onUpdateGrams ? 'cursor-pointer' : 'cursor-default'}`}
            title={onUpdateGrams ? 'Klicka för att ändra gram' : undefined}
          >
            {Math.round(ingredient.scaledAmount)}g
          </button>
        )}

        {isEditingName ? (
          <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={nameInputRef}
              type="text"
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={handleNameKeyDown}
              onBlur={handleSaveName}
              className="flex-1 px-1.5 py-0.5 text-sm bg-white border border-gold-500 rounded text-zinc-700 focus:outline-none"
            />
          </div>
        ) : (
          <button
            onClick={handleNameClick}
            className={`text-sm text-zinc-700 group-hover:text-zinc-900 truncate text-left ${onUpdateName ? 'hover:bg-zinc-100 px-1.5 py-0.5 rounded cursor-pointer' : ''}`}
            title={onUpdateName ? 'Klicka för att redigera namn' : undefined}
          >
            {ingredient.name}
          </button>
        )}
      </div>

      {/* Find products button */}
      {onFindProducts && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onFindProducts()
          }}
          className="p-1.5 rounded hover:bg-emerald-100 transition-colors opacity-0 group-hover:opacity-100"
          title="Hitta matchande produkter"
        >
          <ShoppingBag className="h-3.5 w-3.5 text-zinc-400 hover:text-emerald-600 transition-colors" />
        </button>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1.5 rounded hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
          title="Ta bort ingrediens"
        >
          <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-500 transition-colors" />
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
  onUpdateGrams,
  onUpdateName,
  onFindProducts
}: {
  title: string
  ingredients: ScaledIngredient[]
  category: 'protein' | 'kolhydrat' | 'fett'
  mealType: string
  color: 'rose' | 'blue' | 'amber'
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
  onDeleteIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onUpdateGrams?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, grams: number) => void
  onUpdateName?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, name: string) => void
  onFindProducts?: (ingredientName: string, mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
}) {
  const colorClasses = {
    rose: 'bg-rose-50 border-rose-200 text-rose-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600'
  }

  const headerColors = {
    rose: 'bg-rose-100 border-rose-200',
    blue: 'bg-blue-100 border-blue-200',
    amber: 'bg-amber-100 border-amber-200'
  }

  return (
    <div className={`rounded-xl overflow-hidden border ${colorClasses[color]}`}>
      {/* Header */}
      <div className={`px-3 py-2.5 border-b ${headerColors[color]}`}>
        <p className={`text-xs font-bold uppercase tracking-wider ${colorClasses[color].split(' ')[2]}`}>
          {title}
        </p>
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-0 bg-white/80">
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
              onUpdateName={onUpdateName ? (name) => onUpdateName(mealType, category, index, name) : undefined}
              onFindProducts={onFindProducts ? () => onFindProducts(ingredient.name, mealType, category, index) : undefined}
            />
          </div>
        ))}

        {ingredients.length === 0 && (
          <div className="py-3 text-sm text-zinc-400 italic text-center">Ingen källa</div>
        )}

        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="w-full flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-zinc-200 text-zinc-400 hover:text-gold-600 text-xs transition-colors py-1.5"
          >
            <Plus className="h-3 w-3" />
            <span>Lägg till alternativ</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Simple text input component for Tillägg and Kosttillskott
function FreeTextInput({
  placeholder,
  onAdd,
  color
}: {
  placeholder: string
  onAdd: (text: string) => void
  color: 'emerald' | 'purple'
}) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  const colorClass = color === 'emerald'
    ? 'focus:border-emerald-400 focus:ring-emerald-200'
    : 'focus:border-purple-400 focus:ring-purple-200'

  const buttonColor = color === 'emerald'
    ? 'text-emerald-600 hover:bg-emerald-100'
    : 'text-purple-600 hover:bg-purple-100'

  return (
    <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-200">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`flex-1 px-3 py-1.5 text-sm bg-white border border-zinc-300 rounded-lg text-zinc-800 placeholder:text-zinc-400 ${colorClass}`}
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        className={`px-3 py-1.5 rounded-lg transition-colors ${buttonColor} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}

export function MealCard({
  meal,
  onChangeIngredient,
  onAddIngredient,
  onDeleteIngredient,
  onUpdateGrams,
  onUpdateName,
  onFindProducts,
  onAddTillagg,
  onRemoveTillagg,
  onAddSupplement,
  onRemoveSupplement
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)

  // Fetch recipe suggestion from AI
  const fetchRecipeSuggestion = async () => {
    setIsLoadingRecipe(true)
    setRecipe(null)

    try {
      // Collect all ingredients from the meal
      const ingredients = [
        ...meal.template.kolhydrat.map(i => ({
          name: i.name,
          amount: Math.round(i.scaledAmount),
          category: 'kolhydrat' as const
        })),
        ...meal.template.protein.map(i => ({
          name: i.name,
          amount: Math.round(i.scaledAmount),
          category: 'protein' as const
        })),
        ...meal.template.fett.map(i => ({
          name: i.name,
          amount: Math.round(i.scaledAmount),
          category: 'fett' as const
        }))
      ]

      // Collect tillagg texts
      const tillagg = meal.tillaggItems?.map(item => item.text) || []

      const response = await fetch('/api/meals/suggest-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          tillagg,
          mealType: meal.type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recipe')
      }

      const data = await response.json()
      setRecipe(data.recipe)
    } catch (error) {
      console.error('Error fetching recipe:', error)
    } finally {
      setIsLoadingRecipe(false)
    }
  }

  // Determine card styling based on workout status
  const isPreWorkout = meal.mealTiming?.isPreWorkout
  const isPostWorkout = meal.mealTiming?.isPostWorkout

  const cardBorderClass = isPreWorkout
    ? 'border-2 border-emerald-400 shadow-emerald-500/20'
    : isPostWorkout
      ? 'border-2 border-blue-400 shadow-blue-500/20'
      : 'border border-zinc-200'

  return (
    <div className={`bg-zinc-100 rounded-2xl overflow-hidden shadow-lg ${cardBorderClass}`}>
      {/* Pre/Post workout banner */}
      {(isPreWorkout || isPostWorkout) && (
        <div className={`py-1.5 px-4 flex items-center justify-center gap-2 ${
          isPreWorkout
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
        }`}>
          <Dumbbell className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide">
            {isPreWorkout ? 'PRE-WORKOUT MÅLTID' : 'POST-WORKOUT MÅLTID'}
          </span>
          <Dumbbell className="w-4 h-4" />
        </div>
      )}

      {/* Header */}
      <button
        className="w-full cursor-pointer py-4 px-5 hover:bg-zinc-200/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-semibold text-zinc-800 text-lg">{meal.name}</div>
            {/* Recipe suggestion button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                fetchRecipeSuggestion()
              }}
              disabled={isLoadingRecipe}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 hover:from-amber-200 hover:to-orange-200 transition-all disabled:opacity-50"
              title="Fa receptforslag fran AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recept</span>
            </button>
            {/* Time indicator */}
            {meal.mealTiming && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3" />
                {meal.mealTiming.time}
              </span>
            )}
            {!meal.mealTiming && (
              <span className="text-xs text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-full">
                {meal.kcalPercent}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-5">
            {/* Macro pills with targets */}
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600 border border-orange-200">
                {meal.kcal} kcal
              </span>
              <div className="flex flex-col items-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-600">
                  P {meal.protein}g
                </span>
                {meal.mealTiming && (
                  <span className="text-[10px] text-rose-400 mt-0.5">
                    mål: {meal.mealTiming.proteinGrams}g
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                  K {meal.carbs}g
                </span>
                {meal.mealTiming && (
                  <span className="text-[10px] text-blue-400 mt-0.5">
                    mål: {meal.mealTiming.carbsGrams}g
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">
                  F {meal.fat}g
                </span>
                {meal.mealTiming && (
                  <span className="text-[10px] text-amber-400 mt-0.5">
                    mål: {meal.mealTiming.fatGrams}g
                  </span>
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
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
              onUpdateName={onUpdateName}
              onFindProducts={onFindProducts}
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
              onUpdateName={onUpdateName}
              onFindProducts={onFindProducts}
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
              onUpdateName={onUpdateName}
              onFindProducts={onFindProducts}
            />
          </div>

          {/* Tillägg (Grönsaker/Sallad/Sås) */}
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <div className="rounded-xl overflow-hidden border bg-emerald-50 border-emerald-200">
              <div className="px-3 py-2.5 border-b bg-emerald-100 border-emerald-200">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Tillägg (grönsaker/sallad/sås)
                </p>
              </div>
              <div className="p-2.5 bg-white/80">
                {meal.tillaggItems && meal.tillaggItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {meal.tillaggItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-xs text-emerald-700 font-medium"
                      >
                        <span>{item.text}</span>
                        {onRemoveTillagg && (
                          <button
                            onClick={() => onRemoveTillagg(meal.type, index)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-sm text-zinc-400 italic text-center">Inga tillägg</div>
                )}
                {onAddTillagg && (
                  <FreeTextInput
                    placeholder="t.ex. Sallad, 100g gurka, Sås..."
                    onAdd={(text) => onAddTillagg(meal.type, text)}
                    color="emerald"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Kosttillskott */}
          <div className="mt-3">
            <div className="rounded-xl overflow-hidden border bg-purple-50 border-purple-200">
              <div className="px-3 py-2.5 border-b bg-purple-100 border-purple-200">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                  Kosttillskott
                </p>
              </div>
              <div className="p-2.5 bg-white/80">
                {meal.supplementItems && meal.supplementItems.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {meal.supplementItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 border border-purple-200 rounded-full text-xs text-purple-700 font-medium"
                      >
                        <span>{item.text}</span>
                        {onRemoveSupplement && (
                          <button
                            onClick={() => onRemoveSupplement(meal.type, index)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-sm text-zinc-400 italic text-center">Inga kosttillskott</div>
                )}
                {onAddSupplement && (
                  <FreeTextInput
                    placeholder="t.ex. Omega-3 3st, Kreatin 5g..."
                    onAdd={(text) => onAddSupplement(meal.type, text)}
                    color="purple"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Recipe Suggestion Panel */}
          {(isLoadingRecipe || recipe) && (
            <RecipeSuggestionPanel
              recipe={recipe || { name: '', description: '', instructions: [], tips: '', suggestedSpices: [], cookingTime: '' }}
              isLoading={isLoadingRecipe}
              onClose={() => setRecipe(null)}
              onRefresh={fetchRecipeSuggestion}
            />
          )}
        </div>
      )}
    </div>
  )
}
