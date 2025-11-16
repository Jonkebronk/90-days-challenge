'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'
import { VideoEmbed } from '@/components/video-embed'
import { Quiz } from '@/components/quiz'
import { DocumentViewer } from '@/components/document-viewer'

type Slide = {
  id: string
  type: string
  title?: string | null
  content?: string | null
  videoUrl?: string | null
  documentUrl?: string | null
  orderIndex: number
  quizOptions?: any
}

type LessonProgress = {
  completed: boolean
  lastSlideIndex: number
}

type Lesson = {
  id: string
  title: string
  description?: string | null
  slides: Slide[]
  progress?: LessonProgress[]
}

export default function LessonViewerPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isSavingProgress, setIsSavingProgress] = useState(false)

  useEffect(() => {
    if (session?.user) {
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

        // Set current slide to last viewed slide
        if (data.lesson.progress && data.lesson.progress.length > 0) {
          const lastIndex = data.lesson.progress[0].lastSlideIndex || 0
          setCurrentSlideIndex(Math.min(lastIndex, data.lesson.slides.length - 1))
        }
      } else {
        toast.error('Kunde inte hämta lektion')
        router.push('/dashboard/lessons')
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const saveProgress = async (slideIndex: number, completed = false) => {
    try {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastSlideIndex: slideIndex,
          completed,
        }),
      })
    } catch (error) {
      console.error('Error saving progress:', error)
    }
  }

  const handleNextSlide = () => {
    if (!lesson) return

    const nextIndex = currentSlideIndex + 1
    if (nextIndex < lesson.slides.length) {
      setCurrentSlideIndex(nextIndex)
      saveProgress(nextIndex)
    }
  }

  const handlePreviousSlide = () => {
    const prevIndex = currentSlideIndex - 1
    if (prevIndex >= 0) {
      setCurrentSlideIndex(prevIndex)
    }
  }

  const handleCompleteLesson = async () => {
    if (!lesson) return

    try {
      setIsSavingProgress(true)
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastSlideIndex: lesson.slides.length - 1,
          completed: true,
        }),
      })
      toast.success('Grattis! Du har slutfört lektionen!')
      router.push('/dashboard/lessons')
    } catch (error) {
      console.error('Error completing lesson:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSavingProgress(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCoach = (session.user as any).role?.toUpperCase() === 'COACH'

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

  const currentSlide = lesson.slides[currentSlideIndex]
  const isFirstSlide = currentSlideIndex === 0
  const isLastSlide = currentSlideIndex === lesson.slides.length - 1
  const progressPercentage = Math.round(((currentSlideIndex + 1) / lesson.slides.length) * 100)
  const isCompleted = lesson.progress && lesson.progress.length > 0 && lesson.progress[0].completed

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/lessons')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till lektioner
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-lg font-bold">{lesson.title}</h1>
              <p className="text-sm text-muted-foreground">
                Slide {currentSlideIndex + 1} av {lesson.slides.length}
              </p>
            </div>
            <div className="w-32 text-right">
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="min-h-[500px]">
            <CardContent className="p-8">
              {currentSlide.title && (
                <h2 className="text-2xl font-bold mb-6">{currentSlide.title}</h2>
              )}

              {/* MDX Slide */}
              {currentSlide.type === 'MDX_SLIDE' && currentSlide.content && (
                <div className="prose prose-lg max-w-none">
                  <MDXPreview content={currentSlide.content} />
                </div>
              )}

              {/* Video Slide */}
              {currentSlide.type === 'VIDEO' && currentSlide.videoUrl && (
                <div className="space-y-4">
                  {currentSlide.content && (
                    <div className="prose max-w-none mb-6">
                      <MDXPreview content={currentSlide.content} />
                    </div>
                  )}
                  <VideoEmbed url={currentSlide.videoUrl} title={currentSlide.title || undefined} />
                </div>
              )}

              {/* Quiz Slide */}
              {currentSlide.type === 'QUIZ' && currentSlide.content && (
                <div className="space-y-6">
                  {currentSlide.quizOptions && Array.isArray(currentSlide.quizOptions) ? (
                    <Quiz
                      question={currentSlide.content}
                      options={currentSlide.quizOptions}
                    />
                  ) : (
                    <div>
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="font-medium text-lg">{currentSlide.content}</p>
                      </div>
                      <div className="text-sm text-muted-foreground mt-4">
                        Inga svarsalternativ har lagts till än. Coach måste konfigurera quizet.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Document Slide */}
              {currentSlide.type === 'DOCUMENT' && currentSlide.documentUrl && (
                <div className="space-y-4">
                  {currentSlide.content && (
                    <div className="prose max-w-none mb-6">
                      <MDXPreview content={currentSlide.content} />
                    </div>
                  )}
                  <DocumentViewer url={currentSlide.documentUrl} title={currentSlide.title || undefined} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousSlide}
              disabled={isFirstSlide}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Föregående
            </Button>

            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Genomförd</span>
              </div>
            )}

            {isLastSlide && !isCompleted ? (
              <Button
                onClick={handleCompleteLesson}
                disabled={isSavingProgress}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isSavingProgress ? 'Sparar...' : 'Slutför lektion'}
              </Button>
            ) : (
              <Button
                onClick={handleNextSlide}
                disabled={isLastSlide}
              >
                Nästa
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
