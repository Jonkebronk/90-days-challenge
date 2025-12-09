import { create } from 'zustand'

export interface FoodLogItem {
  id?: string
  productId?: string | null
  name: string
  portionG: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface FoodLog {
  id: string
  userId: string
  date: string
  time: string
  type: 'ai' | 'barcode' | 'manual'
  image?: string | null
  notes?: string | null
  totalKcal: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  items: FoodLogItem[]
}

export interface NutritionValues {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface AIAnalysisItem {
  name: string
  category?: string
  portion_g: number
  confidence?: 'high' | 'medium' | 'low'
  // Active values (from selected source)
  kcal: number
  protein: number
  carbs: number
  fat: number
  // AI's own estimate
  ai_estimate: NutritionValues
  // SLV official values (null if not found)
  slv_values: (NutritionValues & {
    slv_name: string
    slv_nummer: number
  }) | null
  // Which source is currently selected
  selected_source: 'ai' | 'slv'
  // Legacy fields for backwards compatibility
  source?: 'slv' | 'estimate' | 'ai'
  slv_name?: string
  slv_nummer?: number
}

export interface AIAnalysisResult {
  items: AIAnalysisItem[]
  total: NutritionValues
  notes?: string
}

export interface Product {
  id: string
  ean: string
  name: string
  brand?: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  source: string
}

export interface DailySummary {
  date: string
  logged: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  }
  targets: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  } | null
  progress: {
    kcal: number
    protein: number
    carbs: number
    fat: number
  } | null
  logCount: number
}

interface FoodLogState {
  // State
  selectedDate: Date
  logs: FoodLog[]
  isLoading: boolean
  error: string | null
  dailySummary: DailySummary | null

  // Pending analysis from AI
  pendingAnalysis: AIAnalysisResult | null
  pendingImage: string | null

  // Product cache for barcode lookups
  productCache: Map<string, Product>

  // Actions
  setSelectedDate: (date: Date) => void

  // API actions
  fetchLogs: (date?: Date) => Promise<void>
  fetchDailySummary: (date?: Date) => Promise<void>
  createLog: (data: {
    type: 'ai' | 'barcode' | 'manual'
    items: FoodLogItem[]
    image?: string
    notes?: string
  }) => Promise<FoodLog | null>
  deleteLog: (id: string) => Promise<boolean>
  updateLog: (id: string, items: FoodLogItem[], notes?: string) => Promise<boolean>

  // AI analysis
  analyzePhoto: (base64Image: string) => Promise<AIAnalysisResult | null>
  setPendingAnalysis: (result: AIAnalysisResult | null, image?: string | null) => void
  clearPendingAnalysis: () => void
  setItemSource: (idx: number, source: 'ai' | 'slv') => void

  // Product cache
  lookupProduct: (ean: string) => Promise<Product | null>
  cacheProduct: (product: Product) => void

  // Bulk import
  importProducts: (products: any[]) => Promise<{ created: number; updated: number; failed: number }>
}

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  // Initial state
  selectedDate: new Date(),
  logs: [],
  isLoading: false,
  error: null,
  dailySummary: null,
  pendingAnalysis: null,
  pendingImage: null,
  productCache: new Map(),

  // Simple setters
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Fetch logs for a date
  fetchLogs: async (date) => {
    const targetDate = date || get().selectedDate
    const dateStr = targetDate.toISOString().split('T')[0]

    set({ isLoading: true, error: null })

    try {
      const res = await fetch(`/api/food-logs?date=${dateStr}`)
      if (!res.ok) throw new Error('Failed to fetch logs')

      const data = await res.json()
      set({ logs: data.logs || [], isLoading: false })
    } catch (error) {
      set({ error: 'Kunde inte hämta matloggar', isLoading: false })
    }
  },

  // Fetch daily summary
  fetchDailySummary: async (date) => {
    const targetDate = date || get().selectedDate
    const dateStr = targetDate.toISOString().split('T')[0]

    try {
      const res = await fetch(`/api/food-logs/daily-summary?date=${dateStr}`)
      if (!res.ok) throw new Error('Failed to fetch summary')

      const data = await res.json()
      set({ dailySummary: data })
    } catch (error) {
      console.error('Failed to fetch daily summary:', error)
    }
  },

  // Create new food log
  createLog: async (data) => {
    set({ isLoading: true, error: null })

    try {
      const dateStr = get().selectedDate.toISOString().split('T')[0]

      const res = await fetch('/api/food-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          date: dateStr
        })
      })

      if (!res.ok) throw new Error('Failed to create log')

      const { foodLog } = await res.json()

      // Add to current logs
      set(state => ({
        logs: [foodLog, ...state.logs],
        isLoading: false,
        pendingAnalysis: null,
        pendingImage: null
      }))

      // Refresh summary
      get().fetchDailySummary()

      return foodLog
    } catch (error) {
      set({ error: 'Kunde inte spara matlogg', isLoading: false })
      return null
    }
  },

  // Delete food log
  deleteLog: async (id) => {
    try {
      const res = await fetch(`/api/food-logs/${id}`, {
        method: 'DELETE'
      })

      if (!res.ok) throw new Error('Failed to delete')

      set(state => ({
        logs: state.logs.filter(log => log.id !== id)
      }))

      // Refresh summary
      get().fetchDailySummary()

      return true
    } catch (error) {
      set({ error: 'Kunde inte ta bort matlogg' })
      return false
    }
  },

  // Update food log
  updateLog: async (id, items, notes) => {
    try {
      const res = await fetch(`/api/food-logs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, notes })
      })

      if (!res.ok) throw new Error('Failed to update')

      const { foodLog } = await res.json()

      set(state => ({
        logs: state.logs.map(log => log.id === id ? foodLog : log)
      }))

      // Refresh summary
      get().fetchDailySummary()

      return true
    } catch (error) {
      set({ error: 'Kunde inte uppdatera matlogg' })
      return false
    }
  },

  // Analyze photo with Claude Vision
  analyzePhoto: async (base64Image) => {
    set({ isLoading: true, error: null })

    try {
      const res = await fetch('/api/food-logs/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze')
      }

      set({
        pendingAnalysis: data.analysis,
        pendingImage: base64Image,
        isLoading: false
      })

      return data.analysis
    } catch (error: any) {
      const message = error?.message || 'Kunde inte analysera bilden'
      set({ error: message, isLoading: false })
      return null
    }
  },

  setPendingAnalysis: (result, image = null) => set({
    pendingAnalysis: result,
    pendingImage: image
  }),

  clearPendingAnalysis: () => set({
    pendingAnalysis: null,
    pendingImage: null
  }),

  // Switch between AI and SLV source for an item
  setItemSource: (idx, source) => {
    const { pendingAnalysis, pendingImage } = get()
    if (!pendingAnalysis) return

    const items = [...pendingAnalysis.items]
    const item = items[idx]

    // Get values from selected source
    const values = source === 'slv' && item.slv_values
      ? item.slv_values
      : item.ai_estimate

    // Update item with new source and values
    items[idx] = {
      ...item,
      selected_source: source,
      source: source,
      kcal: values.kcal,
      protein: values.protein,
      carbs: values.carbs,
      fat: values.fat
    }

    // Recalculate totals
    const total = items.reduce(
      (acc, i) => ({
        kcal: acc.kcal + i.kcal,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )

    // Round totals
    total.protein = Math.round(total.protein * 10) / 10
    total.carbs = Math.round(total.carbs * 10) / 10
    total.fat = Math.round(total.fat * 10) / 10

    set({
      pendingAnalysis: {
        ...pendingAnalysis,
        items,
        total
      },
      pendingImage
    })
  },

  // Lookup product by EAN
  lookupProduct: async (ean) => {
    // Check cache first
    const cached = get().productCache.get(ean)
    if (cached) return cached

    try {
      const res = await fetch(`/api/products/${ean}`)
      if (!res.ok) {
        if (res.status === 404) return null
        throw new Error('Failed to lookup')
      }

      const { product } = await res.json()

      // Cache the product
      get().cacheProduct(product)

      return product
    } catch (error) {
      console.error('Product lookup failed:', error)
      return null
    }
  },

  cacheProduct: (product) => {
    set(state => {
      const newCache = new Map(state.productCache)
      newCache.set(product.ean, product)
      return { productCache: newCache }
    })
  },

  // Bulk import products
  importProducts: async (products) => {
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
      })

      if (!res.ok) throw new Error('Import failed')

      const { results } = await res.json()
      return results
    } catch (error) {
      console.error('Import failed:', error)
      return { created: 0, updated: 0, failed: products.length }
    }
  }
}))
