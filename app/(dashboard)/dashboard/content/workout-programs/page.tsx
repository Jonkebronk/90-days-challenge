'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, Calendar, Users, ChevronRight, UserPlus, X, ArrowLeft, BookOpen } from 'lucide-react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface WorkoutProgramCategory {
  id: string
  name: string
  description: string | null
  slug: string
  icon: string
  color: string
  orderIndex: number
  _count: {
    programs: number
  }
}

interface WorkoutProgram {
  id: string
  name: string
  description: string | null
  difficulty: string | null
  durationWeeks: number | null
  published: boolean
  categoryId: string | null
  category: WorkoutProgramCategory | null
  days: any[]
  _count: {
    assignments: number
  }
  createdAt: string
}

interface Assignment {
  id: string
  userId: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function WorkoutProgramsPage() {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([])
  const [categories, setCategories] = useState<WorkoutProgramCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [filteredPrograms, setFilteredPrograms] = useState<WorkoutProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [unassigning, setUnassigning] = useState<string | null>(null)
  const [showCategoryView, setShowCategoryView] = useState(true)

  useEffect(() => {
    fetchPrograms()
    fetchClients()
  }, [])

  useEffect(() => {
    filterPrograms()
  }, [programs, searchTerm])

  const fetchPrograms = async () => {
    try {
      const response = await fetch('/api/workout-programs')
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
        setCategories(data.categories || [])
        // Show category view if there are categories
        setShowCategoryView((data.categories || []).length > 0 && !selectedCategoryId)
      }
    } catch (error) {
      console.error('Error fetching programs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchAssignments = async (programId: string) => {
    setLoadingAssignments(true)
    try {
      const response = await fetch(`/api/workout-programs/${programId}/assignments`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments || [])
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoadingAssignments(false)
    }
  }

  const handleUnassign = async (programId: string, clientId: string) => {
    setUnassigning(clientId)
    try {
      const response = await fetch(`/api/workout-programs/${programId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })

      if (response.ok) {
        toast.success('Tilldelning borttagen!')
        await fetchAssignments(programId)
        await fetchPrograms()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ta bort tilldelningen')
      }
    } catch (error) {
      console.error('Error unassigning program:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setUnassigning(null)
    }
  }

  const handleAssignProgram = async () => {
    if (!selectedClientId || !selectedProgramId) {
      toast.error('Välj en klient')
      return
    }

    setAssigning(true)

    try {
      const response = await fetch(`/api/workout-programs/${selectedProgramId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selectedClientId })
      })

      if (response.ok) {
        toast.success('Träningsprogram tilldelat!')
        setSelectedClientId('')
        await fetchPrograms()
        if (selectedProgramId) {
          await fetchAssignments(selectedProgramId)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte tilldela programmet')
      }
    } catch (error) {
      console.error('Error assigning program:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setAssigning(false)
    }
  }

  const filterPrograms = () => {
    let filtered = programs

    if (searchTerm) {
      filtered = filtered.filter(prog =>
        prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // If a category is selected, filter by that category
    if (selectedCategoryId) {
      filtered = filtered.filter(prog => prog.categoryId === selectedCategoryId)
    }

    setFilteredPrograms(filtered)
  }

  const getProgramsByCategory = (categoryId: string | null) => {
    return filteredPrograms.filter(prog => prog.categoryId === categoryId)
  }

  const uncategorizedPrograms = getProgramsByCategory(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort detta träningsprogram?')) return

    try {
      const response = await fetch(`/api/workout-programs/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPrograms()
      }
    } catch (error) {
      console.error('Error deleting program:', error)
    }
  }

  const getDifficultyColor = (difficulty: string | null) => {
    if (!difficulty) return 'bg-gray-500/20 text-gray-400 border-gray-500/30'

    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || BookOpen
    return Icon
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setShowCategoryView(false)
  }

  const handleBackToCategories = () => {
    setSelectedCategoryId(null)
    setShowCategoryView(true)
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            Träningsprogram
          </h1>
          <p className="text-gray-400 mt-1">
            Skapa och hantera träningsprogram för dina klienter
          </p>
        </div>
        <Link href="/dashboard/content/workout-programs/create">
          <Button className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Skapa program
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-gold-primary/20 text-white placeholder:text-gray-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category View or Programs View */}
      {showCategoryView && categories.length > 0 ? (
        /* Category Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon)
            return (
              <Card
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-[rgba(30,30,35,0.6)] border border-gray-700 hover:border-gold-primary cursor-pointer transition-all hover:shadow-lg group"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${category.color}22, ${category.color}11)`,
                        border: `1px solid ${category.color}33`
                      }}
                    >
                      <Icon className="w-10 h-10" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-gold-light transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {category._count.programs} {category._count.programs === 1 ? 'program' : 'program'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        /* Programs Grid */
        <>
          {selectedCategoryId && (
            <Button
              variant="ghost"
              onClick={handleBackToCategories}
              className="text-gold-primary hover:text-gold-light hover:bg-gray-800 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka till kategorier
            </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map((program) => (
          <Card
            key={program.id}
            className="bg-white/5 border-2 border-gold-primary/20 hover:border-gold-primary/60 hover:shadow-lg transition-all backdrop-blur-[10px]"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-100 break-words">
                      {program.name}
                    </CardTitle>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/dashboard/content/workout-programs/${program.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gold-primary hover:text-gold-secondary hover:bg-white/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(program.id)}
                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {program.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {program.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-400">
                  <Calendar className="w-4 h-4 text-gold-primary" />
                  <span>{program.days.length} dagar</span>
                </div>
                {program.durationWeeks && (
                  <div className="text-gray-400">
                    {program.durationWeeks} veckor
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gold-primary/20">
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Users className="w-4 h-4 text-gold-primary" />
                  <span>{program._count.assignments} tilldelade</span>
                </div>

                {program.published ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Publicerad
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-500/20 border-gray-500/30 text-gray-400">
                    Utkast
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <Dialog open={assignDialogOpen && selectedProgramId === program.id} onOpenChange={(open) => {
                  setAssignDialogOpen(open)
                  if (!open) {
                    setSelectedProgramId(null)
                    setSelectedClientId('')
                    setAssignments([])
                  } else if (open) {
                    fetchAssignments(program.id)
                    if (clients.length === 1) {
                      // Auto-select if there's only one client
                      setSelectedClientId(clients[0].id)
                    }
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 border-gold-primary/30 text-gold-primary hover:bg-gold-primary/10"
                      onClick={() => setSelectedProgramId(program.id)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Tilldela
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-2 border-gold-primary/20 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Hantera tilldelningar</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Se och hantera vilka klienter som har &quot;{program.name}&quot; tilldelat
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      {/* Current Assignments */}
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Nuvarande tilldelningar
                        </h3>
                        {loadingAssignments ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-gold-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : assignments.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {assignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {assignment.user.name || assignment.user.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {assignment.user.email}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Tilldelad {new Date(assignment.createdAt).toLocaleDateString('sv-SE')}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnassign(program.id, assignment.userId)}
                                  disabled={unassigning === assignment.userId}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {unassigning === assignment.userId ? (
                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <X className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              Inga tilldelningar ännu
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Assign to New Client */}
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Tilldela till ny klient
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Välj klient
                            </label>
                            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                <SelectValue placeholder="Välj en klient..." />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.filter(client =>
                                  !assignments.some(a => a.userId === client.id)
                                ).map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name} ({client.email})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setAssignDialogOpen(false)
                                setSelectedProgramId(null)
                                setSelectedClientId('')
                                setAssignments([])
                              }}
                              className="border-gray-300 text-gray-700"
                            >
                              Stäng
                            </Button>
                            <Button
                              onClick={handleAssignProgram}
                              disabled={!selectedClientId || assigning}
                              className="bg-gradient-to-r from-gold-primary to-gold-secondary text-white"
                            >
                              {assigning ? 'Tilldelar...' : 'Tilldela'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Link href={`/dashboard/content/workout-programs/${program.id}/edit`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Visa detaljer
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>

          {filteredPrograms.length === 0 && (
            <Card className="bg-white border border-gray-200">
              <CardContent className="py-12 text-center">
                <Dumbbell className="w-12 h-12 text-gold-primary mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Inga träningsprogram hittades i denna kategori.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
