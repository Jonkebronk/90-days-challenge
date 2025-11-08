'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Clock, Dumbbell, Trash2, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  category: string | null
  estimatedDuration: number | null
  isPublic: boolean
  usageCount: number
  exercises: Array<{
    id: string
    sets: number
    repsMin: number | null
    repsMax: number | null
    exercise: {
      id: string
      name: string
      muscleGroups: string[]
    }
  }>
}

export default function WorkoutTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/workout-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = async (templateId: string) => {
    try {
      const response = await fetch(`/api/workout-templates/${templateId}/start`, {
        method: 'POST'
      })

      if (response.ok) {
        const { sessionLog } = await response.json()
        router.push(`/dashboard/workout/session/template/${sessionLog.id}`)
      } else {
        alert('Kunde inte starta träningspasset')
      }
    } catch (error) {
      console.error('Error starting workout:', error)
      alert('Ett fel uppstod')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) {
      return
    }

    try {
      const response = await fetch(`/api/workout-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      } else {
        alert('Kunde inte ta bort mallen')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Ett fel uppstod')
    }
  }

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'strength':
        return 'bg-[rgba(220,53,69,0.2)] text-[#dc3545] border-[rgba(220,53,69,0.3)]'
      case 'cardio':
        return 'bg-[rgba(0,123,255,0.2)] text-[#007bff] border-[rgba(0,123,255,0.3)]'
      case 'hiit':
        return 'bg-[rgba(255,193,7,0.2)] text-[#ffc107] border-[rgba(255,193,7,0.3)]'
      case 'stretching':
      case 'mobility':
        return 'bg-[rgba(40,167,69,0.2)] text-[#28a745] border-[rgba(40,167,69,0.3)]'
      default:
        return 'bg-[rgba(139,92,246,0.2)] text-[#8b5cf6] border-[rgba(139,92,246,0.3)]'
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
            Träningsmallar
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Dina sparade träningspass och publika mallar
          </p>
        </div>
        <Link href="/dashboard/workout/builder">
          <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Skapa ny mall
          </Button>
        </Link>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="py-12 text-center">
            <Dumbbell className="w-16 h-16 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[rgba(255,255,255,0.9)] mb-2">
              Inga träningsmallar ännu
            </h3>
            <p className="text-[rgba(255,255,255,0.6)] max-w-md mx-auto mb-4">
              Skapa din första anpassade träningspass för snabb tillgång när som helst
            </p>
            <Link href="/dashboard/workout/builder">
              <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Skapa första mallen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] transition-all"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-[rgba(255,255,255,0.9)]">
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <p className="text-sm text-[rgba(255,255,255,0.6)] mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {template.category && (
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  )}
                  {template.isPublic && (
                    <Badge variant="outline" className="bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.3)] text-[#8b5cf6]">
                      <Users className="w-3 h-3 mr-1" />
                      Publik
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                    <Dumbbell className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                    <span>{template.exercises.length} övningar</span>
                  </div>
                  {template.estimatedDuration && (
                    <div className="flex items-center gap-2 text-[rgba(255,255,255,0.7)]">
                      <Clock className="w-4 h-4 text-[rgba(255,215,0,0.7)]" />
                      <span>{template.estimatedDuration} min</span>
                    </div>
                  )}
                </div>

                {template.exercises.length > 0 && (
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {template.exercises.slice(0, 4).map((ex, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-[rgba(255,255,255,0.6)] truncate"
                      >
                        • {ex.exercise.name} - {ex.sets} x {ex.repsMin}{ex.repsMax && ex.repsMax !== ex.repsMin ? `-${ex.repsMax}` : ''}
                      </div>
                    ))}
                    {template.exercises.length > 4 && (
                      <p className="text-xs text-[rgba(255,255,255,0.4)]">
                        +{template.exercises.length - 4} fler övningar
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-[rgba(255,215,0,0.1)] flex gap-2">
                  <Button
                    onClick={() => handleStartWorkout(template.id)}
                    className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Starta
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-[rgba(255,100,100,0.8)] hover:text-[#ff6464] hover:bg-[rgba(255,100,100,0.1)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {template.usageCount > 0 && (
                  <p className="text-xs text-[rgba(255,255,255,0.4)] text-center">
                    Använd {template.usageCount} {template.usageCount === 1 ? 'gång' : 'gånger'}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
