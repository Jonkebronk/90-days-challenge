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
import { Plus, Pencil, Trash2, FolderOpen, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

type ArticleCategory = {
  id: string
  name: string
  description?: string | null
  slug: string
  color: string
  orderIndex: number
  _count: {
    articles: number
  }
}

export default function CategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#FFD700'
  })

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/article-categories')
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
      const response = await fetch('/api/article-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Kategori skapad')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', slug: '', color: '#FFD700' })
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

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !formData.name || !formData.slug) {
      toast.error('Namn och slug krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch(`/api/article-categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Kategori uppdaterad')
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
        setFormData({ name: '', description: '', slug: '', color: '#FFD700' })
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

  const handleDeleteCategory = async (category: ArticleCategory) => {
    if (category._count.articles > 0) {
      toast.error('Kan inte radera kategori med artiklar')
      return
    }

    if (!confirm(`Är du säker på att du vill radera "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/article-categories/${category.id}`, {
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

  const handleMoveCategory = async (category: ArticleCategory, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const otherCategory = categories[newIndex]

    try {
      // Swap orderIndex values
      await Promise.all([
        fetch(`/api/article-categories/${category.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: otherCategory.orderIndex })
        }),
        fetch(`/api/article-categories/${otherCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: category.orderIndex })
        })
      ])

      fetchCategories()
    } catch (error) {
      console.error('Error moving category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const openEditDialog = (category: ArticleCategory) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      color: category.color || '#FFD700'
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
          <h1 className="text-3xl font-bold">Artikel Kategorier</h1>
          <p className="text-muted-foreground mt-1">
            Skapa och hantera kategorier för artikel banken
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny kategori
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alla kategorier</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Laddar...</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Inga kategorier ännu.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Skapa din första kategori för att komma igång.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>Beskrivning</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Artiklar</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, index) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || '-'}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {category.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center">
                      {category._count.articles}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveCategory(category, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMoveCategory(category, 'down')}
                          disabled={index === categories.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={category._count.articles > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny kategori</DialogTitle>
            <DialogDescription>
              Lägg till en ny kategori för att organisera artiklar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="t.ex. Nutrition, Träning, Mindset"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. nutrition, traning, mindset"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL-vänligt namn (endast små bokstäver, siffror och bindestreck)
              </p>
            </div>
            <div>
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivning av kategorin..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Färg *</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#FFD700"
                  className="flex-1"
                />
                <div
                  className="h-10 w-10 rounded border-2 border-gray-300"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Välj en färg för kategoriaccenten
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateCategory} disabled={isSaving}>
              {isSaving ? 'Skapar...' : 'Skapa kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redigera kategori</DialogTitle>
            <DialogDescription>
              Uppdatera kategoriinformationen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Namn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Färg *</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#FFD700"
                  className="flex-1"
                />
                <div
                  className="h-10 w-10 rounded border-2 border-gray-300"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Välj en färg för kategoriaccenten
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleUpdateCategory} disabled={isSaving}>
              {isSaving ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
