'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Calendar,
  Target,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mesocycle, MUSCLE_GROUP_COLORS } from '@/components/mesocycle-builder/types'

export default function MesocyclesPage() {
  const router = useRouter()
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMesocycles()
  }, [])

  const fetchMesocycles = async () => {
    try {
      const res = await fetch('/api/mesocycles')
      if (res.ok) {
        const data = await res.json()
        setMesocycles(data)
      }
    } catch (error) {
      console.error('Failed to fetch mesocycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this mesocycle?')) return

    try {
      const res = await fetch(`/api/mesocycles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMesocycles((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete mesocycle:', error)
    }
  }

  const filteredMesocycles = mesocycles.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.goal?.toLowerCase().includes(search.toLowerCase())
  )

  // Get unique muscle groups for a mesocycle
  const getMuscleGroups = (mesocycle: Mesocycle) => {
    const groups = new Set<string>()
    mesocycle.days.forEach((day) => {
      day.muscleSlots.forEach((slot) => {
        groups.add(slot.muscleGroup)
      })
    })
    return Array.from(groups)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mesocycles</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Create and manage training mesocycles (4-6 week blocks)
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/content/mesocycles/create')}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Mesocycle
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search mesocycles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMesocycles.length === 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              No mesocycles yet
            </h3>
            <p className="text-zinc-500 text-sm mb-4">
              Create your first mesocycle to start planning training blocks
            </p>
            <Button
              onClick={() => router.push('/dashboard/content/mesocycles/create')}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Mesocycle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mesocycle Grid */}
      {!loading && filteredMesocycles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMesocycles.map((mesocycle) => {
            const muscleGroups = getMuscleGroups(mesocycle)
            return (
              <Card
                key={mesocycle.id}
                className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
                onClick={() =>
                  router.push(`/dashboard/content/mesocycles/${mesocycle.id}/edit`)
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base text-white group-hover:text-amber-400 transition-colors">
                        {mesocycle.name}
                      </CardTitle>
                      {mesocycle.goal && (
                        <CardDescription className="capitalize">
                          {mesocycle.goal}
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(
                              `/dashboard/content/mesocycles/${mesocycle.id}/edit`
                            )
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(mesocycle.id)
                          }}
                          className="text-red-400 focus:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-zinc-500 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {mesocycle.durationWeeks} weeks
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {mesocycle.days.length} days
                    </div>
                    {(mesocycle as any)._count?.assignments > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {(mesocycle as any)._count.assignments} assigned
                      </div>
                    )}
                  </div>

                  {/* Muscle Groups */}
                  <div className="flex flex-wrap gap-1">
                    {muscleGroups.slice(0, 6).map((group) => (
                      <Badge
                        key={group}
                        variant="secondary"
                        className="text-[10px] bg-zinc-800 text-zinc-400"
                        style={{
                          borderLeft: `2px solid ${
                            MUSCLE_GROUP_COLORS[group] || '#FFD700'
                          }`,
                        }}
                      >
                        {group}
                      </Badge>
                    ))}
                    {muscleGroups.length > 6 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-zinc-800 text-zinc-400"
                      >
                        +{muscleGroups.length - 6}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
