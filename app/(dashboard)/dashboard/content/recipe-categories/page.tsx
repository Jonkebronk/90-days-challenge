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
import { Plus, Pencil, Trash2, ChefHat, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'

type RecipeCategory = {
  id: string
  name: string
  description?: string | null
  slug: string
  orderIndex: number
  _count: {
    recipes: number
  }
}

export default function RecipeCategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recipe-categories')
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
      const response = await fetch('/api/recipe-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Kategori skapad')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', slug: '' })
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

  const handleDeleteCategory = async (category: RecipeCategory) => {
    if (category._count.recipes > 0) {
      toast.error('Kan inte radera kategori med recept')
      return
    }

    if (!confirm(`Är du säker på att du vill radera "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/recipe-categories/${category.id}`, {
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
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">Du har inte behörighet att se denna sida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            Skapa Recept Kategorier
          </h1>
          <p className="text-gray-400 mt-1">
            Skapa och hantera kategorier för Recept
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny kategori
        </Button>
      </div>

      <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl backdrop-blur-[10px] overflow-hidden">
        <div className="p-6 border-b border-gold-primary/20">
          <h2 className="text-xl font-bold text-gold-light tracking-[1px]">Alla kategorier</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-400 text-center py-8">Laddar...</p>
          ) : categories.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-gray-400">Inga kategorier ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                Skapa din första kategori för att komma igång.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gold-primary/20 hover:bg-[rgba(255,215,0,0.05)]">
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Namn</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Beskrivning</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Slug</TableHead>
                    <TableHead className="text-center text-[rgba(255,215,0,0.8)]">Recept</TableHead>
                    <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} className="border-b border-gold-primary/10 hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                      <TableCell className="font-medium text-white">{category.name}</TableCell>
                      <TableCell className="text-gray-400">
                        {category.description || '-'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-[rgba(255,215,0,0.1)] text-gold-light px-2 py-1 rounded border border-gold-primary/20">
                          {category.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-center text-white">
                        {category._count.recipes}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={category._count.recipes > 0}
                          className="hover:bg-[rgba(255,0,0,0.1)] hover:text-red-400 text-gray-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        <DialogContent className="bg-gray-900/95 border-2 border-gold-primary/30 backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Skapa ny kategori
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Lägg till en ny kategori för att organisera recept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-200">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="t.ex. Frukost, Middag, Desserter"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-gray-200">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. frukost, middag, desserter"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-200">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kort beskrivning av kategorin..."
                rows={3}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-gold-primary/30 text-gray-200 hover:bg-gold-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={isSaving}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Skapar...' : 'Skapa kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
