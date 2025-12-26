// Meal Types for Deviation Modal

// Meal categories
export type QuickTrackCategory = 'protein' | 'carb' | 'fat' | 'vegetable' | 'sauce';

// Portion sizes
export type PortionSize = 'small' | 'normal' | 'large' | 'extra' | 'custom';

// Meal types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Confidence levels
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Data sources
export type DataSource = 'database_match' | 'ai_only' | 'hybrid' | 'quick_track';

// Selected component (in UI state)
export interface SelectedComponent {
  category: QuickTrackCategory;
  foodItemId: string;
  foodItemName: string;
  portionSize: PortionSize;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Nutrition estimate
export interface NutritionEstimate {
  kcal: number;
  kcalMin?: number;
  kcalMax?: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

// AI Analysis Types
export interface AIFoodItem {
  name: string;
  estimatedGrams: number;
  confidence: ConfidenceLevel;
  nutrition: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  matchedCategory?: QuickTrackCategory;
  matchedItemId?: string;
}

export interface AIAnalysisResult {
  success: boolean;
  items: AIFoodItem[];
  totalNutrition: NutritionEstimate;
  confidence: ConfidenceLevel;
  dataSource: DataSource;
  reasoning?: string;
  suggestions?: string[];
}
