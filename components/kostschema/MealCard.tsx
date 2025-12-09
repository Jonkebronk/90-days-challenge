'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, RefreshCw, Trash2, X, Dumbbell, Clock, ShoppingBag, Pencil, Sparkles, Utensils } from 'lucide-react'
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
  onUpdateMealName?: (mealType: string, name: string) => void
  onUpdateInstructions?: (mealType: string, instructions: string) => void
  instructions?: string
}

// Circular macro badge component
function MacroBadge({ label, value, color }: { label: string, value: number, color: 'green' | 'red' | 'blue' | 'amber' }) {
  const colorClasses = {
    green: 'bg-emerald-500 text-white',
    red: 'bg-rose-500 text-white',
    blue: 'bg-blue-500 text-white',
    amber: 'bg-amber-500 text-white'
  }

  return (
    <div className="flex items-center gap-1">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${colorClasses[color]}`}>
        {label}
      </div>
      <span className="text-sm text-zinc-200">{value}</span>
    </div>
  )
}

// Ingredient item with edit capabilities
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
    if (e.key === 'Enter') handleSaveGrams()
    else if (e.key === 'Escape') handleCancelEdit()
  }

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName()
    else if (e.key === 'Escape') handleCancelEdit()
  }

  return (
    <div className="flex items-center gap-2 py-1.5 group">
      {/* Bullet point */}
      <span className="text-zinc-400 text-lg leading-none">•</span>

      {/* Grams */}
      {isEditingGrams ? (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <input
            ref={gramsInputRef}
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleGramsKeyDown}
            onBlur={handleSaveGrams}
            className="w-14 px-1 py-0.5 text-sm bg-white border border-amber-400 rounded text-zinc-800 font-medium focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min="1"
          />
          <span className="text-sm text-zinc-600">g</span>
        </div>
      ) : (
        <button
          onClick={handleGramsClick}
          className={`text-sm text-zinc-700 font-medium hover:bg-zinc-100 px-1 rounded transition-colors ${onUpdateGrams ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {Math.round(ingredient.scaledAmount)}g
        </button>
      )}

      {/* Name */}
      {isEditingName ? (
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <input
            ref={nameInputRef}
            type="text"
            value={editNameValue}
            onChange={(e) => setEditNameValue(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={handleSaveName}
            className="w-full px-1 py-0.5 text-sm bg-white border border-amber-400 rounded text-zinc-800 focus:outline-none"
          />
        </div>
      ) : (
        <button
          onClick={handleNameClick}
          className={`flex-1 text-sm text-zinc-700 text-left hover:bg-zinc-100 px-1 rounded transition-colors ${onUpdateName ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {ingredient.name}
        </button>
      )}

      {/* Action buttons - visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onSwap} className="p-1 rounded hover:bg-zinc-100" title="Byt ingrediens">
          <RefreshCw className="h-3.5 w-3.5 text-zinc-400 hover:text-amber-600" />
        </button>
        {onFindProducts && (
          <button onClick={(e) => { e.stopPropagation(); onFindProducts() }} className="p-1 rounded hover:bg-zinc-100" title="Hitta produkter">
            <ShoppingBag className="h-3.5 w-3.5 text-zinc-400 hover:text-emerald-600" />
          </button>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1 rounded hover:bg-zinc-100" title="Ta bort">
            <Trash2 className="h-3.5 w-3.5 text-zinc-400 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  )
}

// Category card (PROTEIN, KOLHYDRATER, FETT)
function CategoryCard({
  title,
  ingredients,
  category,
  mealType,
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
  onChangeIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onAddIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett') => void
  onDeleteIngredient?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
  onUpdateGrams?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, grams: number) => void
  onUpdateName?: (mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number, name: string) => void
  onFindProducts?: (ingredientName: string, mealType: string, category: 'protein' | 'kolhydrat' | 'fett', index: number) => void
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Gray header */}
      <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200">
        <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">{title}</h4>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {ingredients.length === 0 ? (
          <p className="text-sm text-zinc-400 italic">Ingen källa vald</p>
        ) : (
          ingredients.map((ingredient, index) => (
            <div key={ingredient.id}>
              {/* ELLER divider */}
              {index > 0 && (
                <div className="flex items-center gap-3 py-2 my-1">
                  <div className="h-px flex-1 bg-zinc-200" />
                  <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">ELLER</span>
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
          ))
        )}

        {/* Add button */}
        {onAddIngredient && (
          <button
            onClick={() => onAddIngredient(mealType, category)}
            className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-100 text-zinc-400 hover:text-zinc-600 text-xs transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Lägg till alternativ</span>
          </button>
        )}
      </div>
    </div>
  )
}

// Instructions card
function InstructionsCard({
  instructions,
  onUpdate
}: {
  instructions: string
  onUpdate?: (text: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(instructions)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editValue)
    }
    setIsEditing(false)
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Gray header */}
      <div className="bg-zinc-100 px-4 py-2.5 border-b border-zinc-200 flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">INSTRUKTIONER</h4>
        {onUpdate && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-zinc-200">
            <Pencil className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 text-sm border border-zinc-300 rounded-lg text-zinc-700 focus:outline-none focus:border-amber-400 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
              >
                Spara
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditValue(instructions) }}
                className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700"
              >
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600 leading-relaxed">
            {instructions || 'Du tar en råvara från varje angiven källa och gör en måltid.'}
          </p>
        )}
      </div>
    </div>
  )
}

// Free text input for tillägg and supplements
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
    if (e.key === 'Enter') handleAdd()
    else if (e.key === 'Escape') { setIsOpen(false); setValue('') }
  }

  const buttonColor = color === 'emerald'
    ? 'text-emerald-500 hover:text-emerald-600'
    : 'text-purple-500 hover:text-purple-600'

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 0) }}
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
      onBlur={() => { if (!value.trim()) setIsOpen(false) }}
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
  onRemoveSupplement,
  onUpdateMealName,
  onUpdateInstructions,
  instructions = ''
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditingMealName, setIsEditingMealName] = useState(false)
  const [mealNameValue, setMealNameValue] = useState(meal.name)
  const [recipes, setRecipes] = useState<RecipeSuggestion[]>([])
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)
  const mealNameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingMealName && mealNameInputRef.current) {
      mealNameInputRef.current.focus()
      mealNameInputRef.current.select()
    }
  }, [isEditingMealName])

  // Count recipe suggestions
  const recipeCount = recipes.length

  // Fetch recipe suggestions from AI
  const fetchRecipeSuggestion = async () => {
    setIsLoadingRecipe(true)
    setRecipes([])

    try {
      const ingredients = [
        ...meal.template.kolhydrat.map(i => ({ name: i.name, amount: Math.round(i.scaledAmount), category: 'kolhydrat' as const })),
        ...meal.template.protein.map(i => ({ name: i.name, amount: Math.round(i.scaledAmount), category: 'protein' as const })),
        ...meal.template.fett.map(i => ({ name: i.name, amount: Math.round(i.scaledAmount), category: 'fett' as const }))
      ]
      const tillagg = meal.tillaggItems?.map(item => item.text) || []
      const isPreWorkout = meal.mealTiming?.isPreWorkout || false
      const isPostWorkout = meal.mealTiming?.isPostWorkout || false

      const response = await fetch('/api/meals/suggest-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, tillagg, mealType: meal.type, isPreWorkout, isPostWorkout })
      })

      if (!response.ok) throw new Error('Failed to fetch recipes')
      const data = await response.json()
      setRecipes(data.recipes || [])
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setIsLoadingRecipe(false)
    }
  }

  const handleSaveMealName = () => {
    if (mealNameValue.trim() && onUpdateMealName) {
      onUpdateMealName(meal.type, mealNameValue.trim())
    }
    setIsEditingMealName(false)
  }

  // Determine card styling based on workout status
  const isPreWorkout = meal.mealTiming?.isPreWorkout
  const isPostWorkout = meal.mealTiming?.isPostWorkout

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      {/* Pre/Post workout banner */}
      {(isPreWorkout || isPostWorkout) && (
        <div className={`py-1.5 px-4 flex items-center justify-center gap-2 ${
          isPreWorkout
            ? 'bg-emerald-500/10 text-emerald-400 border-b border-emerald-500/20'
            : 'bg-blue-500/10 text-blue-400 border-b border-blue-500/20'
        }`}>
          <Dumbbell className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            {isPreWorkout ? 'Pre-workout' : 'Post-workout'}
          </span>
        </div>
      )}

      {/* Header */}
      <button
        className="w-full cursor-pointer py-4 px-5 hover:bg-zinc-800/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          {/* Left side: Icon + Name + Recipe count */}
          <div className="flex items-center gap-3">
            <Utensils className="w-5 h-5 text-amber-500" />

            {isEditingMealName ? (
              <input
                ref={mealNameInputRef}
                type="text"
                value={mealNameValue}
                onChange={(e) => setMealNameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveMealName(); else if (e.key === 'Escape') setIsEditingMealName(false) }}
                onBlur={handleSaveMealName}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 text-lg font-semibold bg-zinc-800 border border-amber-500 rounded text-white focus:outline-none"
              />
            ) : (
              <span
                onClick={(e) => { if (onUpdateMealName) { e.stopPropagation(); setIsEditingMealName(true) } }}
                className={`text-lg font-semibold text-white ${onUpdateMealName ? 'cursor-text hover:text-amber-400' : ''}`}
              >
                {meal.name}
              </span>
            )}

            {recipeCount > 0 && (
              <span className="text-sm text-zinc-500">({recipeCount} recept)</span>
            )}

            {/* Recipe button */}
            <button
              onClick={(e) => { e.stopPropagation(); fetchRecipeSuggestion() }}
              disabled={isLoadingRecipe}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-amber-500 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
              title="Få receptförslag från AI"
            >
              <Sparkles className="w-3 h-3" />
              <span>Recept</span>
            </button>
          </div>

          {/* Right side: Macro badges + Chevron */}
          <div className="flex items-center gap-4">
            {/* Circular macro badges */}
            <div className="flex items-center gap-3">
              <MacroBadge label="K" value={meal.kcal} color="green" />
              <MacroBadge label="P" value={meal.protein} color="red" />
              <MacroBadge label="F" value={meal.fat} color="blue" />
              <MacroBadge label="C" value={meal.carbs} color="amber" />
            </div>

            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {/* Instructions card */}
          <InstructionsCard
            instructions={instructions}
            onUpdate={onUpdateInstructions ? (text) => onUpdateInstructions(meal.type, text) : undefined}
          />

          {/* Category cards - vertical stack */}
          <CategoryCard
            title="PROTEIN"
            ingredients={meal.template.protein}
            category="protein"
            mealType={meal.type}
            onChangeIngredient={onChangeIngredient}
            onAddIngredient={onAddIngredient}
            onDeleteIngredient={onDeleteIngredient}
            onUpdateGrams={onUpdateGrams}
            onUpdateName={onUpdateName}
            onFindProducts={onFindProducts}
          />

          <CategoryCard
            title="KOLHYDRATER"
            ingredients={meal.template.kolhydrat}
            category="kolhydrat"
            mealType={meal.type}
            onChangeIngredient={onChangeIngredient}
            onAddIngredient={onAddIngredient}
            onDeleteIngredient={onDeleteIngredient}
            onUpdateGrams={onUpdateGrams}
            onUpdateName={onUpdateName}
            onFindProducts={onFindProducts}
          />

          <CategoryCard
            title="FETT"
            ingredients={meal.template.fett}
            category="fett"
            mealType={meal.type}
            onChangeIngredient={onChangeIngredient}
            onAddIngredient={onAddIngredient}
            onDeleteIngredient={onDeleteIngredient}
            onUpdateGrams={onUpdateGrams}
            onUpdateName={onUpdateName}
            onFindProducts={onFindProducts}
          />

          {/* Tillägg & Kosttillskott */}
          <div className="pt-3 border-t border-zinc-700 space-y-3">
            {/* Tillägg */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-emerald-400 font-medium shrink-0 pt-1">Tillägg:</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {meal.tillaggItems && meal.tillaggItems.length > 0 ? (
                  meal.tillaggItems.map((item, index) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-xs"
                    >
                      {item.text}
                      {onRemoveTillagg && (
                        <button onClick={() => onRemoveTillagg(meal.type, index)} className="hover:text-red-400">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">Inga tillägg</span>
                )}
                {onAddTillagg && (
                  <FreeTextInput placeholder="Lägg till..." onAdd={(text) => onAddTillagg(meal.type, text)} color="emerald" />
                )}
              </div>
            </div>

            {/* Kosttillskott */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-purple-400 font-medium shrink-0 pt-1">Tillskott:</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {meal.supplementItems && meal.supplementItems.length > 0 ? (
                  meal.supplementItems.map((item, index) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                    >
                      {item.text}
                      {onRemoveSupplement && (
                        <button onClick={() => onRemoveSupplement(meal.type, index)} className="hover:text-red-400">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">Inga tillskott</span>
                )}
                {onAddSupplement && (
                  <FreeTextInput placeholder="Lägg till..." onAdd={(text) => onAddSupplement(meal.type, text)} color="purple" />
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
