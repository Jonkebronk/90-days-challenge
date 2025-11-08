'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Trash2, Search, FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Lesson = {
  id: string
  title: string
  description?: string | null
  phase?: number | null
  orderIndex: number
  coverImage?: string | null
  published: boolean
  publishedAt?: string | null
  prerequisiteIds: string[]
  createdAt: string
  updatedAt: string
  slides: Array<{
    id: string
    type: string
    title?: string | null
    orderIndex: number
  }>
}

export default function LessonsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [phaseFilter, setPhaseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phase: 1,
    coverImage: '',
  })

  useEffect(() => {
    if (session?.user && (session.user as any).role?.toUpperCase() === 'COACH') {
      fetchLessons()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    filterLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons, searchQuery, phaseFilter, statusFilter])

  const fetchLessons = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/lessons')
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons)
      } else {
        toast.error('Kunde inte hämta lektioner')
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const filterLessons = () => {
    let filtered = [...lessons]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.description?.toLowerCase().includes(query)
      )
    }

    if (phaseFilter !== 'all') {
      filtered = filtered.filter((lesson) => lesson.phase === parseInt(phaseFilter))
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lesson) =>
        statusFilter === 'published' ? lesson.published : !lesson.published
      )
    }

    setFilteredLessons(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingLesson) {
        // Update existing lesson
        const response = await fetch(`/api/lessons/${editingLesson.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success('Lektion uppdaterad!')
          fetchLessons()
          setEditingLesson(null)
        } else {
          toast.error('Kunde inte uppdatera lektion')
        }
      } else {
        // Create new lesson
        const response = await fetch('/api/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          toast.success('Lektion skapad!')
          fetchLessons()
          setIsAddDialogOpen(false)
        } else {
          toast.error('Kunde inte skapa lektion')
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        phase: 1,
        coverImage: '',
      })
    } catch (error) {
      console.error('Error saving lesson:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna lektion?')) return

    try {
      const response = await fetch(`/api/lessons/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Lektion borttagen!')
        fetchLessons()
      } else {
        toast.error('Kunde inte ta bort lektion')
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const startEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      description: lesson.description || '',
      phase: lesson.phase || 1,
      coverImage: lesson.coverImage || '',
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      phase: 1,
      coverImage: '',
    })
    setEditingLesson(null)
  }

  const getPhaseLabel = (phase: number | null | undefined) => {
    if (!phase) return '-'
    return `Fas ${phase}`
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lektioner</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>
              Visar {filteredLessons.length} lektion{filteredLessons.length !== 1 ? 'er' : ''}
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till lektion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Skapa en lektion</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beskrivning</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phase">Fas *</Label>
                    <Select
                      value={formData.phase.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, phase: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Fas 1 (Dag 1-30)</SelectItem>
                        <SelectItem value="2">Fas 2 (Dag 31-60)</SelectItem>
                        <SelectItem value="3">Fas 3 (Dag 61-90)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="coverImage">Omslagsbild URL</Label>
                    <Input
                      id="coverImage"
                      placeholder="https://example.com/image.jpg"
                      value={formData.coverImage}
                      onChange={(e) =>
                        setFormData({ ...formData, coverImage: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false)
                        resetForm()
                      }}
                    >
                      Avbryt
                    </Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      Skapa lektion
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök efter titel eller beskrivning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla faser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla faser</SelectItem>
                <SelectItem value="1">Fas 1</SelectItem>
                <SelectItem value="2">Fas 2</SelectItem>
                <SelectItem value="3">Fas 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla</SelectItem>
                <SelectItem value="published">Publicerad</SelectItem>
                <SelectItem value="draft">Utkast</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Laddar...</p>
          ) : filteredLessons.length === 0 ? (
            <p className="text-muted-foreground">Inga lektioner hittades.</p>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b font-semibold text-sm">
                <div className="col-span-4">Titel</div>
                <div className="col-span-2">Fas</div>
                <div className="col-span-2">Slides</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2"></div>
              </div>

              {/* Table rows */}
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b items-center hover:bg-gray-50"
                >
                  <div className="col-span-4 font-medium">{lesson.title}</div>
                  <div className="col-span-2 text-muted-foreground text-sm">
                    {getPhaseLabel(lesson.phase)}
                  </div>
                  <div className="col-span-2 text-muted-foreground text-sm">
                    {lesson.slides?.length || 0} slides
                  </div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        lesson.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {lesson.published ? 'Publicerad' : 'Utkast'}
                    </span>
                  </div>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/content/lessons/${lesson.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Slides
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => startEdit(lesson)}
                          className="p-2 hover:bg-gray-200 rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Redigera lektion</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="edit-title">Titel *</Label>
                            <Input
                              id="edit-title"
                              value={formData.title}
                              onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-description">Beskrivning</Label>
                            <Textarea
                              id="edit-description"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                              }
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-phase">Fas *</Label>
                            <Select
                              value={formData.phase.toString()}
                              onValueChange={(value) =>
                                setFormData({ ...formData, phase: parseInt(value) })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Fas 1 (Dag 1-30)</SelectItem>
                                <SelectItem value="2">Fas 2 (Dag 31-60)</SelectItem>
                                <SelectItem value="3">Fas 3 (Dag 61-90)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="edit-coverImage">Omslagsbild URL</Label>
                            <Input
                              id="edit-coverImage"
                              placeholder="https://example.com/image.jpg"
                              value={formData.coverImage}
                              onChange={(e) =>
                                setFormData({ ...formData, coverImage: e.target.value })
                              }
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingLesson(null)
                                resetForm()
                              }}
                            >
                              Avbryt
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700">
                              Spara
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
