'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save, Scale, Ruler, Brain } from 'lucide-react'
import { toast } from 'sonner'

interface CheckInData {
  id: string
  isStartCheckIn: boolean
  mondayWeight: number | null
  tuesdayWeight: number | null
  wednesdayWeight: number | null
  thursdayWeight: number | null
  fridayWeight: number | null
  saturdayWeight: number | null
  sundayWeight: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  butt: number | null
  arms: number | null
  thighs: number | null
  calves: number | null
  energyLevel: number | null
  sleepQuality: number | null
  stressLevel: number | null
  hungerLevel: number | null
  recoveryLevel: number | null
  moodLevel: number | null
}

interface CheckInEditDialogProps {
  checkInId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CheckInEditDialog({
  checkInId,
  open,
  onOpenChange,
  onSuccess,
}: CheckInEditDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [checkIn, setCheckIn] = useState<CheckInData | null>(null)
  const [formData, setFormData] = useState<Partial<CheckInData>>({})

  useEffect(() => {
    if (open && checkInId) {
      fetchCheckIn()
    }
  }, [open, checkInId])

  const fetchCheckIn = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/check-in/${checkInId}`)
      if (response.ok) {
        const data = await response.json()
        setCheckIn(data.checkIn)
        // Initialize form data with current values
        setFormData({
          mondayWeight: data.checkIn.mondayWeight,
          tuesdayWeight: data.checkIn.tuesdayWeight,
          wednesdayWeight: data.checkIn.wednesdayWeight,
          thursdayWeight: data.checkIn.thursdayWeight,
          fridayWeight: data.checkIn.fridayWeight,
          saturdayWeight: data.checkIn.saturdayWeight,
          sundayWeight: data.checkIn.sundayWeight,
          chest: data.checkIn.chest,
          waist: data.checkIn.waist,
          hips: data.checkIn.hips,
          butt: data.checkIn.butt,
          arms: data.checkIn.arms,
          thighs: data.checkIn.thighs,
          calves: data.checkIn.calves,
          energyLevel: data.checkIn.energyLevel,
          sleepQuality: data.checkIn.sleepQuality,
          stressLevel: data.checkIn.stressLevel,
          hungerLevel: data.checkIn.hungerLevel,
          recoveryLevel: data.checkIn.recoveryLevel,
          moodLevel: data.checkIn.moodLevel,
        })
      } else {
        toast.error('Kunde inte hämta check-in')
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error fetching check-in:', error)
      toast.error('Ett fel uppstod')
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    field: keyof CheckInData,
    value: string
  ) => {
    const numValue = value === '' ? null : parseFloat(value)
    setFormData((prev) => ({ ...prev, [field]: numValue }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/check-in/${checkInId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Check-in uppdaterad')
        onOpenChange(false)
        onSuccess?.()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte spara')
      }
    } catch (error) {
      console.error('Error saving check-in:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const weightFields = [
    { field: 'mondayWeight' as const, label: 'Måndag' },
    { field: 'tuesdayWeight' as const, label: 'Tisdag' },
    { field: 'wednesdayWeight' as const, label: 'Onsdag' },
    { field: 'thursdayWeight' as const, label: 'Torsdag' },
    { field: 'fridayWeight' as const, label: 'Fredag' },
    { field: 'saturdayWeight' as const, label: 'Lördag' },
    { field: 'sundayWeight' as const, label: 'Söndag' },
  ]

  const measurementFields = [
    { field: 'chest' as const, label: 'Bröst' },
    { field: 'waist' as const, label: 'Midja' },
    { field: 'hips' as const, label: 'Höfter' },
    { field: 'butt' as const, label: 'Rumpa' },
    { field: 'arms' as const, label: 'Armar' },
    { field: 'thighs' as const, label: 'Lår' },
    { field: 'calves' as const, label: 'Vader' },
  ]

  const biofeedbackFields = [
    { field: 'energyLevel' as const, label: 'Energi' },
    { field: 'sleepQuality' as const, label: 'Sömn' },
    { field: 'stressLevel' as const, label: 'Stress' },
    { field: 'hungerLevel' as const, label: 'Hunger' },
    { field: 'recoveryLevel' as const, label: 'Återhämtning' },
    { field: 'moodLevel' as const, label: 'Humör' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Redigera check-in</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : checkIn ? (
          <div className="space-y-6">
            {/* Weights Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Scale className="h-4 w-4" />
                <h3 className="font-semibold">Vikter (kg)</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {weightFields.map(({ field, label }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={formData[field] ?? ''}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Measurements Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Ruler className="h-4 w-4" />
                <h3 className="font-semibold">Kroppsmått (cm)</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {measurementFields.map(({ field, label }) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs text-gray-500">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={formData[field] ?? ''}
                      onChange={(e) => handleInputChange(field, e.target.value)}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Biofeedback Section - Only for weekly check-ins */}
            {!checkIn.isStartCheckIn && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <Brain className="h-4 w-4" />
                  <h3 className="font-semibold">Biofeedback (1-10)</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {biofeedbackFields.map(({ field, label }) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs text-gray-500">{label}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        placeholder="—"
                        value={formData[field] ?? ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Spara ändringar
            </Button>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            Kunde inte ladda check-in
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
