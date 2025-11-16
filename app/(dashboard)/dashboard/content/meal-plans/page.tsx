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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  UtensilsCrossed,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

type MealPlanTemplate = {
  id: string
  name: string
  description: string | null
  targetProtein: number | null
  targetFat: number | null
  targetCarbs: number | null
  targetCalories: number | null
  published: boolean
  isArchived: boolean
  tags: string[]
  meals: any[]
  _count: {
    assignments: number
  }
}

export default function MealPlansPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<MealPlanTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetProtein: '',
    targetFat: '',
    targetCarbs: '',
    targetCalories: '',
  })

  useEffect(() => {
    if (session?.user) {
      fetchTemplates()
    }
  }, [session])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/meal-plan-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates)
      } else {
        toast.error('Kunde inte hämta måltidsplaner')
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!formData.name) {
      toast.error('Namn krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/meal-plan-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          targetProtein: formData.targetProtein ? parseFloat(formData.targetProtein) : null,
          targetFat: formData.targetFat ? parseFloat(formData.targetFat) : null,
          targetCarbs: formData.targetCarbs ? parseFloat(formData.targetCarbs) : null,
          targetCalories: formData.targetCalories ? parseFloat(formData.targetCalories) : null,
          published: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Måltidsplan skapad')
        setIsCreateDialogOpen(false)
        setFormData({
          name: '',
          description: '',
          targetProtein: '',
          targetFat: '',
          targetCarbs: '',
          targetCalories: '',
        })
        // Navigate to template builder to add meals
        router.push(`/dashboard/content/meal-plans/${data.template.id}`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa måltidsplan')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = async (template: MealPlanTemplate) => {
    if (!confirm(`Är du säker på att du vill radera "${template.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/meal-plan-templates/${template.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Måltidsplan raderad')
        fetchTemplates()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera måltidsplan')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleTogglePublished = async (template: MealPlanTemplate) => {
    try {
      const response = await fetch(`/api/meal-plan-templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !template.published }),
      })

      if (response.ok) {
        toast.success(
          template.published ? 'Måltidsplan avpublicerad' : 'Måltidsplan publicerad'
        )
        fetchTemplates()
      } else {
        toast.error('Kunde inte uppdatera måltidsplan')
      }
    } catch (error) {
      console.error('Error toggling published:', error)
      toast.error('Ett fel uppstod')
    }
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            MÅLTIDSPLANER
          </h1>
          <p className="text-gray-400 mt-1">
            Skapa och hantera måltidsplaner med måltidsalternativ
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny måltidsplan
        </Button>
      </div>

      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] overflow-hidden">
        <div className="p-6 border-b border-gold-primary/20">
          <h2 className="text-xl font-bold text-gold-light tracking-[1px]">
            Alla måltidsplaner ({templates.length})
          </h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-400 text-center py-8">Laddar...</p>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <UtensilsCrossed className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-gray-400">Inga måltidsplaner ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                Skapa din första måltidsplan för att komma igång.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gold-primary/20 hover:bg-[rgba(255,215,0,0.05)]">
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Namn</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Mål kcal</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Makron (P/F/K)</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Måltider</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Tilldelningar</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Status</TableHead>
                    <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template) => (
                    <TableRow
                      key={template.id}
                      className="border-b border-gold-primary/10 hover:bg-[rgba(255,215,0,0.05)] transition-colors"
                    >
                      <TableCell className="font-medium text-white">
                        {template.name}
                      </TableCell>
                      <TableCell className="text-white">
                        {template.targetCalories ? `${template.targetCalories} kcal` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {template.targetProtein || template.targetFat || template.targetCarbs
                          ? `${template.targetProtein || '-'}g / ${template.targetFat || '-'}g / ${template.targetCarbs || '-'}g`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                          {template.meals.length} måltider
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="h-4 w-4" />
                          <span>{template._count.assignments}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.published ? (
                          <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                            Publicerad
                          </Badge>
                        ) : (
                          <Badge className="bg-[rgba(150,150,150,0.1)] text-gray-400 border border-[rgba(150,150,150,0.3)]">
                            Utkast
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePublished(template)}
                            title={template.published ? 'Avpublicera' : 'Publicera'}
                            className="hover:bg-gold-50 text-gray-400 hover:text-gold-light"
                          >
                            {template.published ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/dashboard/content/meal-plans/${template.id}`)
                            }
                            className="hover:bg-gold-50 text-gray-400 hover:text-gold-light"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template)}
                            className="hover:bg-[rgba(255,0,0,0.1)] text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Skapa ny måltidsplan
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Skapa en ny måltidsplan mall. Du kan lägga till måltider och alternativ efteråt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-200">
                Namn *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="t.ex. 2000 kcal Viktnedgång"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-200">
                Beskrivning
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskrivning av måltidsplanen..."
                rows={3}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetCalories" className="text-gray-200">
                  Mål kalorier
                </Label>
                <Input
                  id="targetCalories"
                  type="number"
                  step="1"
                  value={formData.targetCalories}
                  onChange={(e) =>
                    setFormData({ ...formData, targetCalories: e.target.value })
                  }
                  placeholder="2000"
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
              <div>
                <Label htmlFor="targetProtein" className="text-gray-200">
                  Mål protein (g)
                </Label>
                <Input
                  id="targetProtein"
                  type="number"
                  step="0.1"
                  value={formData.targetProtein}
                  onChange={(e) =>
                    setFormData({ ...formData, targetProtein: e.target.value })
                  }
                  placeholder="150"
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
              <div>
                <Label htmlFor="targetFat" className="text-gray-200">
                  Mål fett (g)
                </Label>
                <Input
                  id="targetFat"
                  type="number"
                  step="0.1"
                  value={formData.targetFat}
                  onChange={(e) =>
                    setFormData({ ...formData, targetFat: e.target.value })
                  }
                  placeholder="60"
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
              <div>
                <Label htmlFor="targetCarbs" className="text-gray-200">
                  Mål kolhydrater (g)
                </Label>
                <Input
                  id="targetCarbs"
                  type="number"
                  step="0.1"
                  value={formData.targetCarbs}
                  onChange={(e) =>
                    setFormData({ ...formData, targetCarbs: e.target.value })
                  }
                  placeholder="200"
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={isSaving}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Skapar...' : 'Skapa måltidsplan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
