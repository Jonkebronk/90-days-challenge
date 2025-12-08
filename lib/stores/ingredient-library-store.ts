// Zustand store for Ingredient Library
// Global state management with localStorage persistence

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SelectedIngredient {
  slvNummer: number
  name: string
  protein: number
  carbs: number
  fat: number
  kcal: number
}

type Category = 'protein' | 'kolhydrat' | 'fett'
type PresetType = 'standard' | 'bulking' | 'cutting' | 'vegetarian'

interface IngredientLibraryState {
  protein: SelectedIngredient[]
  kolhydrat: SelectedIngredient[]
  fett: SelectedIngredient[]

  // Actions
  addIngredient: (category: Category, ingredient: SelectedIngredient) => void
  removeIngredient: (category: Category, slvNummer: number) => void
  toggleIngredient: (category: Category, ingredient: SelectedIngredient) => void
  isSelected: (category: Category, slvNummer: number) => boolean
  applyPreset: (preset: PresetType) => void
  clearCategory: (category: Category) => void
  clearAll: () => void
  getCount: () => number
}

// Predefined presets with real SLV data
const PRESETS: Record<PresetType, { protein: SelectedIngredient[], kolhydrat: SelectedIngredient[], fett: SelectedIngredient[] }> = {
  standard: {
    protein: [
      { slvNummer: 1534, name: 'Kycklingfilé', protein: 23.1, carbs: 0, fat: 1.2, kcal: 106 },
      { slvNummer: 1559, name: 'Kalkonfilé', protein: 24.0, carbs: 0, fat: 1.0, kcal: 104 },
      { slvNummer: 340, name: 'Ägg', protein: 12.5, carbs: 0.5, fat: 10.0, kcal: 143 },
      { slvNummer: 191, name: 'Kvarg naturell', protein: 12.0, carbs: 3.5, fat: 0.2, kcal: 64 },
      { slvNummer: 1443, name: 'Nötfärs 5%', protein: 21.0, carbs: 0, fat: 5.0, kcal: 130 },
    ],
    kolhydrat: [
      { slvNummer: 519, name: 'Havregryn', protein: 13.0, carbs: 58.0, fat: 7.0, kcal: 365 },
      { slvNummer: 558, name: 'Ris', protein: 7.0, carbs: 78.0, fat: 0.5, kcal: 350 },
      { slvNummer: 688, name: 'Potatis', protein: 2.0, carbs: 17.0, fat: 0.1, kcal: 77 },
      { slvNummer: 156, name: 'Yoghurt naturell', protein: 5.0, carbs: 6.0, fat: 0.5, kcal: 48 },
    ],
    fett: [
      { slvNummer: 602, name: 'Avokado', protein: 2.0, carbs: 2.0, fat: 20.0, kcal: 190 },
      { slvNummer: 819, name: 'Blandade nötter', protein: 20.0, carbs: 10.0, fat: 55.0, kcal: 600 },
    ]
  },
  cutting: {
    protein: [
      { slvNummer: 1534, name: 'Kycklingfilé', protein: 23.1, carbs: 0, fat: 1.2, kcal: 106 },
      { slvNummer: 1559, name: 'Kalkonfilé', protein: 24.0, carbs: 0, fat: 1.0, kcal: 104 },
      { slvNummer: 191, name: 'Kvarg naturell', protein: 12.0, carbs: 3.5, fat: 0.2, kcal: 64 },
      { slvNummer: 185, name: 'Keso 1.5%', protein: 12.5, carbs: 3.0, fat: 1.5, kcal: 75 },
      { slvNummer: 340, name: 'Äggvita', protein: 11.0, carbs: 0.7, fat: 0.2, kcal: 49 },
    ],
    kolhydrat: [
      { slvNummer: 519, name: 'Havregryn', protein: 13.0, carbs: 58.0, fat: 7.0, kcal: 365 },
      { slvNummer: 688, name: 'Potatis', protein: 2.0, carbs: 17.0, fat: 0.1, kcal: 77 },
      { slvNummer: 636, name: 'Hallon', protein: 1.2, carbs: 5.0, fat: 0.6, kcal: 32 },
    ],
    fett: [
      { slvNummer: 602, name: 'Avokado', protein: 2.0, carbs: 2.0, fat: 20.0, kcal: 190 },
    ]
  },
  bulking: {
    protein: [
      { slvNummer: 1534, name: 'Kycklingfilé', protein: 23.1, carbs: 0, fat: 1.2, kcal: 106 },
      { slvNummer: 1443, name: 'Nötfärs 5%', protein: 21.0, carbs: 0, fat: 5.0, kcal: 130 },
      { slvNummer: 340, name: 'Ägg', protein: 12.5, carbs: 0.5, fat: 10.0, kcal: 143 },
      { slvNummer: 191, name: 'Kvarg naturell', protein: 12.0, carbs: 3.5, fat: 0.2, kcal: 64 },
      { slvNummer: 184, name: 'Keso naturell', protein: 13.0, carbs: 2.5, fat: 4.0, kcal: 98 },
    ],
    kolhydrat: [
      { slvNummer: 519, name: 'Havregryn', protein: 13.0, carbs: 58.0, fat: 7.0, kcal: 365 },
      { slvNummer: 558, name: 'Ris', protein: 7.0, carbs: 78.0, fat: 0.5, kcal: 350 },
      { slvNummer: 688, name: 'Potatis', protein: 2.0, carbs: 17.0, fat: 0.1, kcal: 77 },
      { slvNummer: 520, name: 'Mathavre', protein: 11.0, carbs: 60.0, fat: 5.0, kcal: 340 },
    ],
    fett: [
      { slvNummer: 602, name: 'Avokado', protein: 2.0, carbs: 2.0, fat: 20.0, kcal: 190 },
      { slvNummer: 819, name: 'Blandade nötter', protein: 20.0, carbs: 10.0, fat: 55.0, kcal: 600 },
    ]
  },
  vegetarian: {
    protein: [
      { slvNummer: 340, name: 'Ägg', protein: 12.5, carbs: 0.5, fat: 10.0, kcal: 143 },
      { slvNummer: 191, name: 'Kvarg naturell', protein: 12.0, carbs: 3.5, fat: 0.2, kcal: 64 },
      { slvNummer: 185, name: 'Keso 1.5%', protein: 12.5, carbs: 3.0, fat: 1.5, kcal: 75 },
      { slvNummer: 184, name: 'Keso naturell', protein: 13.0, carbs: 2.5, fat: 4.0, kcal: 98 },
    ],
    kolhydrat: [
      { slvNummer: 519, name: 'Havregryn', protein: 13.0, carbs: 58.0, fat: 7.0, kcal: 365 },
      { slvNummer: 558, name: 'Ris', protein: 7.0, carbs: 78.0, fat: 0.5, kcal: 350 },
      { slvNummer: 688, name: 'Potatis', protein: 2.0, carbs: 17.0, fat: 0.1, kcal: 77 },
      { slvNummer: 2392, name: 'Bönpasta', protein: 22.0, carbs: 45.0, fat: 2.0, kcal: 290 },
    ],
    fett: [
      { slvNummer: 602, name: 'Avokado', protein: 2.0, carbs: 2.0, fat: 20.0, kcal: 190 },
      { slvNummer: 819, name: 'Blandade nötter', protein: 20.0, carbs: 10.0, fat: 55.0, kcal: 600 },
    ]
  }
}

export const useIngredientLibraryStore = create<IngredientLibraryState>()(
  persist(
    (set, get) => ({
      protein: [],
      kolhydrat: [],
      fett: [],

      addIngredient: (category, ingredient) =>
        set(state => {
          // Don't add duplicates
          if (state[category].some(i => i.slvNummer === ingredient.slvNummer)) {
            return state
          }
          return {
            [category]: [...state[category], ingredient]
          }
        }),

      removeIngredient: (category, slvNummer) =>
        set(state => ({
          [category]: state[category].filter(i => i.slvNummer !== slvNummer)
        })),

      toggleIngredient: (category, ingredient) => {
        const state = get()
        const exists = state[category].some(i => i.slvNummer === ingredient.slvNummer)
        if (exists) {
          state.removeIngredient(category, ingredient.slvNummer)
        } else {
          state.addIngredient(category, ingredient)
        }
      },

      isSelected: (category, slvNummer) =>
        get()[category].some(i => i.slvNummer === slvNummer),

      applyPreset: (preset) =>
        set({
          protein: [...PRESETS[preset].protein],
          kolhydrat: [...PRESETS[preset].kolhydrat],
          fett: [...PRESETS[preset].fett]
        }),

      clearCategory: (category) =>
        set({ [category]: [] }),

      clearAll: () =>
        set({ protein: [], kolhydrat: [], fett: [] }),

      getCount: () => {
        const state = get()
        return state.protein.length + state.kolhydrat.length + state.fett.length
      }
    }),
    {
      name: 'ingredient-library',
    }
  )
)
