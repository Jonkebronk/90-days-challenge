'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, PlayCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

type LessonProgress = {
  completed: boolean
  lastSlideIndex: number
}

type Lesson = {
  id: string
  title: string
  description?: string | null
  phase?: number | null
  orderIndex: number
  coverImage?: string | null
  published: boolean
  prerequisiteIds: string[]
  slides: Array<{
    id: string
  }>
  progress?: LessonProgress[]
}

export default function ClientLessonsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (session?.user && (session.user as any).role !== 'coach') {
      fetchLessons()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchLessons = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/lessons?published=true')
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons)

        // Build set of completed lesson IDs
        const completed = new Set<string>()
        data.lessons.forEach((lesson: Lesson) => {
          if (lesson.progress && lesson.progress.length > 0 && lesson.progress[0].completed) {
            completed.add(lesson.id)
          }
        })
        setCompletedLessonIds(completed)
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

  const isLessonLocked = (lesson: Lesson): boolean => {
    if (!lesson.prerequisiteIds || lesson.prerequisiteIds.length === 0) {
      return false
    }

    // Check if all prerequisites are completed
    return !lesson.prerequisiteIds.every(prereqId => completedLessonIds.has(prereqId))
  }

  const getProgress = (lesson: Lesson): number => {
    if (!lesson.progress || lesson.progress.length === 0) return 0
    if (lesson.progress[0].completed) return 100

    const slideCount = lesson.slides.length
    if (slideCount === 0) return 0

    const lastSlide = lesson.progress[0].lastSlideIndex
    return Math.round((lastSlide / slideCount) * 100)
  }

  const getLessonsByPhase = (phase: number) => {
    return lessons
      .filter(lesson => lesson.phase === phase)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }

  const handleStartLesson = (lesson: Lesson) => {
    if (isLessonLocked(lesson)) {
      toast.error('Du måste slutföra föregående lektioner först')
      return
    }
    router.push(`/dashboard/lessons/${lesson.id}`)
  }

  if (!session?.user || (session.user as any).role?.toUpperCase() === 'COACH') {
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

  const phases = [
    { number: 1, title: 'Fas 1: Dag 1-30', description: 'Grundläggande lektioner' },
    { number: 2, title: 'Fas 2: Dag 31-60', description: 'Fördjupning' },
    { number: 3, title: 'Fas 3: Dag 61-90', description: 'Avancerade lektioner' },
  ]

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lektioner</h1>
        <p className="text-muted-foreground">
          Gå igenom lektionerna i din egen takt för att lära dig mer om ditt program
        </p>
      </div>

      <div className="space-y-8">
        {phases.map(phase => {
          const phaseLessons = getLessonsByPhase(phase.number)

          if (phaseLessons.length === 0) return null

          return (
            <div key={phase.number}>
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{phase.title}</h2>
                <p className="text-muted-foreground">{phase.description}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {phaseLessons.map(lesson => {
                  const locked = isLessonLocked(lesson)
                  const progress = getProgress(lesson)
                  const completed = completedLessonIds.has(lesson.id)

                  return (
                    <Card
                      key={lesson.id}
                      className={`relative overflow-hidden ${locked ? 'opacity-60' : 'hover:shadow-lg transition-shadow cursor-pointer'}`}
                      onClick={() => !locked && handleStartLesson(lesson)}
                    >
                      {lesson.coverImage && (
                        <div className="h-40 overflow-hidden bg-gray-100">
                          <img
                            src={lesson.coverImage}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{lesson.title}</CardTitle>
                          {locked && <Lock className="h-5 w-5 text-muted-foreground" />}
                          {completed && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {!locked && !completed && progress > 0 && (
                            <div className="text-xs text-muted-foreground">{progress}%</div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {lesson.slides.length} slides
                          </div>
                          {!locked && (
                            <Button size="sm" variant={completed ? 'outline' : 'default'}>
                              {completed ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Genomförd
                                </>
                              ) : progress > 0 ? (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Fortsätt
                                </>
                              ) : (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  Starta
                                </>
                              )}
                            </Button>
                          )}
                          {locked && (
                            <div className="text-xs text-muted-foreground flex items-center">
                              <Lock className="h-3 w-3 mr-1" />
                              Låst
                            </div>
                          )}
                        </div>
                        {!locked && progress > 0 && progress < 100 && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {lessons.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Inga lektioner tillgängliga ännu.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
