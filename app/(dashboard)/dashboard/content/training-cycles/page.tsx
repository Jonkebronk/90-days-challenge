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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
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
import { Mesocycle, MUSCLE_GROUP_COLORS } from '@/components/mesocycle-builder/types'

// Types
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

// Cycle Hierarchy Explainer Component
function CycleHierarchyExplainer() {
  return (
    <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">Periodiserad Träningsplanering</CardTitle>
        <CardDescription>
          Strukturera din träning med cykler för optimala resultat
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Macrocykel - stor blå rektangel */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="w-full h-10 bg-blue-800 rounded" />
            </div>
            <div className="min-w-[220px]">
              <h3 className="font-bold text-white text-sm">MACROCYKLER</h3>
              <p className="text-xs text-zinc-400">
                Helhetsmålet över en säsong (3-12 månader)
              </p>
            </div>
          </div>

          {/* Mesocykler - 4 mindre blå rutor */}
          <div className="flex items-start gap-4">
            <div className="flex gap-2 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 h-8 bg-blue-500 rounded" />
              ))}
            </div>
            <div className="min-w-[220px]">
              <h3 className="font-bold text-white text-sm">MESOCYKLER</h3>
              <p className="text-xs text-zinc-400">
                Fokuserade faser med specifika mål (4-6 veckor)
              </p>
            </div>
          </div>

          {/* Mikrocykler - rosa streck */}
          <div className="flex items-start gap-4">
            <div className="flex gap-1 flex-1">
              {[1, 2, 3, 4].map((group) => (
                <div key={group} className="flex gap-0.5 flex-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 h-6 bg-pink-600 rounded-sm" />
                  ))}
                </div>
              ))}
            </div>
            <div className="min-w-[220px]">
              <h3 className="font-bold text-white text-sm">MIKROCYKLER</h3>
              <p className="text-xs text-zinc-400">
                Veckovisa block för finjustering och återhämtning
              </p>
            </div>
          </div>

          {/* Individuella pass */}
          <div className="flex items-start gap-4">
            <div className="flex gap-0.5 flex-1">
              {Array(32)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex-1 h-4 bg-zinc-600 rounded-sm" />
                ))}
            </div>
            <div className="min-w-[220px]">
              <h3 className="font-bold text-zinc-300 text-sm">Individuella pass</h3>
              <p className="text-xs text-zinc-500">
                Dag-för-dag träning
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TrainingCyclesPage() {
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState('macrocycles')
  const [macrocycles, setMacrocycles] = useState<Macrocycle[]>([])
  const [mesocycles, setMesocycles] = useState<Mesocycle[]>([])
  const [loadingMacro, setLoadingMacro] = useState(true)
  const [loadingMeso, setLoadingMeso] = useState(true)
  const [searchMacro, setSearchMacro] = useState('')
  const [searchMeso, setSearchMeso] = useState('')

  useEffect(() => {
    fetchMacrocycles()
    fetchMesocycles()
  }, [])

  // Fetch functions
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
      setLoadingMacro(false)
    }
  }

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
      setLoadingMeso(false)
    }
  }

  // Delete handlers
  const handleDeleteMacro = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna macrocykel?')) return

    try {
      const res = await fetch(`/api/macrocycles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMacrocycles((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete macrocycle:', error)
    }
  }

  const handleDeleteMeso = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mesocykel?')) return

    try {
      const res = await fetch(`/api/mesocycles/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMesocycles((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete mesocycle:', error)
    }
  }

  // Filtered lists
  const filteredMacrocycles = macrocycles.filter(
    (m) =>
      m.name.toLowerCase().includes(searchMacro.toLowerCase()) ||
      m.goal?.toLowerCase().includes(searchMacro.toLowerCase())
  )

  const filteredMesocycles = mesocycles.filter(
    (m) =>
      m.name.toLowerCase().includes(searchMeso.toLowerCase()) ||
      m.goal?.toLowerCase().includes(searchMeso.toLowerCase())
  )

  // Helper functions
  const getTotalDuration = (macrocycle: Macrocycle) => {
    return macrocycle.mesocycles.reduce((total, m) => total + m.durationWeeks, 0)
  }

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Träningscykler</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Hantera dina macro- och mesocykler för periodiserad träning
        </p>
      </div>

      {/* Visual Explainer */}
      <CycleHierarchyExplainer />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="macrocycles"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
          >
            <Layers className="h-4 w-4 mr-2" />
            Macrocykler
          </TabsTrigger>
          <TabsTrigger
            value="mesocycles"
            className="data-[state=active]:bg-amber-500 data-[state=active]:text-black"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Mesocykler
          </TabsTrigger>
        </TabsList>

        {/* Macrocycles Tab */}
        <TabsContent value="macrocycles">
          {/* Actions */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Sök macrocykler..."
                value={searchMacro}
                onChange={(e) => setSearchMacro(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800"
              />
            </div>
            <Button
              onClick={() => router.push('/dashboard/content/macrocycles/create')}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny Macrocykel
            </Button>
          </div>

          {/* Loading State */}
          {loadingMacro && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          )}

          {/* Empty State */}
          {!loadingMacro && filteredMacrocycles.length === 0 && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">
                  Inga macrocykler ännu
                </h3>
                <p className="text-zinc-500 text-sm mb-4 text-center">
                  Skapa din första macrocykel för att gruppera mesocykler till kompletta träningssäsonger
                </p>
                <Button
                  onClick={() => router.push('/dashboard/content/macrocycles/create')}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa Macrocykel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Macrocycle Grid */}
          {!loadingMacro && filteredMacrocycles.length > 0 && (
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
                              Redigera
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMacro(macrocycle.id)
                              }}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Ta bort
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
                          {macrocycle.mesocycles.length} mesocykler
                        </div>
                        {totalDuration > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {totalDuration} veckor
                          </div>
                        )}
                        {macrocycle._count && macrocycle._count.assignments > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {macrocycle._count.assignments} tilldelade
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
                                {meso.durationWeeks}v
                              </span>
                            </div>
                          ))}
                          {macrocycle.mesocycles.length > 4 && (
                            <div className="text-[10px] text-zinc-600 pl-6">
                              +{macrocycle.mesocycles.length - 4} till
                            </div>
                          )}
                        </div>
                      )}

                      {macrocycle.mesocycles.length === 0 && (
                        <p className="text-xs text-zinc-600 italic">
                          Inga mesocykler tillagda ännu
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Mesocycles Tab */}
        <TabsContent value="mesocycles">
          {/* Actions */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Sök mesocykler..."
                value={searchMeso}
                onChange={(e) => setSearchMeso(e.target.value)}
                className="pl-10 bg-zinc-900 border-zinc-800"
              />
            </div>
            <Button
              onClick={() => router.push('/dashboard/content/mesocycles/create')}
              className="bg-amber-500 hover:bg-amber-600 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny Mesocykel
            </Button>
          </div>

          {/* Loading State */}
          {loadingMeso && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          )}

          {/* Empty State */}
          {!loadingMeso && filteredMesocycles.length === 0 && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-zinc-600 mb-4" />
                <h3 className="text-lg font-medium text-zinc-300 mb-2">
                  Inga mesocykler ännu
                </h3>
                <p className="text-zinc-500 text-sm mb-4">
                  Skapa din första mesocykel för att börja planera träningsblock
                </p>
                <Button
                  onClick={() => router.push('/dashboard/content/mesocycles/create')}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa Mesocykel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Mesocycle Grid */}
          {!loadingMeso && filteredMesocycles.length > 0 && (
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
                              Redigera
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMeso(mesocycle.id)
                              }}
                              className="text-red-400 focus:text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Ta bort
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
                          {mesocycle.durationWeeks} veckor
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {mesocycle.days.length} dagar
                        </div>
                        {(mesocycle as any)._count?.assignments > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {(mesocycle as any)._count.assignments} tilldelade
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
