// Social Meal Types

// Meal categories
export type QuickTrackCategory = 'protein' | 'carb' | 'fat' | 'vegetable' | 'sauce';

// Portion sizes
export type PortionSize = 'small' | 'normal' | 'large' | 'extra' | 'custom';

// Meal types
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// Social contexts
export type SocialContext =
  | 'family'
  | 'friends'
  | 'restaurant'
  | 'work'
  | 'takeaway'
  | 'party'
  | 'date'
  | 'solo'
  | 'other';

// Input methods
export type InputMethod = 'quick_track' | 'text' | 'image' | 'both';

// Data sources
export type DataSource = 'database_match' | 'ai_only' | 'hybrid' | 'quick_track';

// Confidence levels
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// Portion definition
export interface Portion {
  size: PortionSize;
  grams: number;
  kcal: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

// Quick track food item
export interface QuickTrackFoodItem {
  id: string;
  name: string;
  portions: Portion[];
  // Per 100g values for custom portions
  per100g: {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Quick track category definition
export interface QuickTrackCategoryDef {
  icon: string;
  label: string;
  color: string;
  commonItems: QuickTrackFoodItem[];
}

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

// Family dinner preset
export interface FamilyDinnerPreset {
  id: string;
  name: string;
  description: string;
  components: {
    categoryId: QuickTrackCategory;
    itemId: string;
    portion: PortionSize;
  }[];
  totalNutrition: NutritionEstimate;
  tags?: string[]; // e.g., 'husmanskost', 'fisk', 'vegetariskt', 'snabb'
}

// Social meal (for API/DB)
export interface SocialMealCreate {
  mealType: MealType;
  socialContext?: SocialContext;
  inputMethod: InputMethod;
  kcal: number;
  kcalMin?: number;
  kcalMax?: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence?: ConfidenceLevel;
  dataSource: DataSource;
  presetDinnerId?: string;
  presetDinnerName?: string;
  notes?: string;
  components: Omit<SelectedComponent, 'category'>[];
}

// Saved meal (for API/DB)
export interface SavedMealCreate {
  name: string;
  description?: string;
  components: SelectedComponent[];
  totalNutrition: NutritionEstimate;
}

// User meal patterns (for AI learning)
export interface UserMealPatterns {
  frequentMeals: {
    mealHash: string;
    frequency: number;
    lastUsed: Date;
    averageNutrition: NutritionEstimate;
  }[];
  portionPreferences: Partial<Record<QuickTrackCategory, PortionSize>>;
  mealTimings: {
    weekdayDinner: string[]; // Time strings
    weekendDinner: string[];
  };
}

// Feedback accuracy options
export type FeedbackAccuracy = 'too_low' | 'about_right' | 'too_high';

// Meal feedback for AI calibration
export interface MealFeedback {
  mealId: string;
  accuracy: FeedbackAccuracy;
  adjustedValues?: Partial<NutritionEstimate>;
}

// Extended feedback with original values
export interface MealFeedbackCreate {
  socialMealId: string;
  accuracy: FeedbackAccuracy;
  adjustedKcal?: number;
  adjustedProtein?: number;
  adjustedCarbs?: number;
  adjustedFat?: number;
  originalKcal: number;
  originalProtein: number;
  originalCarbs: number;
  originalFat: number;
  notes?: string;
}

// User calibration data
export interface UserCalibration {
  kcalMultiplier: number;
  proteinMultiplier: number;
  carbsMultiplier: number;
  fatMultiplier: number;
  categoryAdjustments?: Record<QuickTrackCategory, number>;
  defaultPortionSize: PortionSize;
  feedbackCount: number;
  lastCalibratedAt?: string;
  confidenceScore?: number;
}

// AI Analysis Types
export interface AIAnalysisRequest {
  text?: string;
  imageBase64?: string;
  mealType?: MealType;
  socialContext?: SocialContext;
}

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

// API response types
export interface SocialMealResponse {
  id: string;
  userId: string;
  timestamp: string;
  mealType: MealType;
  socialContext?: SocialContext;
  inputMethod: InputMethod;
  kcal: number;
  kcalMin?: number;
  kcalMax?: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  confidence?: ConfidenceLevel;
  dataSource: DataSource;
  presetDinnerId?: string;
  presetDinnerName?: string;
  notes?: string;
  userAdjusted: boolean;
  components: {
    id: string;
    category: QuickTrackCategory;
    foodItemId: string;
    foodItemName: string;
    portionSize: PortionSize;
    grams: number;
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
  createdAt: string;
}

export interface SavedMealResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  components: SelectedComponent[];
  totalNutrition: NutritionEstimate;
  useCount: number;
  lastUsedAt?: string;
  createdAt: string;
}
