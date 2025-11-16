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
      <div className="min-h-screen bg-black">
        <div className="container mx-auto p-6">
          <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
            <p className="text-[rgba(255,255,255,0.7)]">Du har inte behörighet att se denna sida.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Kategorier
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Skapa och hantera kategorier för Kunskapsbanken
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny kategori
          </Button>
        </div>

        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
          <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">Alla kategorier</h2>
          </div>
          <div className="p-6">
          {isLoading ? (
            <p className="text-[rgba(255,255,255,0.5)] text-center py-8">Laddar...</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.7)]">Inga kategorier ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
                Skapa din första kategori för att komma igång.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b border-[rgba(255,215,0,0.2)] font-semibold text-sm text-[rgba(255,215,0,0.8)]">
                <div className="col-span-2">Namn</div>
                <div className="col-span-3">Beskrivning</div>
                <div className="col-span-2">Sektion</div>
                <div className="col-span-2">Slug</div>
                <div className="col-span-1 text-center">Artiklar</div>
                <div className="col-span-2 text-right">Åtgärder</div>
              </div>

              {/* Table rows */}
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b border-[rgba(255,215,0,0.1)] items-center hover:bg-[rgba(255,215,0,0.05)] transition-colors rounded-lg px-2"
                >
                  <div className="col-span-2 font-medium text-[rgba(255,255,255,0.9)]">
                    {category.name}
                  </div>
                  <div className="col-span-3 text-[rgba(255,255,255,0.6)] text-sm">
                    {category.description || '-'}
                  </div>
                  <div className="col-span-2 text-[rgba(255,255,255,0.6)] text-sm">
                    {category.section || '-'}
                  </div>
                  <div className="col-span-2">
                    <code className="text-xs bg-[rgba(255,215,0,0.1)] text-[#FFD700] px-2 py-1 rounded border border-[rgba(255,215,0,0.2)]">
                      {category.slug}
                    </code>
                  </div>
                  <div className="col-span-1 text-center text-[rgba(255,255,255,0.9)]">
                    {category._count.articles}
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleMoveCategory(category, 'up')}
                      disabled={index === 0}
                      className="p-2 hover:bg-[rgba(255,215,0,0.1)] rounded transition-colors text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Flytta upp"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveCategory(category, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-2 hover:bg-[rgba(255,215,0,0.1)] rounded transition-colors text-[rgba(255,215,0,0.8)] hover:text-[#FFD700] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Flytta ner"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditDialog(category)}
                      className="p-2 hover:bg-[rgba(255,215,0,0.1)] rounded transition-colors text-[rgba(255,215,0,0.8)] hover:text-[#FFD700]"
                      title="Redigera"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      disabled={category._count.articles > 0}
                      className="p-2 hover:bg-[rgba(239,68,68,0.1)] rounded transition-colors text-[rgba(239,68,68,0.8)] hover:text-[rgb(239,68,68)] disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Radera"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open)
        if (!open) {
          setSectionComboboxOpen(false)
          setFormData({ name: '', description: '', section: '', slug: '', color: '#FFD700' })
        }
      }}>
        <DialogContent className="max-w-2xl bg-black border-2 border-[rgba(255,215,0,0.3)]">
          <DialogHeader className="border-b border-[rgba(255,215,0,0.2)] pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent font-['Orbitron',sans-serif]">
              Skapa ny kategori
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Lägg till en ny kategori för att organisera artiklar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name" className="text-[rgba(255,255,255,0.8)]">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="t.ex. Nutrition, Träning, Mindset"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="section" className="text-[rgba(255,255,255,0.8)]">Sektion (gruppering)</Label>
              {uniqueSections.length > 0 ? (
                <Popover open={sectionComboboxOpen} onOpenChange={setSectionComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sectionComboboxOpen}
                      className="w-full justify-between font-normal bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white hover:bg-[rgba(255,215,0,0.1)]"
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
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              )}
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                Grupperar kategorier under en rubrik i Kunskapsbanken
              </p>
            </div>
            <div>
              <Label htmlFor="slug" className="text-[rgba(255,255,255,0.8)]">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. nutrition, traning, mindset"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                URL-vänligt namn (endast små bokstäver, siffror och bindestreck)
              </p>
            </div>
            <div>
              <Label htmlFor="description" className="text-[rgba(255,255,255,0.8)]">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivning av kategorin..."
                rows={3}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label className="text-[rgba(255,255,255,0.8)]">Färg *</Label>
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
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">
                Vald färg: <span className="font-mono text-[#FFD700]">{formData.color}</span>
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-[rgba(255,215,0,0.2)] pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90"
            >
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
        <DialogContent className="max-w-2xl bg-black border-2 border-[rgba(255,215,0,0.3)]">
          <DialogHeader className="border-b border-[rgba(255,215,0,0.2)] pb-4">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent font-['Orbitron',sans-serif]">
              Redigera kategori
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Uppdatera kategoriinformationen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="text-[rgba(255,255,255,0.8)]">Namn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-section" className="text-[rgba(255,255,255,0.8)]">Sektion (gruppering)</Label>
              {uniqueSections.length > 0 ? (
                <Popover open={sectionComboboxOpen} onOpenChange={setSectionComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={sectionComboboxOpen}
                      className="w-full justify-between font-normal bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white hover:bg-[rgba(255,215,0,0.1)]"
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
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              )}
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                Grupperar kategorier under en rubrik i Kunskapsbanken
              </p>
            </div>
            <div>
              <Label htmlFor="edit-slug" className="text-[rgba(255,255,255,0.8)]">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-[rgba(255,255,255,0.8)]">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label className="text-[rgba(255,255,255,0.8)]">Färg *</Label>
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
              <p className="text-xs text-[rgba(255,255,255,0.5)] mt-2">
                Vald färg: <span className="font-mono text-[#FFD700]">{formData.color}</span>
              </p>
            </div>
          </div>
          <DialogFooter className="border-t border-[rgba(255,215,0,0.2)] pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.9)] hover:bg-[rgba(255,215,0,0.1)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-semibold hover:opacity-90"
            >
              {isSaving ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
