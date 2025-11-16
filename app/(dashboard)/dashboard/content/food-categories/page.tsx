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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Apple, ArrowUp, ArrowDown, Beef, Wheat, Droplet, Salad } from 'lucide-react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'

type FoodCategory = {
  id: string
  name: string
  description?: string | null
  slug: string
  color: string
  icon: string
  orderIndex: number
  _count: {
    foodItems: number
  }
}

const COMMON_ICONS = [
  { name: 'Apple', label: 'Apple (Frukt)' },
  { name: 'Beef', label: 'Beef (Kött/Protein)' },
  { name: 'Wheat', label: 'Wheat (Spannmål)' },
  { name: 'Droplet', label: 'Droplet (Fett/Olja)' },
  { name: 'Salad', label: 'Salad (Grönsaker)' },
  { name: 'Fish', label: 'Fish (Fisk)' },
  { name: 'Cookie', label: 'Cookie (Snacks)' },
  { name: 'Milk', label: 'Milk (Mejeriprodukter)' },
  { name: 'Egg', label: 'Egg (Ägg)' },
  { name: 'Pizza', label: 'Pizza (Snabbmat)' },
]

export default function FoodCategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#FFD700',
    icon: 'Apple'
  })

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/food-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        toast.error('Kunde inte hämta kategorier')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!formData.name || !formData.slug) {
      toast.error('Namn och slug krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/food-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Kategori skapad')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', slug: '', color: '#FFD700', icon: 'Apple' })
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa kategori')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCategory = async () => {
    if (!selectedCategory || !formData.name || !formData.slug) {
      toast.error('Namn och slug krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/food-categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Kategori uppdaterad')
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
        setFormData({ name: '', description: '', slug: '', color: '#FFD700', icon: 'Apple' })
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte uppdatera kategori')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (category: FoodCategory) => {
    if (category._count.foodItems > 0) {
      toast.error('Kan inte radera kategori med livsmedel')
      return
    }

    if (!confirm(`Är du säker på att du vill radera "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/food-categories/${category.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Kategori raderad')
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera kategori')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === categoryId)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const newCategories = [...categories]
    const [movedCategory] = newCategories.splice(currentIndex, 1)
    newCategories.splice(targetIndex, 0, movedCategory)

    // Update orderIndex for all categories
    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      orderIndex: idx
    }))

    try {
      const response = await fetch('/api/food-categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: updates })
      })

      if (response.ok) {
        setCategories(newCategories)
        toast.success('Ordning uppdaterad')
      } else {
        toast.error('Kunde inte uppdatera ordning')
      }
    } catch (error) {
      console.error('Error reordering:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const openEditDialog = (category: FoodCategory) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      color: category.color,
      icon: category.icon
    })
    setIsEditDialogOpen(true)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name, slug: generateSlug(name) })
  }

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Apple
    return Icon
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">Du har inte behörighet att se denna sida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            Livsmedelskategorier
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Skapa och hantera kategorier för livsmedel
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny kategori
        </Button>
      </div>

      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
        <div className="p-6 border-b border-[rgba(255,215,0,0.2)]">
          <h2 className="text-xl font-bold text-[#FFD700] tracking-[1px]">Alla kategorier</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <Apple className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">Inga kategorier ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                Skapa din första kategori för att komma igång.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,215,0,0.05)]">
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Ikon</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Namn</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Beskrivning</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Slug</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Färg</TableHead>
                    <TableHead className="text-center text-[rgba(255,215,0,0.8)]">Livsmedel</TableHead>
                    <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category, index) => {
                    const Icon = getIconComponent(category.icon)
                    return (
                      <TableRow key={category.id} className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                        <TableCell>
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${category.color}20`, border: `2px solid ${category.color}40` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: category.color }} />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-white">{category.name}</TableCell>
                        <TableCell className="text-[rgba(255,255,255,0.6)]">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-[rgba(255,215,0,0.1)] text-[#FFD700] px-2 py-1 rounded border border-[rgba(255,215,0,0.2)]">
                            {category.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-[rgba(255,255,255,0.2)]"
                              style={{ backgroundColor: category.color }}
                            />
                            <code className="text-xs text-[rgba(255,255,255,0.6)]">{category.color}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-white">
                          {category._count.foodItems}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReorder(category.id, 'up')}
                              disabled={index === 0}
                              className="hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700] text-[rgba(255,255,255,0.6)]"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReorder(category.id, 'down')}
                              disabled={index === categories.length - 1}
                              className="hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700] text-[rgba(255,255,255,0.6)]"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(category)}
                              className="hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700] text-[rgba(255,255,255,0.6)]"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCategory(category)}
                              disabled={category._count.foodItems > 0}
                              className="hover:bg-[rgba(255,0,0,0.1)] hover:text-red-400 text-[rgba(255,255,255,0.6)]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Skapa ny kategori
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Lägg till en ny kategori för att organisera livsmedel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-[rgba(255,255,255,0.8)]">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="t.ex. Proteinkälla, Kolhydratkälla"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-[rgba(255,255,255,0.8)]">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. proteinkalla, kolhydratkalla"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-[rgba(255,255,255,0.8)]">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivning av kategorin..."
                rows={3}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icon" className="text-[rgba(255,255,255,0.8)]">Ikon *</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                    {COMMON_ICONS.map((icon) => {
                      const IconComponent = getIconComponent(icon.name)
                      return (
                        <SelectItem key={icon.name} value={icon.name} className="text-white">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color" className="text-[rgba(255,255,255,0.8)]">Färg *</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#FFD700"
                    className="flex-1 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setFormData({ name: '', description: '', slug: '', color: '#FFD700', icon: 'Apple' })
              }}
              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isSaving}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Skapar...' : 'Skapa kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Redigera kategori
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Uppdatera kategorins information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-[rgba(255,255,255,0.8)]">Namn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="t.ex. Proteinkälla, Kolhydratkälla"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug" className="text-[rgba(255,255,255,0.8)]">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. proteinkalla, kolhydratkalla"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-[rgba(255,255,255,0.8)]">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivning av kategorin..."
                rows={3}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-icon" className="text-[rgba(255,255,255,0.8)]">Ikon *</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                    {COMMON_ICONS.map((icon) => {
                      const IconComponent = getIconComponent(icon.name)
                      return (
                        <SelectItem key={icon.name} value={icon.name} className="text-white">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-color" className="text-[rgba(255,255,255,0.8)]">Färg *</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-10 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#FFD700"
                    className="flex-1 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedCategory(null)
                setFormData({ name: '', description: '', slug: '', color: '#FFD700', icon: 'Apple' })
              }}
              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleEditCategory}
              disabled={isSaving}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
