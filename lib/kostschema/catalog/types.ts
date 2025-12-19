// Kostschema Catalog Types

export interface CatalogCategory {
  id: string
  name: string
  description: string
  icon?: string
}

export interface CatalogFoodItem {
  name: string
  amountG: number
  protein: number
  carbs: number
  fat: number
  kcal: number
  category: 'protein' | 'kolhydrat' | 'fett' | 'grönsak' | 'tillskott'
}

export interface CatalogMeal {
  id: string
  name: string
  time: string
  foods: CatalogFoodItem[]
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalKcal: number
}

export interface CatalogSchema {
  id: string
  name: string
  categoryId: string
  calorieLevel: number
  description?: string
  meals: CatalogMeal[]
  totals: {
    protein: number
    carbs: number
    fat: number
    kcal: number
  }
}

export interface ScaledCatalogSchema extends CatalogSchema {
  scaleFactor: number
  originalTotals: {
    protein: number
    carbs: number
    fat: number
    kcal: number
  }
}

// API response types (from database)
export interface ApiCatalogFood {
  id: string
  mealId: string
  name: string
  amountG: number
  category: string
  protein: number
  carbs: number
  fat: number
  kcal: number
  orderIndex: number
}

export interface ApiCatalogMeal {
  id: string
  schemaId: string
  name: string
  time: string
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalKcal: number
  orderIndex: number
  foods: ApiCatalogFood[]
}

export interface ApiCatalogSchema {
  id: string
  categoryId: string
  name: string
  description?: string | null
  calorieLevel: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalKcal: number
  isActive: boolean
  orderIndex: number
  meals: ApiCatalogMeal[]
  category?: { id: string; name: string }
}

export interface ApiCatalogCategory {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  orderIndex: number
  schemas?: ApiCatalogSchema[]
  _count?: { schemas: number }
}

// Helper functions to convert between API and component types
export function mapApiSchemaToSchema(apiSchema: ApiCatalogSchema): CatalogSchema {
  return {
    id: apiSchema.id,
    name: apiSchema.name,
    categoryId: apiSchema.categoryId,
    calorieLevel: apiSchema.calorieLevel,
    description: apiSchema.description || undefined,
    totals: {
      protein: apiSchema.totalProtein,
      carbs: apiSchema.totalCarbs,
      fat: apiSchema.totalFat,
      kcal: apiSchema.totalKcal,
    },
    meals: (apiSchema.meals || []).map((meal) => ({
      id: meal.id,
      name: meal.name,
      time: meal.time,
      totalProtein: meal.totalProtein,
      totalCarbs: meal.totalCarbs,
      totalFat: meal.totalFat,
      totalKcal: meal.totalKcal,
      foods: (meal.foods || []).map((food) => ({
        name: food.name,
        amountG: food.amountG,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        kcal: food.kcal,
        category: food.category as CatalogFoodItem['category'],
      })),
    })),
  }
}

export function mapApiCategoryToCategory(apiCat: ApiCatalogCategory): CatalogCategory {
  return {
    id: apiCat.id,
    name: apiCat.name,
    description: apiCat.description || '',
    icon: apiCat.icon || undefined,
  }
}
