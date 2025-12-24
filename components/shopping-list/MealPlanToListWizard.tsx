'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarDays, ShoppingCart, Loader2, Check, ChevronRight, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface MealPlan {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  _count?: {
    days: number
  }
}

interface MealPlanToListWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (listId: string) => void
}

export function MealPlanToListWizard({
  isOpen,
  onClose,
  onSuccess,
}: MealPlanToListWizardProps) {
  const [step, setStep] = useState<'select' | 'configure' | 'generating'>('select')
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | null>(null)
  const [listName, setListName] = useState('')
  const [includeRecurring, setIncludeRecurring] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('select')
      setSelectedPlan(null)
      setListName('')
      setIncludeRecurring(true)
      fetchMealPlans()
    }
  }, [isOpen])

  const fetchMealPlans = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/smart-meal-plans?status=active')
      if (res.ok) {
        const data = await res.json()
        setMealPlans(data.mealPlans || [])
      }
    } catch (err) {
      console.error('Error fetching meal plans:', err)
      toast.error('Kunde inte hämta måltidsplaner')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (plan: MealPlan) => {
    setSelectedPlan(plan)
    setListName(`Veckohandling - ${plan.name}`)
    setStep('configure')
  }

  const handleGenerate = async () => {
    if (!selectedPlan) return

    try {
      setStep('generating')
      setGenerating(true)

      const res = await fetch('/api/shopping-lists/generate-from-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smartMealPlanId: selectedPlan.id,
          name: listName || `Veckohandling - ${selectedPlan.name}`,
          includeRecurring,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate list')
      }

      const data = await res.json()
      toast.success(`Inköpslista skapad med ${data.ingredientCount} ingredienser!`)
      onSuccess(data.list.id)
      onClose()
    } catch (err) {
      console.error('Error generating list:', err)
      toast.error('Kunde inte skapa inköpslista')
      setStep('configure')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-gold-primary" />
            Skapa lista från måltidsplan
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select meal plan */}
        {step === 'select' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Välj en måltidsplan för att automatiskt beräkna alla ingredienser du behöver.
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold-primary" />
              </div>
            ) : mealPlans.length === 0 ? (
              <div className="text-center py-8 bg-zinc-50 rounded-xl">
                <CalendarDays className="h-12 w-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-600 font-medium">Inga aktiva måltidsplaner</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Skapa en måltidsplan först för att generera inköpslista
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {mealPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full text-left p-4 rounded-xl border border-zinc-200 hover:border-gold-primary hover:bg-gold-primary/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold-primary/10 flex items-center justify-center shrink-0">
                        <CalendarDays className="h-5 w-5 text-gold-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 truncate">
                          {plan.name}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-zinc-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configure list */}
        {step === 'configure' && selectedPlan && (
          <div className="space-y-6">
            {/* Selected plan info */}
            <div className="bg-gold-primary/5 border border-gold-primary/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-gold-primary" />
                <div>
                  <p className="font-semibold text-zinc-900">{selectedPlan.name}</p>
                  <p className="text-sm text-zinc-600">
                    {formatDate(selectedPlan.startDate)} - {formatDate(selectedPlan.endDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* List name */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Namn på inköpslista
              </label>
              <Input
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="T.ex. Veckohandling"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeRecurring}
                  onCheckedChange={(checked) => setIncludeRecurring(checked === true)}
                />
                <div>
                  <p className="font-medium text-zinc-900">
                    Inkludera återkommande varor
                  </p>
                  <p className="text-sm text-zinc-500">
                    Lägg automatiskt till dina sparade återkommande varor
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep('select')}
                className="flex-1"
              >
                Tillbaka
              </Button>
              <Button
                onClick={handleGenerate}
                className="flex-1 bg-gold-primary hover:bg-gold-secondary text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Skapa lista
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-gold-primary mx-auto mb-4" />
            <p className="text-lg font-semibold text-zinc-900">
              Genererar inköpslista...
            </p>
            <p className="text-sm text-zinc-600 mt-2">
              Beräknar ingredienser från alla recept
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
