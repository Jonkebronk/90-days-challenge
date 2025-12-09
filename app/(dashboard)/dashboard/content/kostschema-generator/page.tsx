'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Calculator, Upload } from 'lucide-react'
import { KostschemaCalculator } from '@/components/kostschema'
import { ImportFromImageDialog } from '@/components/meal-plan/ImportFromImageDialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function KostschemaGeneratorPage() {
  const { data: session } = useSession()
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false)

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  const handleImport = async (plan: any) => {
    setIsCreatingTemplate(true)
    try {
      // Create MealPlanTemplate from imported plan
      const res = await fetch('/api/meal-plan-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.name,
          description: 'Importerat från bild',
          targetProtein: plan.totals.protein,
          targetFat: plan.totals.fat,
          targetCarbs: plan.totals.carbs,
          targetCalories: plan.totals.kcal,
          meals: plan.meals.map((meal: any, index: number) => ({
            name: meal.name,
            mealType: `meal_${index + 1}`,
            orderIndex: index,
            items: meal.items.map((item: any, itemIndex: number) => ({
              name: item.alternatives && item.alternatives.length > 0
                ? `${item.name} eller ${item.alternatives.join(' eller ')}`
                : item.name,
              amount: item.amount,
              protein: item.protein,
              fat: item.fat,
              carbs: item.carbs,
              calories: item.kcal,
              orderIndex: itemIndex
            }))
          }))
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create template')
      }

      toast.success('Kostschema importerat!', {
        description: `${plan.meals.length} måltider med ${plan.meals.reduce((acc: number, m: any) => acc + m.items.length, 0)} ingredienser`
      })
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error('Kunde inte skapa mall från importerat schema')
    } finally {
      setIsCreatingTemplate(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="h-8 w-8 text-gold-500" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
              KOSTSCHEMA GENERATOR
            </h1>
            <p className="text-gray-400 mt-1">
              Beräkna makros och generera måltidsplaner baserat på klientens kroppsvikt
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsImportDialogOpen(true)}
          variant="outline"
          className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
        >
          <Upload className="w-4 h-4 mr-2" />
          Importera från bild
        </Button>
      </div>

      {/* Calculator */}
      <KostschemaCalculator />

      {/* Import Dialog */}
      <ImportFromImageDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImport}
      />
    </div>
  )
}
