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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, ChefHat, Coffee, Utensils, Cookie, Moon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

type RecipeSubcategory = {
  id: string
  name: string
  slug: string
  orderIndex: number
}

type RecipeCategory = {
  id: string
  name: string
  description?: string | null
  slug: string
  color: string
  icon: string
  orderIndex: number
  _count: {
    recipes: number
    subcategories: number
  }
  subcategories: RecipeSubcategory[]
}

// Common Lucide icons for food categories
const ICON_OPTIONS = [
  'Coffee', 'Utensils', 'UtensilsCrossed', 'ChefHat', 'Cookie', 'Apple', 'Cake',
  'Pizza', 'Croissant', 'IceCream', 'Soup', 'Salad', 'Moon', 'Sun', 'Wheat'
]

// Color presets
const COLOR_OPTIONS = [
  { name: 'Gold', value: '#FFD700' },
  { name: 'Orange', value: '#FF6B35' },
  { name: 'Red', value: '#E63946' },
  { name: 'Pink', value: '#F72585' },
  { name: 'Purple', value: '#7209B7' },
  { name: 'Blue', value: '#3A86FF' },
  { name: 'Green', value: '#06D6A0' },
  { name: 'Teal', value: '#118AB2' },
]

export default function RecipeCategoriesPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<RecipeCategory | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Subcategory management
  const [isSubcategoryDialogOpen, setIsSubcategoryDialogOpen] = useState(false)
  const [subcategoryFormData, setSubcategoryFormData] = useState({ name: '' })
  const [managingCategoryId, setManagingCategoryId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#FFD700',
    icon: 'ChefHat'
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
        setFormData({ name: '', description: '', slug: '', color: '#FFD700', icon: 'ChefHat' })
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
      const response = await fetch(`/api/recipe-categories/${selectedCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Kategori uppdaterad')
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
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

  const handleCreateSubcategory = async () => {
    if (!managingCategoryId || !subcategoryFormData.name) {
      toast.error('Namn krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/recipe-subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subcategoryFormData.name,
          categoryId: managingCategoryId
        })
      })

      if (response.ok) {
        toast.success('Subkategori skapad')
        setIsSubcategoryDialogOpen(false)
        setSubcategoryFormData({ name: '' })
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa subkategori')
      }
    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    if (!confirm(`Är du säker på att du vill radera "${subcategoryName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/recipe-subcategories/${subcategoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Subkategori raderad')
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera subkategori')
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error)
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

  const openEditDialog = (category: RecipeCategory) => {
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

  const openSubcategoryDialog = (categoryId: string) => {
    setManagingCategoryId(categoryId)
    setIsSubcategoryDialogOpen(true)
  }

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName]
    return Icon || ChefHat
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
            Hantera Recept Kategorier
          </h1>
          <p className="text-gray-400 mt-1">
            Skapa kategorier och subkategorier för att organisera recept
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-400">Laddar...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <ChefHat className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-gray-400">Inga kategorier ännu.</p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
              Skapa din första kategori för att komma igång.
            </p>
          </div>
        ) : (
          categories.map((category) => {
            const Icon = getIconComponent(category.icon)
            return (
              <Card
                key={category.id}
                className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: category.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gold-light">{category.name}</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {category._count.recipes} recept
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        className="h-8 w-8 text-gray-400 hover:text-gold-light"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category)}
                        disabled={category._count.recipes > 0}
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-300">
                        Subkategorier ({category._count.subcategories})
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSubcategoryDialog(category.id)}
                        className="h-7 text-xs text-gold-light hover:text-gold-primary"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Lägg till
                      </Button>
                    </div>
                    {category.subcategories.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {category.subcategories.map((sub) => (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-2 bg-white/5 rounded text-sm"
                          >
                            <span className="text-gray-300">{sub.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSubcategory(sub.id, sub.name)}
                              className="h-6 w-6 text-gray-500 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">Inga subkategorier än</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Category Dialog */}
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
                placeholder="t.ex. Frukost, Lunch/Middag, Mellanmål"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-gray-200">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. frukost, lunch-middag, mellanmal"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color" className="text-gray-200">Färg</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="icon" className="text-gray-200">Ikon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                    {ICON_OPTIONS.map((iconName) => {
                      const Icon = getIconComponent(iconName)
                      return (
                        <SelectItem key={iconName} value={iconName} className="text-white">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
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

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-2 border-gold-primary/30 backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Redigera kategori
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-gray-200">Namn *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="bg-black/30 border-gold-primary/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug" className="text-gray-200">Slug *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-black/30 border-gold-primary/30 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-color" className="text-gray-200">Färg</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                    {COLOR_OPTIONS.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: color.value }} />
                          <span>{color.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-icon" className="text-gray-200">Ikon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                    {ICON_OPTIONS.map((iconName) => {
                      const Icon = getIconComponent(iconName)
                      return (
                        <SelectItem key={iconName} value={iconName} className="text-white">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{iconName}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-gray-200">Beskrivning</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="bg-black/30 border-gold-primary/30 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="border-gold-primary/30 text-gray-200 hover:bg-gold-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleUpdateCategory}
              disabled={isSaving}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Sparar...' : 'Spara ändringar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subcategory Dialog */}
      <Dialog open={isSubcategoryDialogOpen} onOpenChange={setIsSubcategoryDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-2 border-gold-primary/30 backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Skapa subkategori
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Lägg till en subkategori för att organisera recept inom kategorin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcat-name" className="text-gray-200">Namn *</Label>
              <Input
                id="subcat-name"
                value={subcategoryFormData.name}
                onChange={(e) => setSubcategoryFormData({ name: e.target.value })}
                placeholder="t.ex. Overnight oats, Smoothies, Protein pannkakor"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubcategoryDialogOpen(false)
                setSubcategoryFormData({ name: '' })
              }}
              className="border-gold-primary/30 text-gray-200 hover:bg-gold-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateSubcategory}
              disabled={isSaving}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Skapar...' : 'Skapa subkategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
