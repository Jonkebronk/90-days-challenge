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
import { Plus, Pencil, Trash2, FolderOpen, ArrowUp, ArrowDown, Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  { name: 'Gold', value: '#FFD700' },
  { name: 'Orange', value: '#FF8C00' },
  { name: 'Red', value: '#FF4444' },
  { name: 'Pink', value: '#FF69B4' },
  { name: 'Purple', value: '#9D4EDD' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Green', value: '#10B981' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Teal', value: '#14B8A6' },
]

type ArticleCategory = {
  id: string
  name: string
  description?: string | null
  section?: string | null
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
    section: '',
    slug: '',
    color: '#FFD700'
  })

  const [sectionComboboxOpen, setSectionComboboxOpen] = useState(false)

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

  // Get unique sections from existing categories
  const getUniqueSections = () => {
    const sections = categories
      .map(cat => cat.section)
      .filter((section): section is string => Boolean(section))
    return Array.from(new Set(sections)).sort()
  }

  const uniqueSections = getUniqueSections()

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
        setSectionComboboxOpen(false)
        setFormData({ name: '', description: '', section: '', slug: '', color: '#FFD700' })
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
        setSectionComboboxOpen(false)
        setSelectedCategory(null)
        setFormData({ name: '', description: '', section: '', slug: '', color: '#FFD700' })
        fetchCategories()
      } else{
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
      section: category.section || '',
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
          <h1 className="text-3xl font-bold">Skapa Kategorier</h1>
          <p className="text-muted-foreground mt-1">
            Skapa och hantera kategorier för Kunskapsbanken
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
                  <TableHead>Sektion</TableHead>
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
                    <TableCell className="text-muted-foreground">
                      {category.section || '-'}
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
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open)
        if (!open) {
          setSectionComboboxOpen(false)
          setFormData({ name: '', description: '', section: '', slug: '', color: '#FFD700' })
        }
      }}>
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
              <Label htmlFor="section">Sektion (gruppering)</Label>
              {uniqueSections.length > 0 ? (
                <Popover open={sectionComboboxOpen} onOpenChange={setSectionComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sectionComboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.section || "Välj sektion eller skriv ny..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Sök eller skriv ny sektion..."
                        value={formData.section}
                        onValueChange={(value) => setFormData({ ...formData, section: value })}
                      />
                      <CommandEmpty>
                        <div className="py-2 px-2 text-sm text-muted-foreground">
                          Tryck Enter för att skapa &quot;{formData.section}&quot;
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {uniqueSections.map((section) => (
                          <CommandItem
                            key={section}
                            value={section}
                            onSelect={(value) => {
                              setFormData({ ...formData, section: value })
                              setSectionComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.section === section ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {section}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  id="section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="t.ex. INNAN DU BÖRJAR, GENOMGÅNG AV 90 DAGARS CHALLENGEN"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Grupperar kategorier under en rubrik i Kunskapsbanken
              </p>
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
              <Label>Färg *</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`
                      h-10 rounded-md transition-all hover:scale-110
                      ${formData.color === color.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                        : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-background hover:ring-gray-400'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Vald färg: <span className="font-mono">{formData.color}</span>
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          setSectionComboboxOpen(false)
          setSelectedCategory(null)
          setFormData({ name: '', description: '', section: '', slug: '', color: '#FFD700' })
        }
      }}>
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
              <Label htmlFor="edit-section">Sektion (gruppering)</Label>
              {uniqueSections.length > 0 ? (
                <Popover open={sectionComboboxOpen} onOpenChange={setSectionComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sectionComboboxOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.section || "Välj sektion eller skriv ny..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Sök eller skriv ny sektion..."
                        value={formData.section}
                        onValueChange={(value) => setFormData({ ...formData, section: value })}
                      />
                      <CommandEmpty>
                        <div className="py-2 px-2 text-sm text-muted-foreground">
                          Tryck Enter för att skapa &quot;{formData.section}&quot;
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {uniqueSections.map((section) => (
                          <CommandItem
                            key={section}
                            value={section}
                            onSelect={(value) => {
                              setFormData({ ...formData, section: value })
                              setSectionComboboxOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.section === section ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {section}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <Input
                  id="edit-section"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  placeholder="t.ex. INNAN DU BÖRJAR, GENOMGÅNG AV 90 DAGARS CHALLENGEN"
                />
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Grupperar kategorier under en rubrik i Kunskapsbanken
              </p>
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
              <Label>Färg *</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`
                      h-10 rounded-md transition-all hover:scale-110
                      ${formData.color === color.value
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                        : 'hover:ring-1 hover:ring-offset-1 hover:ring-offset-background hover:ring-gray-400'
                      }
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Vald färg: <span className="font-mono">{formData.color}</span>
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
