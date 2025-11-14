import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProgramInfo } from './types'
import { ArrowRight } from 'lucide-react'

interface ProgramInfoStepProps {
  data: ProgramInfo
  onChange: (field: keyof ProgramInfo, value: any) => void
  onNext: () => void
}

export function ProgramInfoStep({ data, onChange, onNext }: ProgramInfoStepProps) {
  const canProceed = data.name.trim().length > 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)] mb-2">
          Programinformation
        </h1>
        <p className="text-[rgba(255,255,255,0.6)]">
          Fyll i grundläggande information om ditt träningsprogram
        </p>
      </div>

      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Grundinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Programnamn *</Label>
            <Input
              value={data.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="T.ex. Full Body Beginner"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
            <Textarea
              value={data.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Beskriv programmet och dess mål..."
              rows={3}
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Svårighetsgrad</Label>
              <Select value={data.difficulty} onValueChange={(value) => onChange('difficulty', value)}>
                <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Välj nivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Varaktighet (veckor)</Label>
              <Input
                type="number"
                value={data.durationWeeks || ''}
                onChange={(e) => onChange('durationWeeks', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="T.ex. 8"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={data.published}
              onChange={(e) => onChange('published', e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
            />
            <Label htmlFor="published" className="text-[rgba(255,255,255,0.7)] cursor-pointer">
              Publicera direkt
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
        >
          Nästa: Bygg träningsdagar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
