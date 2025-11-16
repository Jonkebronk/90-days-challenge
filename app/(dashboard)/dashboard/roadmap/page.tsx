'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  BookOpen,
  CheckCircle,
  Circle,
  Clock,
  Award,
  Target
} from 'lucide-react'
import { toast } from 'sonner'

type Article = {
  id: string
  title: string
  difficulty?: string | null
  estimatedReadingMinutes?: number | null
  category: {
    name: string
  }
}

type ArticleProgress = {
  completed: boolean
}

type RoadmapAssignment = {
  id: string
  dayNumber: number
  phase: number
  article: Article
  articleId: string
}

type ArticleWithProgress = RoadmapAssignment & {
  progress?: ArticleProgress[]
}

export default function ClientRoadmapPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<ArticleWithProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activePhase, setActivePhase] = useState<string>('1')

  // For demo purposes - in real app, this would come from user profile
  const [startDate] = useState(new Date())
  const currentDay = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  useEffect(() => {
    if (session?.user) {
      fetchRoadmap()
    }
  }, [session])

  const fetchRoadmap = async () => {
    try {
      setIsLoading(true)

      // Fetch roadmap assignments
      const roadmapResponse = await fetch('/api/roadmap')
      if (!roadmapResponse.ok) {
        toast.error('Kunde inte hämta roadmap')
        return
      }
      const roadmapData = await roadmapResponse.json()

      // Fetch user's article progress
      const articlesResponse = await fetch('/api/articles?published=true')
      if (!articlesResponse.ok) {
        toast.error('Kunde inte hämta artiklar')
        return
      }
      const articlesData = await articlesResponse.json()

      // Merge progress data with assignments
      const assignmentsWithProgress = roadmapData.assignments.map((assignment: RoadmapAssignment) => {
        const articleWithProgress = articlesData.articles.find(
          (a: any) => a.id === assignment.articleId
        )
        return {
          ...assignment,
          progress: articleWithProgress?.progress || []
        }
      })

      setAssignments(assignmentsWithProgress)
    } catch (error) {
      console.error('Error fetching roadmap:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const getAssignmentsByPhase = (phase: number) => {
    return assignments.filter(a => a.phase === phase)
  }

  const getAssignmentsByDay = (assignments: ArticleWithProgress[]) => {
    const byDay: { [key: number]: ArticleWithProgress[] } = {}
    assignments.forEach(assignment => {
      if (!byDay[assignment.dayNumber]) {
        byDay[assignment.dayNumber] = []
      }
      byDay[assignment.dayNumber].push(assignment)
    })
    return byDay
  }

  const isArticleCompleted = (assignment: ArticleWithProgress) => {
    return assignment.progress && assignment.progress.length > 0 && assignment.progress[0].completed
  }

  const getTotalCompleted = () => {
    return assignments.filter(a => isArticleCompleted(a)).length
  }

  const getPhaseProgress = (phase: number) => {
    const phaseAssignments = getAssignmentsByPhase(phase)
    if (phaseAssignments.length === 0) return 0
    const completed = phaseAssignments.filter(a => isArticleCompleted(a)).length
    return Math.round((completed / phaseAssignments.length) * 100)
  }

  const getDayStatus = (dayNumber: number) => {
    if (dayNumber < currentDay) return 'past'
    if (dayNumber === currentDay) return 'current'
    return 'future'
  }

  const getDifficultyLabel = (difficulty?: string | null) => {
    if (!difficulty) return null
    const labels: Record<string, string> = {
      beginner: 'Nybörjare',
      intermediate: 'Medel',
      advanced: 'Avancerad'
    }
    return labels[difficulty] || difficulty
  }

  const renderPhaseContent = (phase: number) => {
    const phaseAssignments = getAssignmentsByPhase(phase)
    const byDay = getAssignmentsByDay(phaseAssignments)
    const days = Object.keys(byDay)
      .map(Number)
      .sort((a, b) => a - b)

    if (days.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Inga artiklar tilldelade denna fas ännu.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Din coach kommer snart lägga till artiklar för dig att läsa.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {days.map(day => {
          const dayStatus = getDayStatus(day)
          const isCurrentDay = dayStatus === 'current'
          const isPastDay = dayStatus === 'past'
          const allCompleted = byDay[day].every(a => isArticleCompleted(a))

          return (
            <Card
              key={day}
              className={`${isCurrentDay ? 'border-2 border-blue-500 shadow-lg' : ''} ${
                isPastDay && allCompleted ? 'bg-green-50 border-green-200' : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-full ${
                        isCurrentDay
                          ? 'bg-blue-500 text-white'
                          : allCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      {allCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span className="font-bold">{day}</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Dag {day}</CardTitle>
                      {isCurrentDay && (
                        <Badge className="bg-blue-500 mt-1">Dagens artiklar</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {byDay[day].filter(a => isArticleCompleted(a)).length} / {byDay[day].length} lästa
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {byDay[day].map(assignment => {
                  const completed = isArticleCompleted(assignment)
                  return (
                    <div
                      key={assignment.id}
                      onClick={() => router.push(`/dashboard/articles/${assignment.article.id}`)}
                      className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors ${
                        completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="mt-1">
                        {completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className={`font-semibold ${completed ? 'text-green-900' : ''}`}>
                              {assignment.article.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {assignment.article.category.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {assignment.article.difficulty && (
                            <Badge variant="outline" className="text-xs">
                              {getDifficultyLabel(assignment.article.difficulty)}
                            </Badge>
                          )}
                          {assignment.article.estimatedReadingMinutes && (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {assignment.article.estimatedReadingMinutes} min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          MIN 90-DAGARS ROADMAP
        </h1>
        <p className="text-gray-600 mt-2">
          Din personliga inlärningsresa - dag {currentDay} av 90
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentDay}/90</p>
                <p className="text-xs text-muted-foreground">Dagar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {getTotalCompleted()}/{assignments.length}
                </p>
                <p className="text-xs text-muted-foreground">Artiklar lästa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments.length - getTotalCompleted()}</p>
                <p className="text-xs text-muted-foreground">Kvar att läsa</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Award className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments.length > 0
                    ? Math.round((getTotalCompleted() / assignments.length) * 100)
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Totalt genomfört</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phase Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Fas Framsteg</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fas 1 (Dag 1-30)</span>
              <span className="text-sm text-muted-foreground">{getPhaseProgress(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${getPhaseProgress(1)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fas 2 (Dag 31-60)</span>
              <span className="text-sm text-muted-foreground">{getPhaseProgress(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${getPhaseProgress(2)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Fas 3 (Dag 61-90)</span>
              <span className="text-sm text-muted-foreground">{getPhaseProgress(3)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${getPhaseProgress(3)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Tabs */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activePhase} onValueChange={setActivePhase}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="1">Fas 1 (Dag 1-30)</TabsTrigger>
              <TabsTrigger value="2">Fas 2 (Dag 31-60)</TabsTrigger>
              <TabsTrigger value="3">Fas 3 (Dag 61-90)</TabsTrigger>
            </TabsList>

            <TabsContent value="1">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Laddar...</p>
              ) : (
                renderPhaseContent(1)
              )}
            </TabsContent>

            <TabsContent value="2">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Laddar...</p>
              ) : (
                renderPhaseContent(2)
              )}
            </TabsContent>

            <TabsContent value="3">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Laddar...</p>
              ) : (
                renderPhaseContent(3)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
