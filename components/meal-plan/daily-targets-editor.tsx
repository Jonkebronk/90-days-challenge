'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings2 } from 'lucide-react'

interface DailyTarget {
  id?: string
  dayOfWeek: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

interface DailyTargetsEditorProps {
  mealPlanId: string
  dailyTargets: DailyTarget[]
  defaultValues: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
  onSave: () => void
}

const WEEKDAY_NAMES = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']

export function DailyTargetsEditor({ mealPlanId, dailyTargets, defaultValues, onSave }: DailyTargetsEditorProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [targets, setTargets] = useState<DailyTarget[]>(() => {
    // Initialize with existing targets or defaults for all 7 days
    return WEEKDAY_NAMES.map((_, dayOfWeek) => {
      const existing = dailyTargets.find(t => t.dayOfWeek === dayOfWeek)
      return existing || {
        dayOfWeek,
        calories: defaultValues.calories,
        protein: defaultValues.protein,
        fat: defaultValues.fat,
        carbs: defaultValues.carbs
      }
    })
  })

  const updateTarget = (dayOfWeek: number, field: keyof Omit<DailyTarget, 'id' | 'dayOfWeek'>, value: number) => {
    setTargets(prev => prev.map(t =>
      t.dayOfWeek === dayOfWeek ? { ...t, [field]: value } : t
    ))
  }

  const copyToAll = (dayOfWeek: number) => {
    const source = targets.find(t => t.dayOfWeek === dayOfWeek)
    if (source) {
      setTargets(prev => prev.map(t => ({
        ...t,
        calories: source.calories,
        protein: source.protein,
        fat: source.fat,
        carbs: source.carbs
      })))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/meal-plan/daily-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealPlanId,
          targets: targets.map(t => ({
            dayOfWeek: t.dayOfWeek,
            calories: t.calories,
            protein: t.protein,
            fat: t.fat,
            carbs: t.carbs
          }))
        })
      })

      if (response.ok) {
        onSave()
        setOpen(false)
      }
    } catch (error) {
      console.error('Error saving daily targets:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gold-primary">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Redigera dagliga makromål
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {targets.map((target, index) => (
            <div key={target.dayOfWeek} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{WEEKDAY_NAMES[target.dayOfWeek]}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-gold-primary"
                  onClick={() => copyToAll(target.dayOfWeek)}
                >
                  Kopiera till alla dagar
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {/* Calories */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                      Kcal
                    </span>
                  </label>
                  <Input
                    type="number"
                    value={target.calories}
                    onChange={(e) => updateTarget(target.dayOfWeek, 'calories', Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Protein */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                      Protein (g)
                    </span>
                  </label>
                  <Input
                    type="number"
                    value={target.protein}
                    onChange={(e) => updateTarget(target.dayOfWeek, 'protein', Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Fat */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                      Fett (g)
                    </span>
                  </label>
                  <Input
                    type="number"
                    value={target.fat}
                    onChange={(e) => updateTarget(target.dayOfWeek, 'fat', Number(e.target.value))}
                    className="h-9"
                  />
                </div>

                {/* Carbs */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                      Kolhydrater (g)
                    </span>
                  </label>
                  <Input
                    type="number"
                    value={target.carbs}
                    onChange={(e) => updateTarget(target.dayOfWeek, 'carbs', Number(e.target.value))}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            {saving ? 'Sparar...' : 'Spara mål'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
