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
