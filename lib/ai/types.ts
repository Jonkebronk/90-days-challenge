/**
 * Typer för AI Kostplaneringsagenten
 *
 * Kopplar samman:
 * - Din egen livsmedelsbank (Product) - 375 produkter
 * - Receptbanken (Recipe) - 314 recept
 * - Livsmedelsverket (SLV) - 2575 livsmedel med mikronutrienter
 * - Kostplanssystemet (ClientNutritionPlan)
 */

// ============================================================================
// MEDDELANDEN & KONVERSATION
// ============================================================================

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  reasoning?: string; // Chain-of-thought från <reasoning> tags
  images?: string[]; // Base64 eller URL:er till bilder
}

export interface AIConversationHistory {
  messages: AIMessage[];
  nutritionPlanId: string;
}

// ============================================================================
// FEEDBACK
// ============================================================================

export type FeedbackTyp = 'bra' | 'kan_forbattras' | 'fel';

export interface AIFeedbackInput {
  nutritionPlanId: string;
  messageIndex: number;
  rating: 1 | 2 | 3 | 4 | 5;
  typ: FeedbackTyp;
  kommentar?: string;
}

// ============================================================================
// KLIENTMINNE (Mem0-stil)
// ============================================================================

export interface ClientMemory {
  preferenser: string[]; // "gillar fisk", "hatar broccoli"
  framgangsrika: string[]; // Kombinationer som fungerat
  undvikMonster: string[]; // "stor måltid före träning = magproblem"
}

// ============================================================================
// COACH-INSTÄLLNINGAR
// ============================================================================

export interface CoachAISettingsInput {
  // Makroregler
  proteinMinPerKg: number; // 1.6
  proteinMaxPerKg: number; // 2.5
  fettMinPerKg: number; // 0.7

  // Kolhydratfördelning (procent, summa ~1.0)
  kolhydratPreWorkout: number; // 0.22
  kolhydratPostWorkout: number; // 0.32
  kolhydratKvallsmal: number; // 0.18

  // Fettfördelning (procent)
  fettPreWorkout: number; // 0.10
  fettPostWorkout: number; // 0.10
  fettKvallsmal: number; // 0.40

  // Favoriter (produkt-IDs)
  favoritProteinkallor: string[];
  favoritKolhydratkallor: string[];
  favoritFettkallor: string[];
  undviknaLivsmedel: string[];

  // AI-stil
  ton: 'avslappnad' | 'professionell' | 'motiverande';
  detaljniva: 'kortfattad' | 'detaljerad' | 'utforlig';
  extraInstruktioner?: string;
}

export const DEFAULT_COACH_SETTINGS: CoachAISettingsInput = {
  proteinMinPerKg: 1.6,
  proteinMaxPerKg: 2.5,
  fettMinPerKg: 0.7,
  kolhydratPreWorkout: 0.22,
  kolhydratPostWorkout: 0.32,
  kolhydratKvallsmal: 0.18,
  fettPreWorkout: 0.1,
  fettPostWorkout: 0.1,
  fettKvallsmal: 0.4,
  favoritProteinkallor: [],
  favoritKolhydratkallor: [],
  favoritFettkallor: [],
  undviknaLivsmedel: [],
  ton: 'professionell',
  detaljniva: 'detaljerad',
};

// ============================================================================
// PROMPT CONTEXT
// ============================================================================

export interface ProductForPrompt {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
}

export interface RecipeForPrompt {
  id: string;
  title: string;
  prepTimeMinutes: number;
  proteinPerServing: number;
  carbsPerServing: number;
  fatPerServing: number;
  kcalPerServing: number;
  category: string;
}

// ============================================================================
// LIVSMEDELSVERKET (SLV) - 2575 livsmedel med mikronutrienter
// ============================================================================

export interface SlvFoodForPrompt {
  nummer: number;
  namn: string;
  typ: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
  sugar: number | null;
  salt: number | null;
  saturatedFat: number | null;
  // Vitaminer
  vitaminA: number | null; // µg
  vitaminD: number | null; // µg
  vitaminC: number | null; // mg
  vitaminB12: number | null; // µg
  folate: number | null; // µg
  // Mineraler
  calcium: number | null; // mg
  iron: number | null; // mg
  magnesium: number | null; // mg
  potassium: number | null; // mg
  zinc: number | null; // mg
  iodine: number | null; // µg
}

export interface SlvDataForPrompt {
  totalCount: number;
  categories: Record<string, SlvFoodForPrompt[]>;
}

// Rekommenderade dagliga intag (RDI) för mikronutrienter
export interface RDI {
  vitaminA: number; // 900 µg (män), 700 µg (kvinnor)
  vitaminD: number; // 10 µg
  vitaminC: number; // 90 mg (män), 75 mg (kvinnor)
  vitaminB12: number; // 2.4 µg
  folate: number; // 400 µg
  calcium: number; // 800 mg
  iron: number; // 9 mg (män), 15 mg (kvinnor)
  magnesium: number; // 350 mg (män), 280 mg (kvinnor)
  potassium: number; // 3500 mg
  zinc: number; // 9 mg (män), 7 mg (kvinnor)
  iodine: number; // 150 µg
}

export const RDI_MAN: RDI = {
  vitaminA: 900,
  vitaminD: 10,
  vitaminC: 90,
  vitaminB12: 2.4,
  folate: 400,
  calcium: 800,
  iron: 9,
  magnesium: 350,
  potassium: 3500,
  zinc: 9,
  iodine: 150,
};

export const RDI_KVINNA: RDI = {
  vitaminA: 700,
  vitaminD: 10,
  vitaminC: 75,
  vitaminB12: 2.4,
  folate: 400,
  calcium: 800,
  iron: 15,
  magnesium: 280,
  potassium: 3500,
  zinc: 7,
  iodine: 150,
};

// Mikronutrient-intag för en dag
export interface MicronutrientIntake {
  vitaminA: number;
  vitaminD: number;
  vitaminC: number;
  vitaminB12: number;
  folate: number;
  calcium: number;
  iron: number;
  magnesium: number;
  potassium: number;
  zinc: number;
  iodine: number;
}

// Status för enskild mikronutrient
export interface MicronutrientStatus {
  name: string;
  intake: number;
  rdi: number;
  unit: string;
  percentOfRdi: number;
  status: 'low' | 'ok' | 'high';
}

export interface ClientDataForPrompt {
  name: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  allergies?: string;
  dislikedFood?: string;
}

export interface NutritionPlanForPrompt {
  id: string;
  weight: number;
  calorieGoal: string | null;
  dailyCalorieTarget: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  mealsPerDay: number;
  workoutTime: string | null;
  nutritionSystem: string;
}

export interface PromptContext {
  client: ClientDataForPrompt;
  plan: NutritionPlanForPrompt;
  products: ProductForPrompt[];
  recipes: RecipeForPrompt[];
  slvFoods: SlvFoodForPrompt[]; // Livsmedelsverkets databas
  settings: CoachAISettingsInput;
  memory: ClientMemory | null;
}

// ============================================================================
// VALIDERING (Virtual Nutritionist)
// ============================================================================

export interface GeneratedMealItem {
  foodId: string;
  foodName: string;
  grams: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    kcal: number;
  };
}

export interface GeneratedMeal {
  mealNumber: number;
  mealType: string;
  items: GeneratedMealItem[];
  actualMacros: {
    protein: number;
    carbs: number;
    fat: number;
    kcal: number;
  };
}

export interface ValidationResult {
  godkant: boolean;
  problem: string[];
  suggestions: string[];
}

// ============================================================================
// API REQUEST/RESPONSE
// ============================================================================

export interface ImageAttachment {
  base64: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
}

export interface AIChatRequest {
  nutritionPlanId: string;
  message: string;
  images?: ImageAttachment[];
  includeHistory?: boolean;
}

export interface AIChatResponse {
  response: string;
  reasoning: string | null;
  generatedMeals?: GeneratedMeal[];
  validation?: ValidationResult;
}

export interface AIFeedbackRequest {
  nutritionPlanId: string;
  messageIndex: number;
  rating: number;
  typ: string;
  kommentar?: string;
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

export interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Generera schema',
    prompt: 'Generera ett komplett kostschema för hela dagen baserat på mina makromål.',
    icon: 'wand',
  },
  {
    label: 'Frukostalternativ',
    prompt: 'Ge mig 3 frukostalternativ med cirka 30g protein.',
    icon: 'coffee',
  },
  {
    label: 'Snabba luncher',
    prompt: 'Föreslå luncher som tar under 20 minuter att laga.',
    icon: 'clock',
  },
  {
    label: 'Kvällsmål',
    prompt: 'Ge mig kvällsmål med hög mättnad och bra protein.',
    icon: 'moon',
  },
];
