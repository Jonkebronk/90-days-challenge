'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Dumbbell, Calendar, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

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

  useEffect(() => {
    fetchPrograms()
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
    if (!difficulty) return 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]'

    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-[rgba(40,167,69,0.2)] text-[#28a745] border-[rgba(40,167,69,0.3)]'
      case 'intermediate':
        return 'bg-[rgba(255,193,7,0.2)] text-[#ffc107] border-[rgba(255,193,7,0.3)]'
      case 'advanced':
        return 'bg-[rgba(220,53,69,0.2)] text-[#dc3545] border-[rgba(220,53,69,0.3)]'
      default:
        return 'bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)]'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[rgba(255,255,255,0.9)]">
            Träningsprogram
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Skapa och hantera träningsprogram för dina klienter
          </p>
        </div>
        <Link href="/dashboard/content/workout-programs/create">
          <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Skapa program
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
            <Input
              placeholder="Sök program..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrograms.map((program) => (
          <Card
            key={program.id}
            className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] transition-all"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center shrink-0">
                    <Dumbbell className="w-6 h-6 text-[#0a0a0a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-[rgba(255,255,255,0.9)] break-words">
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
                      className="h-8 w-8 text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(program.id)}
                    className="h-8 w-8 text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {program.description && (
                <p className="text-sm text-[rgba(255,255,255,0.6)] line-clamp-2">
                  {program.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-[rgba(255,255,255,0.6)]">
                  <Calendar className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <span>{program.days.length} dagar</span>
                </div>
                {program.durationWeeks && (
                  <div className="text-[rgba(255,255,255,0.6)]">
                    {program.durationWeeks} veckor
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,215,0,0.1)]">
                <div className="flex items-center gap-1 text-sm text-[rgba(255,255,255,0.6)]">
                  <Users className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                  <span>{program._count.assignments} tilldelade</span>
                </div>

                {program.published ? (
                  <Badge className="bg-[rgba(40,167,69,0.2)] text-[#28a745] border-[rgba(40,167,69,0.3)]">
                    Publicerad
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-[rgba(255,255,255,0.5)]">
                    Utkast
                  </Badge>
                )}
              </div>

              <Link href={`/dashboard/content/workout-programs/${program.id}/edit`}>
                <Button
                  variant="outline"
                  className="w-full border-[rgba(255,215,0,0.3)] text-[rgba(255,215,0,0.9)] hover:bg-[rgba(255,215,0,0.1)] mt-2"
                >
                  Visa detaljer
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-12 h-12 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
            <p className="text-[rgba(255,255,255,0.6)] mb-4">
              Inga träningsprogram hittades. Skapa ditt första program!
            </p>
            <Link href="/dashboard/content/workout-programs/create">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90">
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
