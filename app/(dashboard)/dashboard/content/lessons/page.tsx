'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Trash2, Search, FileIcon, Video, Mic } from 'lucide-react'
import { toast } from 'sonner'

type Lesson = {
  id: string
  title: string
  subtitle?: string | null
  content: string
  coverImage?: string | null
  attachments: string[]
  videoUrl?: string | null
  audioUrl?: string | null
  visibility: string
  orderIndex?: number | null
  createdAt: string
  updatedAt: string
}

export default function LessonsPage() {
  const { data: session } = useSession()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    content: '',
    coverImage: '',
    videoUrl: '',
    audioUrl: '',
  })

  useEffect(() => {
    if (session?.user?.role === 'coach') {
      fetchLessons()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  useEffect(() => {
    filterLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons, searchQuery])

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
          lesson.subtitle?.toLowerCase().includes(query) ||
          lesson.content.toLowerCase().includes(query)
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
          method: 'PATCH',
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
        subtitle: '',
        content: '',
        coverImage: '',
        videoUrl: '',
        audioUrl: '',
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
      subtitle: lesson.subtitle || '',
      content: lesson.content,
      coverImage: lesson.coverImage || '',
      videoUrl: lesson.videoUrl || '',
      audioUrl: lesson.audioUrl || '',
    })
  }

  if (session?.user?.role !== 'coach') {
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
          <div className="flex justify-between items-center">
            <CardTitle>
              Visar {filteredLessons.length} lektion{filteredLessons.length !== 1 ? 'er' : ''}
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Lägg till lektion
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                      <Label htmlFor="subtitle">Undertitel</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) =>
                          setFormData({ ...formData, subtitle: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">Meddelande *</Label>
                      <div className="border rounded-lg">
                        <div className="flex gap-2 p-2 border-b bg-gray-50">
                          <button
                            type="button"
                            className="px-2 py-1 hover:bg-gray-200 rounded text-sm"
                            title="Bold"
                          >
                            <strong>B</strong>
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 hover:bg-gray-200 rounded text-sm"
                            title="Italic"
                          >
                            <em>I</em>
                          </button>
                          <button
                            type="button"
                            className="px-2 py-1 hover:bg-gray-200 rounded text-sm"
                            title="Underline"
                          >
                            <u>U</u>
                          </button>
                        </div>
                        <Textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                          }
                          rows={8}
                          className="border-0 focus-visible:ring-0"
                          required
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          😊 Lägg till emoji
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {'{}'} Lägg till &quot;förnamn&quot;
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Media *</Label>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium">Omslagsbild</p>
                              <p className="text-sm text-muted-foreground">
                                Dra hit filer eller klicka för...{' '}
                                <span className="text-green-600">Bläddra</span>
                              </p>
                            </div>
                          </div>
                          <Input
                            placeholder="Bild-URL"
                            value={formData.coverImage}
                            onChange={(e) =>
                              setFormData({ ...formData, coverImage: e.target.value })
                            }
                            className="mt-2"
                          />
                        </div>

                        <div className="border-2 border-dashed rounded-lg p-6">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <FileIcon className="h-6 w-6 text-gray-400" />
                            </div>
                            <div className="text-center">
                              <p className="font-medium">Ladda upp filer</p>
                              <p className="text-sm text-muted-foreground">
                                Dra hit filer eller klicka för...{' '}
                                <span className="text-green-600">Bläddra</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                            <Video className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">Spela in video</p>
                            <p className="text-xs text-muted-foreground">
                              Klicka för att spela in en video
                            </p>
                            <Input
                              placeholder="Video-URL"
                              value={formData.videoUrl}
                              onChange={(e) =>
                                setFormData({ ...formData, videoUrl: e.target.value })
                              }
                              className="mt-2"
                            />
                          </div>
                          <div className="border rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                            <Mic className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">Spela in ljud</p>
                            <p className="text-xs text-muted-foreground">
                              Klicka för att spela in ljud
                            </p>
                            <Input
                              placeholder="Ljud-URL"
                              value={formData.audioUrl}
                              onChange={(e) =>
                                setFormData({ ...formData, audioUrl: e.target.value })
                              }
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddDialogOpen(false)
                          setFormData({
                            title: '',
                            subtitle: '',
                            content: '',
                            coverImage: '',
                            videoUrl: '',
                            audioUrl: '',
                          })
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Lägg till lektion
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Laddar...</p>
          ) : filteredLessons.length === 0 ? (
            <p className="text-muted-foreground">Inga lektioner hittades.</p>
          ) : (
            <div className="space-y-4">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-2 border-b font-semibold text-sm">
                <div className="col-span-4">Titel</div>
                <div className="col-span-2">Viktmål</div>
                <div className="col-span-2">Viktmål</div>
                <div className="col-span-2">Kön</div>
                <div className="col-span-2"></div>
              </div>

              {/* Table rows */}
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b items-center hover:bg-gray-50"
                >
                  <div className="col-span-4 font-medium">{lesson.title}</div>
                  <div className="col-span-2 text-muted-foreground text-sm">Alla</div>
                  <div className="col-span-2 text-muted-foreground text-sm">Alla</div>
                  <div className="col-span-2 text-muted-foreground text-sm">Alla</div>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => startEdit(lesson)}
                          className="p-2 hover:bg-gray-200 rounded"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
                            <Label htmlFor="edit-subtitle">Undertitel</Label>
                            <Input
                              id="edit-subtitle"
                              value={formData.subtitle}
                              onChange={(e) =>
                                setFormData({ ...formData, subtitle: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-content">Meddelande *</Label>
                            <Textarea
                              id="edit-content"
                              value={formData.content}
                              onChange={(e) =>
                                setFormData({ ...formData, content: e.target.value })
                              }
                              rows={8}
                              required
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingLesson(null)
                                setFormData({
                                  title: '',
                                  subtitle: '',
                                  content: '',
                                  coverImage: '',
                                  videoUrl: '',
                                  audioUrl: '',
                                })
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
