/**
 * AI Coaching Service
 * Automatiserar kalori- och makroberäkningar för 90-dagars challenge
 * Integreras med Next.js 15 + Prisma + PostgreSQL
 */

// ============================================
// TYPDEFINITIONER
// ============================================

export interface ApplicationData {
  // Personuppgifter
  fullName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  age: number;
  gender: 'man' | 'kvinna';
  height: number; // cm
  currentWeight: number; // kg

  // Träningsprogram
  currentTraining?: string;
  trainingExperience?: string;
  trainingGoal?: string;
  injuries?: string;
  availableTime?: string;
  preferredSchedule?: string;

  // Näring
  dietHistory?: string;
  macroExperience?: string;
  digestionIssues?: string;
  allergies?: string;
  favoriteFood?: string;
  dislikedFood?: string;
  supplements?: string;
  previousCoaching?: string;

  // Livsstil
  stressLevel?: string;
  sleepHours?: string;
  occupation?: string;
  lifestyle?: string;

  // Motivation
  whyJoin?: string;
  canFollowPlan?: string;
  expectations?: string;
  biggestChallenges?: string;

  // Bilder
  frontPhoto?: string;
  sidePhoto?: string;
  backPhoto?: string;
}

export interface CalculatedPlan {
  // Kaloriverktyg
  calories: {
    bmr: number;
    tdee: number;
    deficit: number;
    baseline: number;
    totalIntake: number;
  };

  // Makronutrienter
  macros: {
    protein: number; // gram
    fat: number; // gram
    carbs: number; // gram
    proteinCalories: number;
    fatCalories: number;
    carbCalories: number;
  };

  // Måltidsfördelning
  mealDistribution: {
    numberOfMeals: number;
    caloriesPerMeal: number;
    meals: Array<{
      mealNumber: number;
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    }>;
  };

  // Aktivitet
  activity: {
    dailySteps: number;
    extraCalories: number;
  };

  // AI-genererade rekommendationer
  recommendations: {
    trainingPlan?: string;
    nutritionAdvice?: string;
    lifestyleAdjustments?: string;
    progressExpectations?: string;
  };
}

// ============================================
// KONFIGURATION
// ============================================

const CONFIG = {
  // Makronutrient regler
  protein: {
    min: 1.6,  // g per kg kroppsvikt
    max: 2.5,  // g per kg kroppsvikt
    default: 2.0
  },
  fat: {
    perKg: 0.7  // g per kg kroppsvikt
  },

  // Kalori per gram
  caloriesPerGram: {
    protein: 4,
    fat: 9,
    carbs: 4
  },

  // Aktivitetsfaktorer för TDEE beräkning
  activityFactors: {
    'sedentary': 1.2,        // Ingen träning, kontorsarbete
    'light': 1.375,          // Lätt träning 1-3 dagar/vecka
    'moderate': 1.55,        // Måttlig träning 3-5 dagar/vecka
    'active': 1.725,         // Intensiv träning 6-7 dagar/vecka
    'veryActive': 1.9        // Mycket intensiv träning + fysiskt jobb
  },

  // Standard antal måltider
  defaultMeals: 3,

  // Standard steg per dag för aktivitet
  defaultSteps: 5000,
  stepsToCalories: 0.04, // ca 0.04 kcal per steg
};

// ============================================
// BERÄKNINGSFUNKTIONER
// ============================================

/**
 * Beräkna BMR (Basal Metabolic Rate) med Mifflin-St Jeor formel
 */
function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: 'man' | 'kvinna'
): number {
  if (gender === 'man') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

/**
 * Beräkna TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(bmr: number, activityLevel: keyof typeof CONFIG.activityFactors): number {
  return Math.round(bmr * CONFIG.activityFactors[activityLevel]);
}

/**
 * Bestäm aktivitetsnivå baserat på träningsinformation
 */
function determineActivityLevel(trainingData: string | undefined): keyof typeof CONFIG.activityFactors {
  if (!trainingData) return 'light';

  const text = trainingData.toLowerCase();

  if (text.includes('ingen') || text.includes('sällan')) {
    return 'sedentary';
  } else if (text.includes('1-2') || text.includes('lätt')) {
    return 'light';
  } else if (text.includes('3-5') || text.includes('måttlig')) {
    return 'moderate';
  } else if (text.includes('6-7') || text.includes('daglig')) {
    return 'active';
  } else if (text.includes('flera gånger per dag') || text.includes('tävling')) {
    return 'veryActive';
  }

  return 'moderate'; // Default
}

/**
 * Bestäm kaloriunderskott baserat på mål och erfarenhet
 */
function determineDeficit(goalData: string | undefined, weight: number): number {
  if (!goalData) return 250;

  const text = goalData.toLowerCase();

  // Om målet är bantning/viktminskning
  if (text.includes('gå ner') || text.includes('banta') || text.includes('minska')) {
    // Större underskott för högre vikt
    if (weight > 100) return 500;
    if (weight > 80) return 400;
    return 300;
  }

  // Om målet är muskeluppbyggnad
  if (text.includes('bygga') || text.includes('bulk') || text.includes('öka')) {
    return -250; // Överskott
  }

  // Vikthållning eller recomp
  return 0;
}

/**
 * Beräkna makronutrienter
 */
function calculateMacros(
  totalCalories: number,
  weight: number,
  proteinMultiplier: number = CONFIG.protein.default
): CalculatedPlan['macros'] {
  // Protein: 1.6-2.5g per kg
  const protein = Math.round(weight * proteinMultiplier);
  const proteinCalories = protein * CONFIG.caloriesPerGram.protein;

  // Fett: 0.7g per kg
  const fat = Math.round(weight * CONFIG.fat.perKg);
  const fatCalories = fat * CONFIG.caloriesPerGram.fat;

  // Kolhydrater: resterande kalorier
  const carbCalories = totalCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / CONFIG.caloriesPerGram.carbs);

  return {
    protein,
    fat,
    carbs,
    proteinCalories,
    fatCalories,
    carbCalories
  };
}

/**
 * Beräkna måltidsfördelning
 */
function calculateMealDistribution(
  totalCalories: number,
  macros: CalculatedPlan['macros'],
  numberOfMeals: number = CONFIG.defaultMeals
): CalculatedPlan['mealDistribution'] {
  const caloriesPerMeal = Math.round(totalCalories / numberOfMeals);

  const meals = Array.from({ length: numberOfMeals }, (_, index) => ({
    mealNumber: index + 1,
    calories: caloriesPerMeal,
    protein: Math.round(macros.protein / numberOfMeals),
    fat: Math.round(macros.fat / numberOfMeals),
    carbs: Math.round(macros.carbs / numberOfMeals)
  }));

  return {
    numberOfMeals,
    caloriesPerMeal,
    meals
  };
}

/**
 * Bestäm antal måltider baserat på preferenser och livsstil
 */
function determineNumberOfMeals(
  lifestyle: string | undefined,
  preferredSchedule: string | undefined
): number {
  if (!lifestyle && !preferredSchedule) return 3;

  const text = `${lifestyle} ${preferredSchedule}`.toLowerCase();

  if (text.includes('5') || text.includes('fem')) return 5;
  if (text.includes('4') || text.includes('fyra')) return 4;
  if (text.includes('2') || text.includes('två') || text.includes('intermittent')) return 2;

  return 3; // Default
}

// ============================================
// HUVUDFUNKTION - AI COACH PROCESSOR
// ============================================

/**
 * Processera ansökningsdata och generera komplett tränings- och nutritionsplan
 */
export async function processClientApplication(
  applicationData: ApplicationData
): Promise<CalculatedPlan> {

  // 1. Beräkna BMR
  const bmr = calculateBMR(
    applicationData.currentWeight,
    applicationData.height,
    applicationData.age,
    applicationData.gender
  );

  // 2. Bestäm aktivitetsnivå baserat på träningsdata
  const activityLevel = determineActivityLevel(applicationData.currentTraining);

  // 3. Beräkna TDEE
  const tdee = calculateTDEE(bmr, activityLevel);

  // 4. Bestäm kaloriunderskott/överskott
  const deficit = determineDeficit(
    applicationData.trainingGoal,
    applicationData.currentWeight
  );

  // 5. Beräkna totalt kaloriintag
  const baseline = tdee - deficit;

  // 6. Lägg till extra kalorier från steg
  const dailySteps = CONFIG.defaultSteps;
  const extraCalories = Math.round(dailySteps * CONFIG.stepsToCalories);
  const totalIntake = baseline + extraCalories;

  // 7. Beräkna makronutrienter
  const macros = calculateMacros(totalIntake, applicationData.currentWeight);

  // 8. Bestäm antal måltider
  const numberOfMeals = determineNumberOfMeals(
    applicationData.lifestyle,
    applicationData.preferredSchedule
  );

  // 9. Beräkna måltidsfördelning
  const mealDistribution = calculateMealDistribution(
    totalIntake,
    macros,
    numberOfMeals
  );

  // 10. Generera AI-rekommendationer (detta kan utökas med Claude API)
  const recommendations = await generateRecommendations(applicationData);

  return {
    calories: {
      bmr: Math.round(bmr),
      tdee,
      deficit,
      baseline,
      totalIntake
    },
    macros,
    mealDistribution,
    activity: {
      dailySteps,
      extraCalories
    },
    recommendations
  };
}

/**
 * Generera personliga rekommendationer baserat på ansökningsdata
 * TODO: Integrera med Claude API för mer avancerade rekommendationer
 */
async function generateRecommendations(
  applicationData: ApplicationData
): Promise<CalculatedPlan['recommendations']> {

  const recommendations: CalculatedPlan['recommendations'] = {};

  // Träningsrekommendationer baserat på erfarenhet
  if (applicationData.trainingExperience) {
    const experience = applicationData.trainingExperience.toLowerCase();
    if (experience.includes('nybörjare') || experience.includes('ingen')) {
      recommendations.trainingPlan =
        'Börja med 3 styrketräningstillfällen/vecka och fokusera på grundläggande övningar. Lägg till 2-3 pass lågintensiv konditionsträning (promenader).';
    } else if (experience.includes('erfaren') || experience.includes('avancerad')) {
      recommendations.trainingPlan =
        'Fortsätt med din nuvarande träningsvolym men optimera återhämtning. Överväg periodisering för bättre resultat under de 90 dagarna.';
    }
  }

  // Nutritionsråd baserat på matsmältning och allergier
  if (applicationData.digestionIssues || applicationData.allergies) {
    recommendations.nutritionAdvice =
      'Håll en matdagbok under första veckan för att identifiera eventuella triggers. Prioritera lättsmälta proteinkällor och fibrer från grönsaker.';
  }

  // Livsstilsjusteringar baserat på stress och sömn
  if (applicationData.stressLevel || applicationData.sleepHours) {
    const sleepHours = applicationData.sleepHours?.toLowerCase();
    if (sleepHours && (sleepHours.includes('4') || sleepHours.includes('5') || sleepHours.includes('lite'))) {
      recommendations.lifestyleAdjustments =
        'Prioritera 7-8 timmars sömn per natt. Sömn är kritiskt för återhämtning och resultat. Överväg att sänka träningsvolym initialt om sömnbristen fortsätter.';
    }

    const stress = applicationData.stressLevel?.toLowerCase();
    if (stress && (stress.includes('hög') || stress.includes('mycket'))) {
      recommendations.lifestyleAdjustments =
        (recommendations.lifestyleAdjustments || '') +
        ' Inkludera daglig stresshantering (meditation, andningsövningar, promenader). Högt stressnivå kan påverka resultat negativt.';
    }
  }

  // Förväntningar på progress
  const deficit = determineDeficit(applicationData.trainingGoal, applicationData.currentWeight);
  if (deficit > 0) {
    const weeklyLoss = (deficit * 7) / 7700; // Uppskattat viktförlust per vecka
    recommendations.progressExpectations =
      `Med ditt kaloriunderskott kan du förvänta dig cirka ${weeklyLoss.toFixed(1)} kg viktminskning per vecka. Detta är en hållbar och hälsosam takt. Totalt över 90 dagar: ${(weeklyLoss * 12).toFixed(1)} kg.`;
  }

  return recommendations;
}

// ============================================
// CLAUDE API INTEGRATION (AVANCERAD VERSION)
// ============================================

/**
 * Använd Claude API för att generera djupgående, personliga rekommendationer
 * Kräver ANTHROPIC_API_KEY i .env
 */
export async function generateAIRecommendations(
  applicationData: ApplicationData,
  calculatedPlan: CalculatedPlan
): Promise<string> {

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY saknas. Använder grundläggande rekommendationer.');
    return JSON.stringify(calculatedPlan.recommendations, null, 2);
  }

  try {
    const prompt = `
Du är en erfaren personlig tränare och nutritionist. Analysera denna klientansökan och ge personliga rekommendationer för deras 90-dagars challenge.

KLIENTDATA:
- Namn: ${applicationData.fullName}
- Ålder: ${applicationData.age}, Kön: ${applicationData.gender}
- Längd: ${applicationData.height} cm, Vikt: ${applicationData.currentWeight} kg
- Träningserfarenhet: ${applicationData.trainingExperience || 'Ej angiven'}
- Träningsmål: ${applicationData.trainingGoal || 'Ej angiven'}
- Nuvarande träning: ${applicationData.currentTraining || 'Ej angiven'}
- Tillgänglig tid: ${applicationData.availableTime || 'Ej angiven'}
- Kosthistorik: ${applicationData.dietHistory || 'Ej angiven'}
- Matsmältningsproblem: ${applicationData.digestionIssues || 'Inga'}
- Allergier: ${applicationData.allergies || 'Inga'}
- Stressnivå: ${applicationData.stressLevel || 'Ej angiven'}
- Sömn: ${applicationData.sleepHours || 'Ej angiven'}
- Livsstil: ${applicationData.lifestyle || 'Ej angiven'}
- Varför de gör programmet: ${applicationData.whyJoin || 'Ej angiven'}
- Största utmaningar: ${applicationData.biggestChallenges || 'Ej angiven'}

BERÄKNAD PLAN:
- Kaloriintag: ${calculatedPlan.calories.totalIntake} kcal/dag
- Protein: ${calculatedPlan.macros.protein}g
- Fett: ${calculatedPlan.macros.fat}g
- Kolhydrater: ${calculatedPlan.macros.carbs}g
- Antal måltider: ${calculatedPlan.mealDistribution.numberOfMeals}

Ge personliga rekommendationer inom följande områden:

1. TRÄNINGSPLAN: Specifik träningsplan anpassad efter deras erfarenhet, mål, tillgänglig tid och eventuella skador.

2. NUTRITIONSRÅD: Praktiska kostråd baserat på deras preferenser, matsmältning, allergier och makromål.

3. LIVSSTILSJUSTERINGAR: Råd kring sömn, stress, återhämtning baserat på deras nuvarande situation.

4. FÖRVÄNTNINGAR PÅ PROGRESS: Realistiska förväntningar på resultat under 90 dagar.

5. SPECIFIKA TIPS: 3-5 konkreta actionable tips som de kan implementera omedelbart.

Svara på svenska och var konkret, praktisk och uppmuntrande.
`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;

  } catch (error) {
    console.error('Fel vid AI-rekommendationer:', error);
    return JSON.stringify(calculatedPlan.recommendations, null, 2);
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Formatera plan för visning i UI
 */
export function formatPlanForDisplay(plan: CalculatedPlan): string {
  return `
KALORIPLAN
==========
BMR (Basmetabolism): ${plan.calories.bmr} kcal
TDEE (Total förbrukning): ${plan.calories.tdee} kcal
Underskott: ${plan.calories.deficit} kcal
Basintag: ${plan.calories.baseline} kcal
Extra från steg: +${plan.activity.extraCalories} kcal
TOTALT INTAG: ${plan.calories.totalIntake} kcal/dag

MAKRONUTRIENTER
===============
Protein: ${plan.macros.protein}g (${plan.macros.proteinCalories} kcal)
Fett: ${plan.macros.fat}g (${plan.macros.fatCalories} kcal)
Kolhydrater: ${plan.macros.carbs}g (${plan.macros.carbCalories} kcal)

MÅLTIDSFÖRDELNING
=================
Antal måltider: ${plan.mealDistribution.numberOfMeals}
Kalorier per måltid: ${plan.mealDistribution.caloriesPerMeal} kcal

${plan.mealDistribution.meals.map(meal => `
Måltid ${meal.mealNumber}: ${meal.calories} kcal
  Protein: ${meal.protein}g
  Fett: ${meal.fat}g
  Kolhydrater: ${meal.carbs}g
`).join('')}

AKTIVITET
=========
Dagliga steg: ${plan.activity.dailySteps}
Extra kalorier från steg: ${plan.activity.extraCalories} kcal
`;
}

/**
 * Validera ansökningsdata innan beräkning
 */
export function validateApplicationData(data: ApplicationData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.age || data.age < 18 || data.age > 100) {
    errors.push('Ålder måste vara mellan 18 och 100');
  }

  if (!data.height || data.height < 140 || data.height > 220) {
    errors.push('Längd måste vara mellan 140 och 220 cm');
  }

  if (!data.currentWeight || data.currentWeight < 40 || data.currentWeight > 200) {
    errors.push('Vikt måste vara mellan 40 och 200 kg');
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push('Giltig email krävs');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
