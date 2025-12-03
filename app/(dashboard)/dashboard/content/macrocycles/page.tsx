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
  Layers,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Macrocycle {
  id: string
  name: string
  description?: string | null
  goal?: string | null
  published: boolean
  createdAt: string
  updatedAt: string
  mesocycles: {
    id: string
    name: string
    goal?: string | null
    durationWeeks: number
    orderIndex: number
  }[]
  _count?: {
    assignments: number
  }
}

export default function MacrocyclesPage() {
  const router = useRouter()
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMacrocycles()
  }, [])

  const fetchMacrocycles = async () => {
    try {
      const res = await fetch('/api/macrocycles')
      if (res.ok) {
        const data = await res.json()
        setMacrocycles(data)
      }
    } catch (error) {
      console.error('Failed to fetch macrocycles:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this macrocycle?')) return

    try {
      const res = await fetch(`/api/macrocycles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMacrocycles((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete macrocycle:', error)
    }
  }

  const filteredMacrocycles = macrocycles.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.goal?.toLowerCase().includes(search.toLowerCase())
  )

  // Calculate total duration from mesocycles
  const getTotalDuration = (macrocycle: Macrocycle) => {
    return macrocycle.mesocycles.reduce((total, m) => total + m.durationWeeks, 0)
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Macrocycles</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Group mesocycles into complete training seasons (3-12 months)
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/content/macrocycles/create')}
          className="bg-amber-500 hover:bg-amber-600 text-black"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Macrocycle
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Search macrocycles..."
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
      {!loading && filteredMacrocycles.length === 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-zinc-600 mb-4" />
            <h3 className="text-lg font-medium text-zinc-300 mb-2">
              No macrocycles yet
            </h3>
            <p className="text-zinc-500 text-sm mb-4 text-center">
              Create your first macrocycle to group mesocycles into complete training seasons
            </p>
            <Button
              onClick={() => router.push('/dashboard/content/macrocycles/create')}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Macrocycle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Macrocycle Grid */}
      {!loading && filteredMacrocycles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMacrocycles.map((macrocycle) => {
            const totalDuration = getTotalDuration(macrocycle)
            return (
              <Card
                key={macrocycle.id}
                className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
                onClick={() =>
                  router.push(`/dashboard/content/macrocycles/${macrocycle.id}/edit`)
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base text-white group-hover:text-amber-400 transition-colors">
                        {macrocycle.name}
                      </CardTitle>
                      {macrocycle.goal && (
                        <CardDescription className="capitalize">
                          {macrocycle.goal}
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
                              `/dashboard/content/macrocycles/${macrocycle.id}/edit`
                            )
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(macrocycle.id)
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
                      <Layers className="h-3 w-3" />
                      {macrocycle.mesocycles.length} mesocycles
                    </div>
                    {totalDuration > 0 && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {totalDuration} weeks
                      </div>
                    )}
                    {macrocycle._count && macrocycle._count.assignments > 0 && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {macrocycle._count.assignments} assigned
                      </div>
                    )}
                  </div>

                  {/* Mesocycle List */}
                  {macrocycle.mesocycles.length > 0 && (
                    <div className="space-y-1">
                      {macrocycle.mesocycles.slice(0, 4).map((meso, index) => (
                        <div
                          key={meso.id}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span className="w-4 h-4 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 text-[10px]">
                            {index + 1}
                          </span>
                          <span className="text-zinc-400 truncate flex-1">
                            {meso.name}
                          </span>
                          <span className="text-zinc-600">
                            {meso.durationWeeks}w
                          </span>
                        </div>
                      ))}
                      {macrocycle.mesocycles.length > 4 && (
                        <div className="text-[10px] text-zinc-600 pl-6">
                          +{macrocycle.mesocycles.length - 4} more
                        </div>
                      )}
                    </div>
                  )}

                  {macrocycle.mesocycles.length === 0 && (
                    <p className="text-xs text-zinc-600 italic">
                      No mesocycles added yet
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
