// Zustand store for Ingredient Library
// Global state management with localStorage persistence
// Supports per-meal ingredient selection

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

export type Category = 'protein' | 'kolhydrat' | 'fett'
export type MealType = 'frukost' | 'mellanmal' | 'lunch' | 'middag' | 'kvallsmal'

export interface MealIngredients {
  protein: SelectedIngredient[]
  kolhydrat: SelectedIngredient[]
  fett: SelectedIngredient[]
}

interface IngredientLibraryState {
  meals: Record<MealType, MealIngredients>
  activeMeal: MealType

  // Actions
  setActiveMeal: (meal: MealType) => void
  addIngredient: (meal: MealType, category: Category, ingredient: SelectedIngredient) => void
  removeIngredient: (meal: MealType, category: Category, slvNummer: number) => void
  toggleIngredient: (meal: MealType, category: Category, ingredient: SelectedIngredient) => void
  isSelected: (meal: MealType, category: Category, slvNummer: number) => boolean
  clearCategory: (meal: MealType, category: Category) => void
  clearMeal: (meal: MealType) => void
  clearAll: () => void
  getMealCount: (meal: MealType) => number
  getTotalCount: () => number
}

const createEmptyMeal = (): MealIngredients => ({
  protein: [],
  kolhydrat: [],
  fett: []
})

const createEmptyMeals = (): Record<MealType, MealIngredients> => ({
  frukost: createEmptyMeal(),
  mellanmal: createEmptyMeal(),
  lunch: createEmptyMeal(),
  middag: createEmptyMeal(),
  kvallsmal: createEmptyMeal()
})

export const MEAL_LABELS: Record<MealType, string> = {
  frukost: 'Frukost',
  mellanmal: 'Mellanmål',
  lunch: 'Lunch',
  middag: 'Middag',
  kvallsmal: 'Kvällsmål'
}

export const useIngredientLibraryStore = create<IngredientLibraryState>()(
  persist(
    (set, get) => ({
      meals: createEmptyMeals(),
      activeMeal: 'frukost',

      setActiveMeal: (meal) => set({ activeMeal: meal }),

      addIngredient: (meal, category, ingredient) =>
        set(state => {
          const currentMeal = state.meals[meal]
          // Don't add duplicates
          if (currentMeal[category].some(i => i.slvNummer === ingredient.slvNummer)) {
            return state
          }
          return {
            meals: {
              ...state.meals,
              [meal]: {
                ...currentMeal,
                [category]: [...currentMeal[category], ingredient]
              }
            }
          }
        }),

      removeIngredient: (meal, category, slvNummer) =>
        set(state => {
          const currentMeal = state.meals[meal]
          return {
            meals: {
              ...state.meals,
              [meal]: {
                ...currentMeal,
                [category]: currentMeal[category].filter(i => i.slvNummer !== slvNummer)
              }
            }
          }
        }),

      toggleIngredient: (meal, category, ingredient) => {
        const state = get()
        const exists = state.meals[meal][category].some(i => i.slvNummer === ingredient.slvNummer)
        if (exists) {
          state.removeIngredient(meal, category, ingredient.slvNummer)
        } else {
          state.addIngredient(meal, category, ingredient)
        }
      },

      isSelected: (meal, category, slvNummer) =>
        get().meals[meal][category].some(i => i.slvNummer === slvNummer),

      clearCategory: (meal, category) =>
        set(state => ({
          meals: {
            ...state.meals,
            [meal]: {
              ...state.meals[meal],
              [category]: []
            }
          }
        })),

      clearMeal: (meal) =>
        set(state => ({
          meals: {
            ...state.meals,
            [meal]: createEmptyMeal()
          }
        })),

      clearAll: () =>
        set({ meals: createEmptyMeals() }),

      getMealCount: (meal) => {
        const state = get()
        const m = state.meals[meal]
        return m.protein.length + m.kolhydrat.length + m.fett.length
      },

      getTotalCount: () => {
        const state = get()
        let total = 0
        for (const meal of Object.values(state.meals)) {
          total += meal.protein.length + meal.kolhydrat.length + meal.fett.length
        }
        return total
      }
    }),
    {
      name: 'ingredient-library-v2',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        // Migration from v1 (global) to v2 (per-meal)
        if (version < 2) {
          // If old format with global protein/kolhydrat/fett, migrate to frukost
          if (persistedState.protein || persistedState.kolhydrat || persistedState.fett) {
            return {
              meals: {
                frukost: {
                  protein: persistedState.protein || [],
                  kolhydrat: persistedState.kolhydrat || [],
                  fett: persistedState.fett || []
                },
                mellanmal: createEmptyMeal(),
                lunch: createEmptyMeal(),
                middag: createEmptyMeal(),
                kvallsmal: createEmptyMeal()
              },
              activeMeal: 'frukost'
            }
          }
        }
        return persistedState
      }
    }
  )
)
