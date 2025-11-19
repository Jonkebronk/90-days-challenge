'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface WorkoutProgramCategory {
  id: string
  name: string
  description: string | null
  slug: string
  icon: string
  color: string
  orderIndex: number
  _count: {
    programs: number
  }
  createdAt: string
}

const ICON_OPTIONS = [
  { value: 'Trophy', label: '🏆 Trophy' },
  { value: 'Dumbbell', label: '💪 Dumbbell' },
  { value: 'Zap', label: '⚡ Zap' },
  { value: 'Target', label: '🎯 Target' },
  { value: 'Award', label: '🏅 Award' },
  { value: 'Activity', label: '📊 Activity' },
  { value: 'TrendingUp', label: '📈 Trending Up' },
  { value: 'Heart', label: '❤️ Heart' },
  { value: 'Star', label: '⭐ Star' },
  { value: 'Flame', label: '🔥 Flame' },
]

const COLOR_OPTIONS = [
  { value: '#FFD700', label: 'Guld' },
  { value: '#3B82F6', label: 'Blå' },
  { value: '#10B981', label: 'Grön' },
  { value: '#EF4444', label: 'Röd' },
  { value: '#8B5CF6', label: 'Lila' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EC4899', label: 'Rosa' },
]

export default function WorkoutCategoriesPage() {
  const [categories, setCategories] = useState<WorkoutProgramCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WorkoutProgramCategory | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    icon: 'Dumbbell',
    color: '#FFD700',
    orderIndex: 0
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/workout-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category?: WorkoutProgramCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        orderIndex: category.orderIndex
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        slug: '',
        icon: 'Dumbbell',
        color: '#FFD700',
        orderIndex: categories.length
      })
    }
    setDialogOpen(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name)
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Namn och slug krävs')
      return
    }

    setSaving(true)

    try {
      const url = editingCategory
        ? `/api/workout-categories/${editingCategory.id}`
        : '/api/workout-categories'

      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingCategory ? 'Kategori uppdaterad!' : 'Kategori skapad!')
        setDialogOpen(false)
        await fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte spara kategorin')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kategori?')) return

    try {
      const response = await fetch(`/api/workout-categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Kategori borttagen!')
        await fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ta bort kategorin')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            Träningskategorier
          </h1>
          <p className="text-gray-400 mt-1">
            Organisera träningsprogram i kategorier
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa kategori
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${category.color}33, ${category.color}11)`,
                      border: `1px solid ${category.color}44`
                    }}
                  >
                    <BookOpen className="w-6 h-6" style={{ color: category.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-900">
                      {category.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {category._count.programs} program
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(category)}
                    className="h-8 w-8 text-gold-primary hover:text-gold-secondary hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {category.description && (
              <CardContent>
                <p className="text-sm text-gray-600">{category.description}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card className="bg-white border border-gray-200">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-gold-primary mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Inga kategorier ännu. Skapa din första kategori!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white border-2 border-gold-primary/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingCategory ? 'Redigera kategori' : 'Skapa ny kategori'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingCategory ? 'Uppdatera kategoriinformation' : 'Lägg till en ny träningskategori'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name" className="text-gray-700">Namn</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="t.ex. 90-Dagars Challenge"
                className="bg-white border-gray-300 text-gray-900 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-gray-700">Slug (URL-vänlig)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="90-dagars-challenge"
                className="bg-white border-gray-300 text-gray-900 mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-700">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskrivning av kategorin..."
                rows={3}
                className="bg-white border-gray-300 text-gray-900 mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" className="text-gray-700">Ikon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color" className="text-gray-700">Färg</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: option.value }} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-gray-300 text-gray-700"
              >
                Avbryt
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-gold-primary to-gold-secondary text-white"
              >
                {saving ? 'Sparar...' : editingCategory ? 'Uppdatera' : 'Skapa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
