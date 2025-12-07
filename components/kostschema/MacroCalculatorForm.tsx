'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ActivityLevel } from '@/lib/kostschema/types'

interface MacroCalculatorFormProps {
  bodyWeight: number
  setBodyWeight: (value: number) => void
  activityLevel: ActivityLevel
  setActivityLevel: (value: ActivityLevel) => void
  weightLossTempo: number
  setWeightLossTempo: (value: number) => void
  proteinFactor: number
  setProteinFactor: (value: number) => void
}

const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Stillasittande', description: '1-2 träningar/vecka' },
  { value: 'moderate', label: 'Måttligt aktiv', description: '3-4 träningar/vecka' },
  { value: 'active', label: 'Mycket aktiv', description: '5+ träningar/vecka' }
]

const tempoOptions = [
  { value: 500, label: '500g/vecka', description: 'Långsamt & hållbart' },
  { value: 700, label: '700g/vecka', description: 'Balanserat' },
  { value: 1000, label: '1000g/vecka', description: 'Aggressivt' }
]

export function MacroCalculatorForm({
  bodyWeight,
  setBodyWeight,
  activityLevel,
  setActivityLevel,
  weightLossTempo,
  setWeightLossTempo,
  proteinFactor,
  setProteinFactor
}: MacroCalculatorFormProps) {
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-white">Dina mål</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Body Weight */}
        <div className="space-y-2">
          <Label htmlFor="bodyWeight" className="text-zinc-300">
            Kroppsvikt (kg)
          </Label>
          <Input
            id="bodyWeight"
            type="number"
            value={bodyWeight || ''}
            onChange={(e) => setBodyWeight(Number(e.target.value))}
            placeholder="Ex: 85"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
        </div>

        {/* Activity Level */}
        <div className="space-y-3">
          <Label className="text-zinc-300">Aktivitetsnivå</Label>
          <div className="grid grid-cols-3 gap-2">
            {activityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActivityLevel(option.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  activityLevel === option.value
                    ? 'bg-gold-600 border-gold-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs opacity-70 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Weight Loss Tempo */}
        <div className="space-y-3">
          <Label className="text-zinc-300">Viktnedgångstempo</Label>
          <div className="grid grid-cols-3 gap-2">
            {tempoOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setWeightLossTempo(option.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  weightLossTempo === option.value
                    ? 'bg-gold-600 border-gold-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs opacity-70 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Protein */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-zinc-300">Protein</Label>
            <span className="text-gold-500 font-semibold">{proteinFactor.toFixed(1)} g/kg</span>
          </div>
          <Slider
            value={[proteinFactor]}
            onValueChange={(value) => setProteinFactor(value[0])}
            min={1.6}
            max={2.5}
            step={0.1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>1.6 g/kg</span>
            <span>2.0 g/kg</span>
            <span>2.5 g/kg</span>
          </div>
        </div>

        {/* Fat & Carbs info */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
            <div className="flex justify-between items-center">
              <Label className="text-zinc-300">Fett</Label>
              <span className="text-gold-500 font-semibold">0.7 g/kg</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Fast värde</p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700">
            <div className="flex justify-between items-center">
              <Label className="text-zinc-300">Kolhydrater</Label>
              <span className="text-gold-500 font-semibold">Resterande</span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Kalorier kvar</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
