'use client'

import { useState, useEffect } from 'react'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  Loader2,
  GripVertical,
  Plus,
  X,
  Calendar,
  Layers,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Mesocycle {
  id: string
  name: string
  goal?: string | null
  durationWeeks: number
  macrocycleId?: string | null
}

const GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'strength', label: 'Strength' },
  { value: 'cutting', label: 'Cutting / Fat Loss' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'peaking', label: 'Peaking' },
  { value: 'deload', label: 'Deload / Recovery' },
]

export default function CreateMacrocyclePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [availableMesocycles, setAvailableMesocycles] = useState<Mesocycle[]>([])

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [selectedMesocycles, setSelectedMesocycles] = useState<string[]>([])

  useEffect(() => {
    fetchMesocycles()
  }, [])

  const fetchMesocycles = async () => {
    try {
      const res = await fetch('/api/mesocycles')
      if (res.ok) {
        const data = await res.json()
        // Filter out mesocycles that are already part of a macrocycle
        setAvailableMesocycles(data.filter((m: Mesocycle) => !m.macrocycleId))
      }
    } catch (error) {
      console.error('Failed to fetch mesocycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMesocycle = (mesocycleId: string) => {
    if (!selectedMesocycles.includes(mesocycleId)) {
      setSelectedMesocycles([...selectedMesocycles, mesocycleId])
    }
  }

  const handleRemoveMesocycle = (mesocycleId: string) => {
    setSelectedMesocycles(selectedMesocycles.filter((id) => id !== mesocycleId))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...selectedMesocycles]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    setSelectedMesocycles(newOrder)
  }

  const handleMoveDown = (index: number) => {
    if (index === selectedMesocycles.length - 1) return
    const newOrder = [...selectedMesocycles]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    setSelectedMesocycles(newOrder)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a name for the macrocycle')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/macrocycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          goal: goal || null,
          mesocycleIds: selectedMesocycles,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/dashboard/content/macrocycles/${data.id}/edit`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create macrocycle')
      }
    } catch (error) {
      console.error('Failed to create macrocycle:', error)
      alert('Failed to create macrocycle')
    } finally {
      setSaving(false)
    }
  }

  const selectedMesocycleData = selectedMesocycles
    .map((id) => availableMesocycles.find((m) => m.id === id))
    .filter(Boolean) as Mesocycle[]

  const unselectedMesocycles = availableMesocycles.filter(
    (m) => !selectedMesocycles.includes(m.id)
  )

  const totalDuration = selectedMesocycleData.reduce(
    (total, m) => total + m.durationWeeks,
    0
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/content/macrocycles')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Create Macrocycle</h1>
          <p className="text-zinc-400 text-sm">
            Group mesocycles into a complete training season
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Create Macrocycle
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Metadata */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Details</CardTitle>
              <CardDescription>
                Basic information about the macrocycle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Off-Season Hypertrophy Block"
                  className="bg-zinc-900 border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Primary Goal</Label>
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the training season..."
                  className="bg-zinc-900 border-zinc-700 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                  <Layers className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold text-white">
                    {selectedMesocycles.length}
                  </div>
                  <div className="text-xs text-zinc-500">Mesocycles</div>
                </div>
                <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <div className="text-2xl font-bold text-white">
                    {totalDuration}
                  </div>
                  <div className="text-xs text-zinc-500">Total Weeks</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Mesocycle Selection */}
        <div className="space-y-6">
          {/* Selected Mesocycles */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Mesocycle Order</CardTitle>
              <CardDescription>
                Arrange mesocycles in training sequence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedMesocycleData.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No mesocycles selected</p>
                  <p className="text-xs">Add mesocycles from the list below</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMesocycleData.map((meso, index) => (
                    <div
                      key={meso.id}
                      className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                    >
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <span className="text-xs">&#9650;</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedMesocycleData.length - 1}
                        >
                          <span className="text-xs">&#9660;</span>
                        </Button>
                      </div>
                      <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-500 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{meso.name}</p>
                        <p className="text-xs text-zinc-500">
                          {meso.durationWeeks} weeks
                          {meso.goal && ` • ${meso.goal}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        onClick={() => handleRemoveMesocycle(meso.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Mesocycles */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Available Mesocycles</CardTitle>
              <CardDescription>
                Click to add to the macrocycle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              ) : unselectedMesocycles.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <p className="text-sm">No available mesocycles</p>
                  <Button
                    variant="link"
                    className="text-amber-500"
                    onClick={() => router.push('/dashboard/content/mesocycles/create')}
                  >
                    Create a new mesocycle
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {unselectedMesocycles.map((meso) => (
                    <button
                      key={meso.id}
                      onClick={() => handleAddMesocycle(meso.id)}
                      className="w-full flex items-center gap-3 p-3 bg-zinc-800/30 hover:bg-zinc-800/70 rounded-lg border border-zinc-800 hover:border-amber-500/50 transition-colors text-left"
                    >
                      <Plus className="h-4 w-4 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{meso.name}</p>
                        <p className="text-xs text-zinc-500">
                          {meso.durationWeeks} weeks
                          {meso.goal && ` • ${meso.goal}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
