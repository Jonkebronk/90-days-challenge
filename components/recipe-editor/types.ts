// Shared types for recipe editor components

export interface FoodItem {
  id: string
  name: string
  categoryId?: string | null
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  commonServingSize?: string | null
  isRecommended: boolean
  notes?: string | null
  isApproved: boolean
  isVegetarian: boolean
  isVegan: boolean
  foodCategory?: {
    id: string
    name: string
    slug: string
    color: string
    icon: string
  } | null
}

export interface RecipeIngredient {
  id: string
  recipeId: string
  foodItemId: string
  foodItem?: FoodItem
  amount: number // Amount in grams
  displayUnit: string | null // "cups", "tbsp", "tsp", "pieces", "dl", "msk", "tsk"
  displayAmount: string | null // "1/2", "2", "3"
  orderIndex: number
  optional: boolean
  notes: string | null // "chopped", "diced", "melted"
}

export interface RecipeInstruction {
  id: string
  recipeId: string
  stepNumber: number
  instruction: string
  duration: number | null // Optional time in minutes
  imageUrl: string | null
}

export interface RecipeNutrition {
  caloriesPerServing: number
  proteinPerServing: number
  carbsPerServing: number
  fatPerServing: number
}

export interface RecipeFormData {
  title: string
  description: string | null
  categoryId: string
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  difficulty: string | null // "easy", "medium", "hard"
  cuisineType: string | null
  mealType: string | null // "breakfast", "lunch", "dinner", "snack", "dessert"
  coverImage: string | null
  videoUrl: string | null
  dietaryTags: string[] // ["vegan", "vegetarian", "gluten-free", etc.]
  published: boolean

  // Nutrition (auto-calculated or manual)
  caloriesPerServing: number | null
  proteinPerServing: number | null
  carbsPerServing: number | null
  fatPerServing: number | null
}

export interface Recipe extends RecipeFormData {
  id: string
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  ingredients: RecipeIngredient[]
  instructions: RecipeInstruction[]
}

// Display units for Swedish cooking
export const DISPLAY_UNITS = [
  { value: 'g', label: 'gram (g)' },
  { value: 'kg', label: 'kilogram (kg)' },
  { value: 'ml', label: 'milliliter (ml)' },
  { value: 'dl', label: 'deciliter (dl)' },
  { value: 'l', label: 'liter (l)' },
  { value: 'msk', label: 'matsked (msk)' },
  { value: 'tsk', label: 'tesked (tsk)' },
  { value: 'krm', label: 'kryddmått (krm)' },
  { value: 'st', label: 'styck (st)' },
  { value: 'burk', label: 'burk' },
  { value: 'påse', label: 'påse' },
]

// Dietary tags
export const DIETARY_TAGS = [
  { value: 'vegetarian', label: 'Vegetarisk' },
  { value: 'vegan', label: 'Vegansk' },
  { value: 'gluten-free', label: 'Glutenfri' },
  { value: 'dairy-free', label: 'Mjölkfri' },
  { value: 'low-carb', label: 'Låg kolhydrat' },
  { value: 'high-protein', label: 'Hög protein' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
]

// Meal types
export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Frukost' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Middag' },
  { value: 'snack', label: 'Mellanmål' },
  { value: 'dessert', label: 'Efterrätt' },
]

// Difficulty levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy', label: 'Lätt' },
  { value: 'medium', label: 'Medel' },
  { value: 'hard', label: 'Svår' },
]
