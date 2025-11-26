'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Video, Save, Flame } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface WarmupExercise {
  id: string
  orderIndex: number
  name: string
  reps: string
  videoUrl: string
  instructions: string
}

export default function EditWarmupPage() {
  const params = useParams()
  const router = useRouter()
  const warmupId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [introText, setIntroText] = useState('')
  const [outroText, setOutroText] = useState('')
  const [exercises, setExercises] = useState<WarmupExercise[]>([])

  useEffect(() => {
    fetchWarmup()
  }, [warmupId])

  const fetchWarmup = async () => {
    try {
      const response = await fetch(`/api/admin/warmups/${warmupId}`)
      if (response.ok) {
        const data = await response.json()
        const warmup = data.warmup
        setName(warmup.name)
        setDescription(warmup.description || '')
        setIntroText(warmup.introText || '')
        setOutroText(warmup.outroText || '')
        setExercises(warmup.exercises.map((ex: any) => ({
          id: ex.id,
          orderIndex: ex.orderIndex,
          name: ex.name,
          reps: ex.reps || '',
          videoUrl: ex.videoUrl || '',
          instructions: ex.instructions || ''
        })))
      } else {
        toast.error('Kunde inte hämta uppvärmning')
        router.push('/dashboard/content/warmups')
      }
    } catch (error) {
      console.error('Error fetching warmup:', error)
      toast.error('Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  const addExercise = () => {
    const newExercise: WarmupExercise = {
      id: `temp-${Date.now()}`,
      orderIndex: exercises.length,
      name: '',
      reps: '',
      videoUrl: '',
      instructions: ''
    }
    setExercises([...exercises, newExercise])
  }

  const updateExercise = (index: number, field: keyof WarmupExercise, value: string) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...exercises]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setExercises(updated)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Namn är obligatoriskt')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/warmups/${warmupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          introText: introText || null,
          outroText: outroText || null,
          exercises: exercises.map((ex, index) => ({
            orderIndex: index,
            name: ex.name,
            reps: ex.reps || null,
            videoUrl: ex.videoUrl || null,
            instructions: ex.instructions || null
          }))
        })
      })

      if (response.ok) {
        toast.success('Uppvärmning uppdaterad!')
        router.push('/dashboard/content/warmups')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte uppdatera uppvärmning')
      }
    } catch (error) {
      console.error('Error updating warmup:', error)
      toast.error('Något gick fel')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content/warmups">
            <Button variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-7 h-7 text-orange-500" />
              Redigera Uppvärmning
            </h1>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sparar...' : 'Spara'}
        </Button>
      </div>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>Grundläggande information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Standard Uppvärmning"
            />
          </div>
          <div>
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av uppvärmningen"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Intro text */}
      <Card>
        <CardHeader>
          <CardTitle>Inledande text</CardTitle>
          <p className="text-sm text-gray-500">
            Text som visas innan övningslistan
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            placeholder="Uppvärmning är viktigt, men inte den typ av uppvärmning vi generellt tänker på..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Exercises */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Övningar</CardTitle>
            <p className="text-sm text-gray-500">
              Lägg till uppvärmningsövningar med video-länkar
            </p>
          </div>
          <Button onClick={addExercise} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Lägg till övning
          </Button>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Inga övningar ännu</p>
              <Button onClick={addExercise} variant="outline" className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Lägg till första övningen
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <span className="font-bold text-orange-500">{index + 1}</span>
                    <button
                      onClick={() => moveExercise(index, 'up')}
                      disabled={index === 0}
                      className="hover:text-gray-600 disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveExercise(index, 'down')}
                      disabled={index === exercises.length - 1}
                      className="hover:text-gray-600 disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Övningsnamn</Label>
                        <Input
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          placeholder="Kettlebell Squats"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Reps/Tid</Label>
                        <Input
                          value={exercise.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                          placeholder="x 10"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Video URL</Label>
                        <div className="relative">
                          <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={exercise.videoUrl}
                            onChange={(e) => updateExercise(index, 'videoUrl', e.target.value)}
                            placeholder="https://youtube.com/..."
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Instruktioner</Label>
                      <Textarea
                        value={exercise.instructions}
                        onChange={(e) => updateExercise(index, 'instructions', e.target.value)}
                        placeholder="Skriv instruktioner för övningen här..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeExercise(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outro text */}
      <Card>
        <CardHeader>
          <CardTitle>Avslutande text</CardTitle>
          <p className="text-sm text-gray-500">
            Text som visas efter övningslistan
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={outroText}
            onChange={(e) => setOutroText(e.target.value)}
            placeholder="Gå sedan till din första övning och då vill jag att du gör 2-3 lättare uppvärmningsset..."
            rows={6}
          />
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Sparar...' : 'Spara Uppvärmning'}
        </Button>
      </div>
    </div>
  )
}
