'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Search, Save, Play, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  equipmentNeeded: string[]
}

interface TemplateExercise {
  exerciseId: string
  exercise?: Exercise
  sets: number
  repsMin: number | null
  repsMax: number | null
  restSeconds: number
  notes: string
}

export default function WorkoutBuilderPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseSearchTerms, setExerciseSearchTerms] = useState<Record<string, string>>({})

  // Template data
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([])

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises')
      if (response.ok) {
        const data = await response.json()
        setExercises(data.exercises || [])
      }
    } catch (error) {
      console.error('Error fetching exercises:', error)
    }
  }

  const addExercise = () => {
    const newExercise: TemplateExercise = {
      exerciseId: '',
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 60,
      notes: ''
    }
    setTemplateExercises([...templateExercises, newExercise])
  }

  const removeExercise = (index: number) => {
    setTemplateExercises(templateExercises.filter((_, i) => i !== index))
  }

  const updateExercise = (index: number, field: keyof TemplateExercise, value: any) => {
    const updated = [...templateExercises]
    updated[index] = { ...updated[index], [field]: value }
    setTemplateExercises(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Template namn krävs')
      return
    }

    if (templateExercises.length === 0) {
      alert('Lägg till minst en övning')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/workout-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          estimatedDuration,
          isPublic,
          exercises: templateExercises.map((ex, index) => ({
            ...ex,
            orderIndex: index
          }))
        })
      })

      if (response.ok) {
        router.push('/dashboard/workout/templates')
      } else {
        alert('Kunde inte spara mallen')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const handleStartWorkout = async () => {
    // Save first, then start
    if (!name.trim()) {
      alert('Template namn krävs')
      return
    }

    if (templateExercises.length === 0) {
      alert('Lägg till minst en övning')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/workout-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          estimatedDuration,
          isPublic,
          exercises: templateExercises.map((ex, index) => ({
            ...ex,
            orderIndex: index
          }))
        })
      })

      if (response.ok) {
        const { template } = await response.json()
        // Start workout from this template
        const startResponse = await fetch(`/api/workout-templates/${template.id}/start`, {
          method: 'POST'
        })

        if (startResponse.ok) {
          const { sessionLog } = await startResponse.json()
          router.push(`/dashboard/workout/session/template/${sessionLog.id}`)
        }
      } else {
        alert('Kunde inte starta träningspasset')
      }
    } catch (error) {
      console.error('Error starting workout:', error)
      alert('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/workout">
          <Button
            variant="ghost"
            size="icon"
            className="text-[rgba(255,255,255,0.7)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
            Skapa anpassat träningspass
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Bygg ditt eget träningspass från grunden
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Sparar...' : 'Spara mall'}
          </Button>
          <Button
            onClick={handleStartWorkout}
            disabled={saving}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            <Play className="w-4 h-4 mr-2" />
            Starta träning
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl text-[rgba(255,255,255,0.9)]">
            Träningspassinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Namn på träningspass *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="T.ex. Snabb överkropp"
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-[rgba(255,255,255,0.7)]">Beskrivning</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv träningspasset..."
              rows={3}
              className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Styrka</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="stretching">Stretching</SelectItem>
                  <SelectItem value="mobility">Rörlighet</SelectItem>
                  <SelectItem value="full_body">Helkropp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[rgba(255,255,255,0.7)]">Uppskattad tid (min)</Label>
              <Input
                type="number"
                value={estimatedDuration || ''}
                onChange={(e) => setEstimatedDuration(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="T.ex. 45"
                className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(255,215,0,0.3)]"
            />
            <Label htmlFor="isPublic" className="text-[rgba(255,255,255,0.7)] cursor-pointer">
              Gör mallen publik (andra kan använda den)
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[rgba(255,255,255,0.9)]">
            Övningar ({templateExercises.length})
          </h2>
          <Button
            onClick={addExercise}
            className="bg-[rgba(255,215,0,0.2)] border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.3)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lägg till övning
          </Button>
        </div>

        <div className="space-y-3">
          {templateExercises.map((exercise, index) => {
            const selectedExercise = exercises.find(e => e.id === exercise.exerciseId)
            const exerciseKey = `${index}`
            const searchTerm = exerciseSearchTerms[exerciseKey] || ''
            const filteredExercises = exercises.filter(ex =>
              ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              ex.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase()))
            )

            return (
              <Card
                key={index}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,215,0,0.1)]"
              >
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
                        <Input
                          placeholder="Sök övning..."
                          value={searchTerm}
                          onChange={(e) => setExerciseSearchTerms(prev => ({
                            ...prev,
                            [exerciseKey]: e.target.value
                          }))}
                          className="pl-8 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                        />
                      </div>
                      <Select
                        value={exercise.exerciseId}
                        onValueChange={(value) => updateExercise(index, 'exerciseId', value)}
                      >
                        <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
                          <SelectValue placeholder="Välj övning" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredExercises.length > 0 ? (
                            filteredExercises.map(ex => (
                              <SelectItem key={ex.id} value={ex.id}>
                                {ex.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-[rgba(255,255,255,0.5)]">Inga övningar hittades</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(index)}
                      className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {selectedExercise && (
                    <div className="flex flex-wrap gap-1">
                      {selectedExercise.muscleGroups.map(mg => (
                        <Badge
                          key={mg}
                          variant="outline"
                          className="text-xs bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.3)] text-[#FFD700]"
                        >
                          {mg}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs text-[rgba(255,255,255,0.6)]">Sets</Label>
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[rgba(255,255,255,0.6)]">Reps Min</Label>
                      <Input
                        type="number"
                        value={exercise.repsMin || ''}
                        onChange={(e) => updateExercise(index, 'repsMin', e.target.value ? parseInt(e.target.value) : null)}
                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[rgba(255,255,255,0.6)]">Reps Max</Label>
                      <Input
                        type="number"
                        value={exercise.repsMax || ''}
                        onChange={(e) => updateExercise(index, 'repsMax', e.target.value ? parseInt(e.target.value) : null)}
                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[rgba(255,255,255,0.6)]">Vila (s)</Label>
                      <Input
                        type="number"
                        value={exercise.restSeconds}
                        onChange={(e) => updateExercise(index, 'restSeconds', parseInt(e.target.value) || 60)}
                        className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-[rgba(255,255,255,0.6)]">Anteckningar</Label>
                    <Input
                      value={exercise.notes}
                      onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                      placeholder="T.ex. Drop set, superset..."
                      className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white text-sm mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {templateExercises.length === 0 && (
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardContent className="py-12 text-center">
              <p className="text-[rgba(255,255,255,0.6)] mb-4">
                Inga övningar ännu. Lägg till din första övning!
              </p>
              <Button
                onClick={addExercise}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till första övningen
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
