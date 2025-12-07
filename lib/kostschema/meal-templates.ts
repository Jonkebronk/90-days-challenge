import { MealTemplate, MealDistribution } from './types'

// Food database with nutritional values per 100g
// Sourced from Livsmedelsverket (SLV)
export const foodDatabase: Record<number, { protein: number; carbs: number; fat: number; kcal: number; name: string }> = {
  // PROTEINKÄLLOR
  1534: { protein: 23.1, carbs: 0, fat: 1.2, kcal: 106, name: 'Kycklingfilé' },
  1559: { protein: 24.0, carbs: 0, fat: 1.0, kcal: 104, name: 'Kalkonfilé' },
  1443: { protein: 21.0, carbs: 0, fat: 5.0, kcal: 130, name: 'Nötfärs 5%' },
  191: { protein: 12.0, carbs: 3.5, fat: 0.2, kcal: 64, name: 'Kvarg naturell' },
  185: { protein: 12.5, carbs: 3.0, fat: 1.5, kcal: 75, name: 'Keso max 1.5%' },
  340: { protein: 12.5, carbs: 0.5, fat: 10.0, kcal: 143, name: 'Ägg (hela)' },
  2368: { protein: 80.0, carbs: 5.0, fat: 3.0, kcal: 370, name: 'Whey proteinpulver' },
  2369: { protein: 75.0, carbs: 6.0, fat: 2.0, kcal: 350, name: 'Casein proteinpulver' },
  184: { protein: 13.0, carbs: 2.5, fat: 4.0, kcal: 98, name: 'Keso naturell' },

  // KOLHYDRATSKÄLLOR
  519: { protein: 13.0, carbs: 58.0, fat: 7.0, kcal: 365, name: 'Havregryn' },
  156: { protein: 5.0, carbs: 6.0, fat: 0.5, kcal: 48, name: 'Naturell yoghurt 0.5%' },
  558: { protein: 7.0, carbs: 78.0, fat: 0.5, kcal: 350, name: 'Ris (okokt)' },
  688: { protein: 2.0, carbs: 17.0, fat: 0.1, kcal: 77, name: 'Potatis' },
  520: { protein: 11.0, carbs: 60.0, fat: 5.0, kcal: 340, name: 'Mathavre (okokt)' },
  544: { protein: 13.0, carbs: 62.0, fat: 2.0, kcal: 325, name: 'Matvete (okokt)' },
  2392: { protein: 22.0, carbs: 45.0, fat: 2.0, kcal: 290, name: 'Bönpasta (okokt)' },
  636: { protein: 1.2, carbs: 5.0, fat: 0.6, kcal: 32, name: 'Hallon' },

  // FETTKÄLLOR
  602: { protein: 2.0, carbs: 2.0, fat: 20.0, kcal: 190, name: 'Avokado' },
  819: { protein: 20.0, carbs: 10.0, fat: 55.0, kcal: 600, name: 'Blandade nötter' },

  // GRÖNSAKER
  703: { protein: 3.5, carbs: 5.0, fat: 0.3, kcal: 35, name: 'Blandade grönsaker' }
}

// Meal templates - start empty, user adds ingredients via SLV search
export const mealTemplates: Record<string, MealTemplate> = {
  breakfast: {
    kolhydrat: [],
    protein: [],
    fett: [],
    tillagg: [],
    kosttillskott: []
  },
  snack: {
    kolhydrat: [],
    protein: [],
    fett: [],
    tillagg: [],
    kosttillskott: []
  },
  lunch: {
    kolhydrat: [],
    protein: [],
    fett: [],
    tillagg: [],
    kosttillskott: []
  },
  dinner: {
    kolhydrat: [],
    protein: [],
    fett: [],
    tillagg: [],
    kosttillskott: []
  },
  evening: {
    kolhydrat: [],
    protein: [],
    fett: [],
    tillagg: [],
    kosttillskott: []
  }
}

// Meal distribution based on number of meals
export const mealDistributions: Record<number, MealDistribution[]> = {
  4: [
    { type: 'breakfast', name: 'Frukost', label: 'Frukost', kcalPercent: 25 },
    { type: 'lunch', name: 'Lunch', label: 'Lunch', kcalPercent: 30 },
    { type: 'dinner', name: 'Middag', label: 'Middag', kcalPercent: 30 },
    { type: 'evening', name: 'Kvällsmål', label: 'Kvällsmål', kcalPercent: 15 }
  ],
  5: [
    { type: 'breakfast', name: 'Frukost', label: 'Frukost', kcalPercent: 24 },
    { type: 'snack1', name: 'Mellanmål 1', label: 'Mellanmål', kcalPercent: 15 },
    { type: 'lunch', name: 'Lunch', label: 'Lunch', kcalPercent: 23 },
    { type: 'dinner', name: 'Middag', label: 'Middag', kcalPercent: 23 },
    { type: 'evening', name: 'Kvällsmål', label: 'Kvällsmål', kcalPercent: 15 }
  ],
  6: [
    { type: 'breakfast', name: 'Frukost', label: 'Frukost', kcalPercent: 20 },
    { type: 'snack1', name: 'Mellanmål 1', label: 'Mellanmål', kcalPercent: 12 },
    { type: 'lunch', name: 'Lunch', label: 'Lunch', kcalPercent: 22 },
    { type: 'snack2', name: 'Mellanmål 2', label: 'Mellanmål', kcalPercent: 12 },
    { type: 'dinner', name: 'Middag', label: 'Middag', kcalPercent: 22 },
    { type: 'evening', name: 'Kvällsmål', label: 'Kvällsmål', kcalPercent: 12 }
  ]
}

// Supplement list
export const supplementsList = [
  { id: 1, name: 'Omega-3', defaultAmount: 3, unit: 'st' },
  { id: 2, name: 'Multivitamin', defaultAmount: 1, unit: 'st' },
  { id: 3, name: 'Vitamin D', defaultAmount: 1, unit: 'st' },
  { id: 4, name: 'Magnesium', defaultAmount: 1, unit: 'st' },
  { id: 5, name: 'Zink', defaultAmount: 1, unit: 'st' },
  { id: 6, name: 'Kreatin', defaultAmount: 5, unit: 'g' },
  { id: 7, name: 'BCAA/EAA', defaultAmount: 5, unit: 'g' },
  { id: 8, name: 'Kollagen', defaultAmount: 10, unit: 'g' },
  { id: 9, name: 'Järn', defaultAmount: 1, unit: 'st' },
  { id: 10, name: 'B-vitamin', defaultAmount: 1, unit: 'st' },
  { id: 11, name: 'Probiotika', defaultAmount: 1, unit: 'st' },
  { id: 12, name: 'Ashwagandha', defaultAmount: 1, unit: 'st' }
]
