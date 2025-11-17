'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, Calendar, Users, ChevronRight, UserPlus } from 'lucide-react'
import Link from 'next/link'
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

interface WorkoutProgram {
  id: string
  name: string
  description: string | null
  difficulty: string | null
  durationWeeks: number | null
  published: boolean
  days: any[]
  _count: {
    assignments: number
  }
  createdAt: string
}

export default function WorkoutProgramsPage() {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<WorkoutProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)

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
        setAssignDialogOpen(false)
        setSelectedClientId('')
        setSelectedProgramId(null)
        await fetchPrograms()
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

    setFilteredPrograms(filtered)
  }

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
    if (!difficulty) return 'bg-gray-100 text-gray-600'

    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-600'
    }
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
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-gray-900"
            />
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((program) => (
          <Card
            key={program.id}
            className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center shrink-0">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900 break-words">
                      {program.name}
                    </CardTitle>
                    {program.difficulty && (
                      <Badge className={`text-xs mt-2 ${getDifficultyColor(program.difficulty)}`}>
                        {program.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Link href={`/dashboard/content/workout-programs/${program.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gold-primary hover:text-gold-secondary hover:bg-gray-100"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(program.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {program.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {program.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="w-4 h-4 text-gold-primary" />
                  <span>{program.days.length} dagar</span>
                </div>
                {program.durationWeeks && (
                  <div className="text-gray-600">
                    {program.durationWeeks} veckor
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-gold-primary" />
                  <span>{program._count.assignments} tilldelade</span>
                </div>

                {program.published ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Publicerad
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-50 border-gray-300 text-gray-500">
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
                  } else if (open && clients.length === 1) {
                    // Auto-select if there's only one client
                    setSelectedClientId(clients[0].id)
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
                  <DialogContent className="bg-white border-2 border-gold-primary/20">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900">Tilldela träningsprogram</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Välj en klient att tilldela &quot;{program.name}&quot; till
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Välj klient
                        </label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                          <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Välj en klient..." />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
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
                          }}
                          className="border-gray-300 text-gray-700"
                        >
                          Avbryt
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
              Inga träningsprogram hittades. Skapa ditt första program!
            </p>
            <Link href="/dashboard/content/workout-programs/create">
              <Button className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Skapa program
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
