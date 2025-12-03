'use client'

import { useState, useEffect, use } from 'react'
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
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  X,
  Calendar,
  Layers,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Mesocycle {
  id: string
  name: string
  goal?: string | null
  durationWeeks: number
  macrocycleId?: string | null
  orderIndex?: number
}

interface Macrocycle {
  id: string
  name: string
  description?: string | null
  goal?: string | null
  published: boolean
  mesocycles: Mesocycle[]
}

const GOALS = [
  { value: 'hypertrophy', label: 'Hypertrophy' },
  { value: 'strength', label: 'Strength' },
  { value: 'cutting', label: 'Cutting / Fat Loss' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'peaking', label: 'Peaking' },
  { value: 'deload', label: 'Deload / Recovery' },
]

export default function EditMacrocyclePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [availableMesocycles, setAvailableMesocycles] = useState<Mesocycle[]>([])

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [goal, setGoal] = useState('')
  const [published, setPublished] = useState(false)
  const [selectedMesocycles, setSelectedMesocycles] = useState<string[]>([])
  const [originalMesocycleIds, setOriginalMesocycleIds] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      // Fetch macrocycle and all mesocycles in parallel
      const [macrocycleRes, mesocyclesRes] = await Promise.all([
        fetch(`/api/macrocycles/${id}`),
        fetch('/api/mesocycles'),
      ])

      if (macrocycleRes.ok) {
        const macrocycle: Macrocycle = await macrocycleRes.json()
        setName(macrocycle.name)
        setDescription(macrocycle.description || '')
        setGoal(macrocycle.goal || '')
        setPublished(macrocycle.published)

        // Sort by orderIndex and extract IDs
        const sortedMesoIds = macrocycle.mesocycles
          .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
          .map((m) => m.id)
        setSelectedMesocycles(sortedMesoIds)
        setOriginalMesocycleIds(sortedMesoIds)
      }

      if (mesocyclesRes.ok) {
        const allMesocycles: Mesocycle[] = await mesocyclesRes.json()
        // Include mesocycles that are either unassigned OR belong to this macrocycle
        setAvailableMesocycles(
          allMesocycles.filter((m) => !m.macrocycleId || m.macrocycleId === id)
        )
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
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
    setSelectedMesocycles(selectedMesocycles.filter((mid) => mid !== mesocycleId))
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
      const res = await fetch(`/api/macrocycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          goal: goal || null,
          published,
          mesocycleIds: selectedMesocycles,
        }),
      })

      if (res.ok) {
        router.push('/dashboard/content/macrocycles')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update macrocycle')
      }
    } catch (error) {
      console.error('Failed to update macrocycle:', error)
      alert('Failed to update macrocycle')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this macrocycle? This will not delete the mesocycles.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/macrocycles/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/dashboard/content/macrocycles')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete macrocycle')
      }
    } catch (error) {
      console.error('Failed to delete macrocycle:', error)
      alert('Failed to delete macrocycle')
    } finally {
      setDeleting(false)
    }
  }

  const selectedMesocycleData = selectedMesocycles
    .map((mid) => availableMesocycles.find((m) => m.id === mid))
    .filter(Boolean) as Mesocycle[]

  const unselectedMesocycles = availableMesocycles.filter(
    (m) => !selectedMesocycles.includes(m.id)
  )

  const totalDuration = selectedMesocycleData.reduce(
    (total, m) => total + m.durationWeeks,
    0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

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
          <h1 className="text-2xl font-bold text-white">Edit Macrocycle</h1>
          <p className="text-zinc-400 text-sm">
            Modify your training season structure
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
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
            Save Changes
          </Button>
        </div>
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

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Published</Label>
                  <p className="text-xs text-zinc-500">
                    Make visible for assignment
                  </p>
                </div>
                <Switch
                  checked={published}
                  onCheckedChange={setPublished}
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
              {unselectedMesocycles.length === 0 ? (
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
