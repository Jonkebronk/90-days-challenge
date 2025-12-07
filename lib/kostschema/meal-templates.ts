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

// Meal templates with base amounts (scaled dynamically)
// These are the default ingredient options for each meal type
export const mealTemplates: Record<string, MealTemplate> = {
  breakfast: {
    kolhydrat: [
      { id: 1, amount: 50, unit: 'g', name: 'Havregryn', foodId: '', slvNummer: 519 },
      { id: 2, amount: 415, unit: 'g', name: 'Naturell yoghurt 0.5% fett', foodId: '', slvNummer: 156 }
    ],
    protein: [
      { id: 1, amount: 150, unit: 'g', name: 'Kvarg', foodId: '', slvNummer: 191 },
      { id: 2, amount: 150, unit: 'g', name: 'Keso max 1.5% fett', foodId: '', slvNummer: 185 },
      { id: 3, amount: 29, unit: 'g', name: 'Whey proteinpulver', foodId: '', slvNummer: 2368 }
    ],
    fett: [
      { id: 1, amount: 130, unit: 'g', name: 'Ägg (medelstort ca 65g)', foodId: '', slvNummer: 340 }
    ],
    tillagg: [
      { id: 1, amount: 50, unit: 'g', name: 'Hallon/Blåbär', foodId: '', slvNummer: 636 }
    ],
    kosttillskott: [
      { id: 1, amount: 3, unit: 'st', name: 'Omega-3' },
      { id: 2, amount: 1, unit: 'st', name: 'Multivitamin' }
    ]
  },
  snack: {
    kolhydrat: [],
    protein: [
      { id: 1, amount: 130, unit: 'g', name: 'Kvarg', foodId: '', slvNummer: 191 },
      { id: 2, amount: 130, unit: 'g', name: 'Keso max 1.5% fett', foodId: '', slvNummer: 185 },
      { id: 3, amount: 25, unit: 'g', name: 'Whey proteinpulver', foodId: '', slvNummer: 2368 }
    ],
    fett: [
      { id: 1, amount: 80, unit: 'g', name: 'Avokado', foodId: '', slvNummer: 602 },
      { id: 2, amount: 26, unit: 'g', name: 'Naturella nötter utan salt', foodId: '', slvNummer: 819 }
    ],
    tillagg: [],
    kosttillskott: []
  },
  lunch: {
    kolhydrat: [
      { id: 1, amount: 70, unit: 'g', name: 'Ris (okokt)', foodId: '', slvNummer: 558 },
      { id: 2, amount: 321, unit: 'g', name: 'Potatis', foodId: '', slvNummer: 688 }
    ],
    protein: [
      { id: 1, amount: 180, unit: 'g', name: 'Kyckling', foodId: '', slvNummer: 1534 },
      { id: 2, amount: 180, unit: 'g', name: 'Magert nötkött', foodId: '', slvNummer: 1443 },
      { id: 3, amount: 180, unit: 'g', name: 'Kalkon', foodId: '', slvNummer: 1559 }
    ],
    fett: [],
    tillagg: [
      { id: 1, amount: 200, unit: 'g', name: 'Blandade grönsaker', foodId: '', slvNummer: 703 }
    ],
    kosttillskott: []
  },
  dinner: {
    kolhydrat: [
      { id: 1, amount: 70, unit: 'g', name: 'Ris (okokt)', foodId: '', slvNummer: 558 },
      { id: 2, amount: 70, unit: 'g', name: 'Mathavre', foodId: '', slvNummer: 520 },
      { id: 3, amount: 70, unit: 'g', name: 'Matvete', foodId: '', slvNummer: 544 },
      { id: 4, amount: 70, unit: 'g', name: 'Bönpasta', foodId: '', slvNummer: 2392 }
    ],
    protein: [
      { id: 1, amount: 180, unit: 'g', name: 'Kyckling', foodId: '', slvNummer: 1534 },
      { id: 2, amount: 180, unit: 'g', name: 'Magert nötkött', foodId: '', slvNummer: 1443 },
      { id: 3, amount: 180, unit: 'g', name: 'Kalkon', foodId: '', slvNummer: 1559 }
    ],
    fett: [],
    tillagg: [
      { id: 1, amount: 200, unit: 'g', name: 'Blandade grönsaker', foodId: '', slvNummer: 703 }
    ],
    kosttillskott: []
  },
  evening: {
    kolhydrat: [],
    protein: [
      { id: 1, amount: 175, unit: 'g', name: 'Kvarg', foodId: '', slvNummer: 191 },
      { id: 2, amount: 175, unit: 'g', name: 'Keso', foodId: '', slvNummer: 184 },
      { id: 3, amount: 37, unit: 'g', name: 'Casein', foodId: '', slvNummer: 2369 }
    ],
    fett: [
      { id: 1, amount: 15, unit: 'g', name: 'Naturella nötter utan salt', foodId: '', slvNummer: 819 }
    ],
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
