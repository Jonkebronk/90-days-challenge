'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Calendar, BookOpen } from 'lucide-react'
import { toast } from 'sonner'

type Article = {
  id: string
  title: string
  category: {
    name: string
  }
}

type RoadmapAssignment = {
  id: string
  articleId: string
  dayNumber: number
  phase: number
  orderIndex: number
  article: Article
}

export default function RoadmapPage() {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<RoadmapAssignment[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activePhase, setActivePhase] = useState<string>('1')

  const [formData, setFormData] = useState({
    articleId: '',
    dayNumber: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchAssignments()
      fetchArticles()
    }
  }, [session])

  const fetchAssignments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/roadmap')
      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
      } else {
        toast.error('Kunde inte hämta roadmap')
      }
    } catch (error) {
      console.error('Error fetching roadmap:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?published=true')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    }
  }

  const handleAddAssignment = async () => {
    if (!formData.articleId || !formData.dayNumber) {
      toast.error('Alla fält krävs')
      return
    }

    const dayNum = parseInt(formData.dayNumber)
    if (dayNum < 1 || dayNum > 90) {
      toast.error('Dag måste vara mellan 1 och 90')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: formData.articleId,
          dayNumber: dayNum
        })
      })

      if (response.ok) {
        toast.success('Artikel tillagd till roadmap')
        setIsAddDialogOpen(false)
        setFormData({ articleId: '', dayNumber: '' })
        fetchAssignments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till artikel')
      }
    } catch (error) {
      console.error('Error adding assignment:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAssignment = async (assignment: RoadmapAssignment) => {
    if (!confirm(`Ta bort "${assignment.article.title}" från dag ${assignment.dayNumber}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/roadmap/${assignment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Artikel borttagen från roadmap')
        fetchAssignments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ta bort artikel')
      }
    } catch (error) {
      console.error('Error deleting assignment:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const getAssignmentsByPhase = (phase: number) => {
    return assignments.filter(a => a.phase === phase)
  }

  const getAssignmentsByDay = (assignments: RoadmapAssignment[]) => {
    const byDay: { [key: number]: RoadmapAssignment[] } = {}
    assignments.forEach(assignment => {
      if (!byDay[assignment.dayNumber]) {
        byDay[assignment.dayNumber] = []
      }
      byDay[assignment.dayNumber].push(assignment)
    })
    return byDay
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
            Klicka på &quot;Lägg till artikel&quot; för att komma igång.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {days.map(day => (
          <Card key={day}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Dag {day}</CardTitle>
                <Badge variant="outline">{byDay[day].length} artikel(er)</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {byDay[day].map(assignment => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{assignment.article.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {assignment.article.category.name}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAssignment(assignment)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">90-Dagars Roadmap</h1>
          <p className="text-muted-foreground mt-1">
            Tilldela artiklar till specifika dagar i 90-dagars resan
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Lägg till artikel
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{assignments.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Totalt tilldelade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{getAssignmentsByPhase(1).length}</p>
              <p className="text-sm text-muted-foreground mt-1">Fas 1 (1-30)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{getAssignmentsByPhase(2).length}</p>
              <p className="text-sm text-muted-foreground mt-1">Fas 2 (31-60)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold">{getAssignmentsByPhase(3).length}</p>
              <p className="text-sm text-muted-foreground mt-1">Fas 3 (61-90)</p>
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Add Assignment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lägg till artikel till roadmap</DialogTitle>
            <DialogDescription>
              Välj en artikel och dag att tilldela den till.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="article">Artikel *</Label>
              <Select
                value={formData.articleId}
                onValueChange={(value) => setFormData({ ...formData, articleId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj artikel" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(article => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title} ({article.category.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="day">Dag (1-90) *</Label>
              <Input
                id="day"
                type="number"
                min="1"
                max="90"
                value={formData.dayNumber}
                onChange={(e) => setFormData({ ...formData, dayNumber: e.target.value })}
                placeholder="t.ex. 15"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Fas 1: 1-30, Fas 2: 31-60, Fas 3: 61-90
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleAddAssignment} disabled={isSaving}>
              {isSaving ? 'Lägger till...' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
