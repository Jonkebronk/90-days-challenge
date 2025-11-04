'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'sonner'

interface Client {
  id: string
  name: string | null
  email: string
}

interface CaloriePlan {
  weight: number | null
  activityLevel: string | null
  deficit: number | null
  dailySteps: number | null
  proteinPerKg: number | null
  fatPerKg: number | null
  numMeals: number | null
  customDistribution: boolean
  mealCalories: number[]
  customMacros: any
}

interface ClientPlanContextType {
  // Client selection
  clients: Client[]
  selectedClient: string
  setSelectedClient: (clientId: string) => void

  // Calorie plan data (local state for instant updates)
  localPlan: CaloriePlan
  updateLocalPlan: (updates: Partial<CaloriePlan>) => void

  // Saved plan data (from database)
  savedPlan: CaloriePlan | null

  // Loading states
  isLoading: boolean
  isSaving: boolean

  // Actions
  savePlan: () => Promise<void>
  refreshPlan: () => Promise<void>
}

const defaultPlan: CaloriePlan = {
  weight: null,
  activityLevel: '30',
  deficit: 0,
  dailySteps: 5000,
  proteinPerKg: 2.0,
  fatPerKg: 0.7,
  numMeals: 3,
  customDistribution: false,
  mealCalories: [],
  customMacros: null
}

const ClientPlanContext = createContext<ClientPlanContextType | undefined>(undefined)

export function ClientPlanProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [localPlan, setLocalPlan] = useState<CaloriePlan>(defaultPlan)
  const [savedPlan, setSavedPlan] = useState<CaloriePlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Load plan when client is selected
  useEffect(() => {
    if (selectedClient) {
      loadClientPlan(selectedClient)
    } else {
      setLocalPlan(defaultPlan)
      setSavedPlan(null)
    }
  }, [selectedClient])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients.filter((c: Client) => c.name))
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const loadClientPlan = async (clientId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/calorie-plan?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.caloriePlan) {
          const plan: CaloriePlan = {
            weight: data.caloriePlan.weight ? parseFloat(data.caloriePlan.weight) : null,
            activityLevel: data.caloriePlan.activityLevel || '30',
            deficit: data.caloriePlan.deficit || 0,
            dailySteps: data.caloriePlan.dailySteps || 5000,
            proteinPerKg: data.caloriePlan.proteinPerKg ? parseFloat(data.caloriePlan.proteinPerKg) : 2.0,
            fatPerKg: data.caloriePlan.fatPerKg ? parseFloat(data.caloriePlan.fatPerKg) : 0.7,
            numMeals: data.caloriePlan.numMeals || 3,
            customDistribution: data.caloriePlan.customDistribution || false,
            mealCalories: data.caloriePlan.mealCalories || [],
            customMacros: data.caloriePlan.customMacros || null
          }
          setLocalPlan(plan)
          setSavedPlan(plan)
        } else {
          setLocalPlan(defaultPlan)
          setSavedPlan(null)
        }
      }
    } catch (error) {
      console.error('Failed to load client plan:', error)
      toast.error('Kunde inte ladda klientdata')
    } finally {
      setIsLoading(false)
    }
  }

  const updateLocalPlan = (updates: Partial<CaloriePlan>) => {
    setLocalPlan(prev => ({ ...prev, ...updates }))
  }

  const savePlan = async () => {
    if (!selectedClient) {
      toast.error('Välj en klient först')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/calorie-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient,
          ...localPlan
        })
      })

      if (response.ok) {
        setSavedPlan(localPlan)
        toast.success('Klientplan sparad!')
      } else {
        toast.error('Kunde inte spara klientplan')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Något gick fel')
    } finally {
      setIsSaving(false)
    }
  }

  const refreshPlan = async () => {
    if (selectedClient) {
      await loadClientPlan(selectedClient)
    }
  }

  return (
    <ClientPlanContext.Provider
      value={{
        clients,
        selectedClient,
        setSelectedClient,
        localPlan,
        updateLocalPlan,
        savedPlan,
        isLoading,
        isSaving,
        savePlan,
        refreshPlan
      }}
    >
      {children}
    </ClientPlanContext.Provider>
  )
}

export function useClientPlan() {
  const context = useContext(ClientPlanContext)
  if (context === undefined) {
    throw new Error('useClientPlan must be used within a ClientPlanProvider')
  }
  return context
}
