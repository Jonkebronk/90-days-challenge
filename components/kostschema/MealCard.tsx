'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, RefreshCw, Trash2, Check, X, Dumbbell, Clock, ShoppingBag, Pencil, Sparkles } from 'lucide-react'
import { ScaledMeal, ScaledIngredient, MealTiming } from '@/lib/kostschema/types'
import { RecipeSuggestionPanel } from './RecipeSuggestionPanel'

interface RecipeSuggestion {
  id: string
  name: string
  description: string
  estimatedMacros: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  }
  cookingTime: string
  difficulty: 'enkel' | 'medel' | 'avancerad'
  instructions: string[]
  tips: string
  seasonings: string[]
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
          className="p-1.5 rounded hover:bg-emerald-100 transition-colors"
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
          className="p-1.5 rounded hover:bg-red-100 transition-colors"
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
  const accentColors = {
    rose: 'bg-rose-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500'
  }

  const textColors = {
    rose: 'text-rose-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600'
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      {/* Colored accent line */}
      <div className={`h-1 ${accentColors[color]}`} />

      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-100">
        <p className={`text-xs font-medium uppercase tracking-wide ${textColors[color]}`}>
          {title}
        </p>
      </div>

      {/* Content */}
      <div className="p-2">
        {ingredients.map((ingredient, index) => (
          <div key={ingredient.id}>
            {index > 0 && (
              <div className="flex items-center gap-2 py-2">
                <div className="h-px flex-1 bg-zinc-200" />
                <span className="text-[10px] text-zinc-400 font-medium uppercase">eller</span>
                <div className="h-px flex-1 bg-zinc-200" />
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
          <div className="py-2 text-sm text-zinc-400 italic text-center">Ingen källa</div>
        )}

        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="w-full flex items-center justify-center gap-1 mt-2 pt-2 border-t border-zinc-100 text-zinc-400 hover:text-zinc-600 text-xs transition-colors py-1"
          >
            <Plus className="h-3 w-3" />
            <span>Lägg till</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Compact inline text input for Tillägg and Kosttillskott
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
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim())
      setValue('')
      setIsOpen(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setValue('')
    }
  }

  const buttonColor = color === 'emerald'
    ? 'text-emerald-500 hover:text-emerald-600'
    : 'text-purple-500 hover:text-purple-600'

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs ${buttonColor} hover:bg-zinc-100 rounded transition-colors`}
      >
        <Plus className="h-3 w-3" />
      </button>
    )
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        if (!value.trim()) setIsOpen(false)
      }}
      placeholder={placeholder}
      className="w-24 px-2 py-0.5 text-xs bg-white border border-zinc-300 rounded text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400"
    />
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
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([])
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)

  // Fetch recipe suggestions from AI
  const fetchRecipeSuggestion = async () => {
    setIsLoadingRecipe(true)
    setRecipes([])

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

      // Determine pre/post workout status
      const isPreWorkout = meal.mealTiming?.isPreWorkout || false
      const isPostWorkout = meal.mealTiming?.isPostWorkout || false

      const response = await fetch('/api/meals/suggest-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients,
          tillagg,
          mealType: meal.type,
          isPreWorkout,
          isPostWorkout
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recipes')
      }

      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setIsLoadingRecipe(false)
    }
  }

  // Determine card styling based on workout status
  const isPreWorkout = meal.mealTiming?.isPreWorkout
  const isPostWorkout = meal.mealTiming?.isPostWorkout

  const cardBorderClass = isPreWorkout
    ? 'border-l-4 border-l-emerald-500 border-y border-r border-zinc-200'
    : isPostWorkout
      ? 'border-l-4 border-l-blue-500 border-y border-r border-zinc-200'
      : 'border border-zinc-200'

  return (
    <div className={`bg-white rounded-xl overflow-hidden ${cardBorderClass}`}>
      {/* Pre/Post workout banner */}
      {(isPreWorkout || isPostWorkout) && (
        <div className={`py-1 px-4 flex items-center justify-center gap-2 ${
          isPreWorkout
            ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-100'
            : 'bg-blue-50 text-blue-700 border-b border-blue-100'
        }`}>
          <Dumbbell className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            {isPreWorkout ? 'Pre-workout' : 'Post-workout'}
          </span>
        </div>
      )}

      {/* Header */}
      <button
        className="w-full cursor-pointer py-3 px-4 hover:bg-zinc-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-medium text-zinc-900">{meal.name}</div>
            {/* Time indicator */}
            {meal.mealTiming && (
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="w-3 h-3" />
                {meal.mealTiming.time}
              </span>
            )}
            {/* Recipe suggestion button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                fetchRecipeSuggestion()
              }}
              disabled={isLoadingRecipe}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
              title="Få receptförslag från AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>Recept</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Macro display - cleaner */}
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-zinc-700">{meal.kcal} kcal</span>
              <span className="text-zinc-300">|</span>
              <span className="text-rose-600">P {meal.protein}g</span>
              <span className="text-blue-600">K {meal.carbs}g</span>
              <span className="text-amber-600">F {meal.fat}g</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
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

          {/* Tillägg & Kosttillskott - Compact inline */}
          <div className="mt-4 pt-3 border-t border-zinc-100 space-y-3">
            {/* Tillägg */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-emerald-600 font-medium shrink-0 pt-1">Tillägg:</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {meal.tillaggItems && meal.tillaggItems.length > 0 ? (
                  meal.tillaggItems.map((item, index) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs"
                    >
                      {item.text}
                      {onRemoveTillagg && (
                        <button
                          onClick={() => onRemoveTillagg(meal.type, index)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400 italic">Inga tillägg</span>
                )}
                {onAddTillagg && (
                  <FreeTextInput
                    placeholder="Lägg till..."
                    onAdd={(text) => onAddTillagg(meal.type, text)}
                    color="emerald"
                  />
                )}
              </div>
            </div>

            {/* Kosttillskott */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-purple-600 font-medium shrink-0 pt-1">Tillskott:</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {meal.supplementItems && meal.supplementItems.length > 0 ? (
                  meal.supplementItems.map((item, index) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
                    >
                      {item.text}
                      {onRemoveSupplement && (
                        <button
                          onClick={() => onRemoveSupplement(meal.type, index)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400 italic">Inga tillskott</span>
                )}
                {onAddSupplement && (
                  <FreeTextInput
                    placeholder="Lägg till..."
                    onAdd={(text) => onAddSupplement(meal.type, text)}
                    color="purple"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Recipe Suggestion Panel */}
          {(isLoadingRecipe || recipes.length > 0) && (
            <RecipeSuggestionPanel
              recipes={recipes}
              isLoading={isLoadingRecipe}
              onClose={() => setRecipes([])}
              onRefresh={fetchRecipeSuggestion}
            />
          )}
        </div>
      )}
    </div>
  )
}
