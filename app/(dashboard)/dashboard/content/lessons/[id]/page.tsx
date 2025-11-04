'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FileText,
  Video,
  HelpCircle,
  Eye,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'
import { VideoEmbed } from '@/components/video-embed'

type Slide = {
  id: string
  type: string
  title?: string | null
  content?: string | null
  videoUrl?: string | null
  orderIndex: number
  quizOptions?: any
}

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
  slides: Slide[]
}

export default function LessonEditorPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAddSlideDialogOpen, setIsAddSlideDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null)

  // Lesson metadata form
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    phase: 1,
    coverImage: '',
    published: false,
  })

  // Slide form
  const [slideData, setSlideData] = useState<{
    type: string
    title: string
    content: string
    videoUrl: string
    quizOptions: Array<{ text: string; correct: boolean; explanation?: string }>
  }>({
    type: 'MDX_SLIDE',
    title: '',
    content: '',
    videoUrl: '',
    quizOptions: [],
  })

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'coach') {
      fetchLesson()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, lessonId])

  const fetchLesson = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/lessons/${lessonId}`)
      if (response.ok) {
        const data = await response.json()
        setLesson(data.lesson)
        setLessonData({
          title: data.lesson.title,
          description: data.lesson.description || '',
          phase: data.lesson.phase || 1,
          coverImage: data.lesson.coverImage || '',
          published: data.lesson.published,
        })
      } else {
        toast.error('Kunde inte hämta lektion')
        router.push('/dashboard/content/lessons')
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveLessonMetadata = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
      })

      if (response.ok) {
        toast.success('Lektion uppdaterad!')
        fetchLesson()
      } else {
        toast.error('Kunde inte uppdatera lektion')
      }
    } catch (error) {
      console.error('Error updating lesson:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const nextOrderIndex = lesson?.slides.length || 0
      const response = await fetch(`/api/lessons/${lessonId}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...slideData,
          orderIndex: nextOrderIndex,
        }),
      })

      if (response.ok) {
        toast.success('Slide tillagd!')
        fetchLesson()
        setIsAddSlideDialogOpen(false)
        resetSlideForm()
      } else {
        toast.error('Kunde inte lägga till slide')
      }
    } catch (error) {
      console.error('Error adding slide:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleUpdateSlide = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingSlide) return

    try {
      const response = await fetch(
        `/api/lessons/${lessonId}/slides/${editingSlide.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slideData),
        }
      )

      if (response.ok) {
        toast.success('Slide uppdaterad!')
        fetchLesson()
        setEditingSlide(null)
        resetSlideForm()
      } else {
        toast.error('Kunde inte uppdatera slide')
      }
    } catch (error) {
      console.error('Error updating slide:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna slide?')) return

    try {
      const response = await fetch(`/api/lessons/${lessonId}/slides/${slideId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Slide borttagen!')
        fetchLesson()
      } else {
        toast.error('Kunde inte ta bort slide')
      }
    } catch (error) {
      console.error('Error deleting slide:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const startEditSlide = (slide: Slide) => {
    setEditingSlide(slide)
    setSlideData({
      type: slide.type,
      title: slide.title || '',
      content: slide.content || '',
      videoUrl: slide.videoUrl || '',
      quizOptions: (slide.quizOptions as any) || [],
    })
  }

  const resetSlideForm = () => {
    setSlideData({
      type: 'MDX_SLIDE',
      title: '',
      content: '',
      videoUrl: '',
      quizOptions: [],
    })
  }

  const getSlideIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="h-4 w-4" />
      case 'QUIZ':
        return <HelpCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getSlideTypeLabel = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return 'Video'
      case 'QUIZ':
        return 'Quiz'
      default:
        return 'MDX Slide'
    }
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Lektion hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/content/lessons')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Förhandsgranska
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Lesson Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Lektion information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lesson-title">Titel *</Label>
                <Input
                  id="lesson-title"
                  value={lessonData.title}
                  onChange={(e) =>
                    setLessonData({ ...lessonData, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lesson-phase">Fas *</Label>
                <Select
                  value={lessonData.phase.toString()}
                  onValueChange={(value) =>
                    setLessonData({ ...lessonData, phase: parseInt(value) })
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
            </div>
            <div>
              <Label htmlFor="lesson-description">Beskrivning</Label>
              <Textarea
                id="lesson-description"
                value={lessonData.description}
                onChange={(e) =>
                  setLessonData({ ...lessonData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="lesson-coverImage">Omslagsbild URL</Label>
              <Input
                id="lesson-coverImage"
                placeholder="https://example.com/image.jpg"
                value={lessonData.coverImage}
                onChange={(e) =>
                  setLessonData({ ...lessonData, coverImage: e.target.value })
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lesson-published"
                  checked={lessonData.published}
                  onChange={(e) =>
                    setLessonData({ ...lessonData, published: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="lesson-published" className="cursor-pointer">
                  Publicerad
                </Label>
              </div>
              <Button
                onClick={handleSaveLessonMetadata}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Sparar...' : 'Spara ändringar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Slides Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Slides ({lesson.slides.length})</CardTitle>
              <Dialog open={isAddSlideDialogOpen} onOpenChange={setIsAddSlideDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till slide
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Lägg till slide</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSlide} className="space-y-4">
                    <div>
                      <Label htmlFor="slide-type">Slide typ *</Label>
                      <Select
                        value={slideData.type}
                        onValueChange={(value) =>
                          setSlideData({ ...slideData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MDX_SLIDE">MDX Slide</SelectItem>
                          <SelectItem value="VIDEO">Video</SelectItem>
                          <SelectItem value="QUIZ">Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="slide-title">Titel</Label>
                      <Input
                        id="slide-title"
                        value={slideData.title}
                        onChange={(e) =>
                          setSlideData({ ...slideData, title: e.target.value })
                        }
                      />
                    </div>
                    {slideData.type === 'MDX_SLIDE' && (
                      <div>
                        <Label>MDX innehåll</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label htmlFor="slide-content" className="text-xs text-muted-foreground">
                              Editor
                            </Label>
                            <Textarea
                              id="slide-content"
                              value={slideData.content}
                              onChange={(e) =>
                                setSlideData({ ...slideData, content: e.target.value })
                              }
                              rows={10}
                              placeholder="# Rubrik&#10;&#10;Din MDX-innehåll här..."
                              className="font-mono text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Preview</Label>
                            <div className="border rounded-lg p-3 h-[246px] overflow-y-auto bg-gray-50">
                              {slideData.content ? (
                                <MDXPreview content={slideData.content} />
                              ) : (
                                <p className="text-muted-foreground text-sm">
                                  Skriv MDX-innehåll för att se förhandsgranskning
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {slideData.type === 'VIDEO' && (
                      <div>
                        <Label htmlFor="slide-videoUrl">Video URL (YouTube/Vimeo)</Label>
                        <Input
                          id="slide-videoUrl"
                          value={slideData.videoUrl}
                          onChange={(e) =>
                            setSlideData({ ...slideData, videoUrl: e.target.value })
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                        {slideData.videoUrl && (
                          <div className="mt-4">
                            <Label className="text-xs text-muted-foreground">Preview</Label>
                            <div className="mt-2">
                              <VideoEmbed url={slideData.videoUrl} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {slideData.type === 'QUIZ' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="slide-content">Fråga *</Label>
                          <Textarea
                            id="slide-content"
                            value={slideData.content}
                            onChange={(e) =>
                              setSlideData({ ...slideData, content: e.target.value })
                            }
                            rows={3}
                            placeholder="Vad är svaret på livet, universum och allting?"
                            required
                          />
                        </div>
                        <div>
                          <Label>Svarsalternativ</Label>
                          <div className="space-y-2 mt-2">
                            {slideData.quizOptions.map((option, index) => (
                              <div key={index} className="flex gap-2 items-start">
                                <Input
                                  value={option.text}
                                  onChange={(e) => {
                                    const newOptions = [...slideData.quizOptions]
                                    newOptions[index].text = e.target.value
                                    setSlideData({ ...slideData, quizOptions: newOptions })
                                  }}
                                  placeholder={`Alternativ ${index + 1}`}
                                  className="flex-1"
                                />
                                <label className="flex items-center gap-2 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={option.correct}
                                    onChange={(e) => {
                                      const newOptions = [...slideData.quizOptions]
                                      newOptions[index].correct = e.target.checked
                                      setSlideData({ ...slideData, quizOptions: newOptions })
                                    }}
                                    className="h-4 w-4"
                                  />
                                  <span className="text-sm">Rätt</span>
                                </label>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = slideData.quizOptions.filter((_, i) => i !== index)
                                    setSlideData({ ...slideData, quizOptions: newOptions })
                                  }}
                                >
                                  Ta bort
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSlideData({
                                ...slideData,
                                quizOptions: [...slideData.quizOptions, { text: '', correct: false }],
                              })
                            }}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Lägg till alternativ
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsAddSlideDialogOpen(false)
                          resetSlideForm()
                        }}
                      >
                        Avbryt
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Lägg till
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {lesson.slides.length === 0 ? (
              <p className="text-muted-foreground">
                Inga slides ännu. Klicka på knappen ovan för att lägga till en slide.
              </p>
            ) : (
              <div className="space-y-2">
                {lesson.slides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="cursor-move text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {getSlideIcon(slide.type)}
                      <span className="text-sm text-muted-foreground">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {slide.title || `${getSlideTypeLabel(slide.type)} ${index + 1}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getSlideTypeLabel(slide.type)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => startEditSlide(slide)}
                            className="p-2 hover:bg-gray-200 rounded"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Redigera slide</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleUpdateSlide} className="space-y-4">
                            <div>
                              <Label htmlFor="edit-slide-type">Slide typ *</Label>
                              <Select
                                value={slideData.type}
                                onValueChange={(value) =>
                                  setSlideData({ ...slideData, type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MDX_SLIDE">MDX Slide</SelectItem>
                                  <SelectItem value="VIDEO">Video</SelectItem>
                                  <SelectItem value="QUIZ">Quiz</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="edit-slide-title">Titel</Label>
                              <Input
                                id="edit-slide-title"
                                value={slideData.title}
                                onChange={(e) =>
                                  setSlideData({ ...slideData, title: e.target.value })
                                }
                              />
                            </div>
                            {slideData.type === 'MDX_SLIDE' && (
                              <div>
                                <Label>MDX innehåll</Label>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                  <div>
                                    <Label htmlFor="edit-slide-content" className="text-xs text-muted-foreground">
                                      Editor
                                    </Label>
                                    <Textarea
                                      id="edit-slide-content"
                                      value={slideData.content}
                                      onChange={(e) =>
                                        setSlideData({ ...slideData, content: e.target.value })
                                      }
                                      rows={10}
                                      className="font-mono text-sm"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Preview</Label>
                                    <div className="border rounded-lg p-3 h-[246px] overflow-y-auto bg-gray-50">
                                      {slideData.content ? (
                                        <MDXPreview content={slideData.content} />
                                      ) : (
                                        <p className="text-muted-foreground text-sm">
                                          Skriv MDX-innehåll för att se förhandsgranskning
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {slideData.type === 'VIDEO' && (
                              <div>
                                <Label htmlFor="edit-slide-videoUrl">
                                  Video URL (YouTube/Vimeo)
                                </Label>
                                <Input
                                  id="edit-slide-videoUrl"
                                  value={slideData.videoUrl}
                                  onChange={(e) =>
                                    setSlideData({ ...slideData, videoUrl: e.target.value })
                                  }
                                />
                                {slideData.videoUrl && (
                                  <div className="mt-4">
                                    <Label className="text-xs text-muted-foreground">Preview</Label>
                                    <div className="mt-2">
                                      <VideoEmbed url={slideData.videoUrl} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {slideData.type === 'QUIZ' && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit-slide-content">Fråga *</Label>
                                  <Textarea
                                    id="edit-slide-content"
                                    value={slideData.content}
                                    onChange={(e) =>
                                      setSlideData({ ...slideData, content: e.target.value })
                                    }
                                    rows={3}
                                    placeholder="Vad är svaret på livet, universum och allting?"
                                    required
                                  />
                                </div>
                                <div>
                                  <Label>Svarsalternativ</Label>
                                  <div className="space-y-2 mt-2">
                                    {slideData.quizOptions.map((option, index) => (
                                      <div key={index} className="flex gap-2 items-start">
                                        <Input
                                          value={option.text}
                                          onChange={(e) => {
                                            const newOptions = [...slideData.quizOptions]
                                            newOptions[index].text = e.target.value
                                            setSlideData({ ...slideData, quizOptions: newOptions })
                                          }}
                                          placeholder={`Alternativ ${index + 1}`}
                                          className="flex-1"
                                        />
                                        <label className="flex items-center gap-2 whitespace-nowrap">
                                          <input
                                            type="checkbox"
                                            checked={option.correct}
                                            onChange={(e) => {
                                              const newOptions = [...slideData.quizOptions]
                                              newOptions[index].correct = e.target.checked
                                              setSlideData({ ...slideData, quizOptions: newOptions })
                                            }}
                                            className="h-4 w-4"
                                          />
                                          <span className="text-sm">Rätt</span>
                                        </label>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const newOptions = slideData.quizOptions.filter((_, i) => i !== index)
                                            setSlideData({ ...slideData, quizOptions: newOptions })
                                          }}
                                        >
                                          Ta bort
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSlideData({
                                        ...slideData,
                                        quizOptions: [...slideData.quizOptions, { text: '', correct: false }],
                                      })
                                    }}
                                    className="mt-2"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Lägg till alternativ
                                  </Button>
                                </div>
                              </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setEditingSlide(null)
                                  resetSlideForm()
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
                        onClick={() => handleDeleteSlide(slide.id)}
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
    </div>
  )
}
