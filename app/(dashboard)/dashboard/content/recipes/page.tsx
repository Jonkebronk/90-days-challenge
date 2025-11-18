'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import {
  Plus,
  ChefHat,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

type RecipeSubcategory = {
  id: string
  name: string
  slug: string
}

type RecipeCategory = {
  id: string
  name: string
  subcategories: RecipeSubcategory[]
}

type Recipe = {
  id: string
  title: string
  description?: string | null
  categoryId: string
  servings: number
  difficulty?: string | null
  mealType?: string | null
  published: boolean
  caloriesPerServing?: number | null
  coverImage?: string | null
  category: RecipeCategory
}

export default function CoachRecipesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    subcategoryId: '',
    servings: '4'
  })

  const [subcategories, setSubcategories] = useState<RecipeSubcategory[]>([])

  useEffect(() => {
    if (session?.user) {
      fetchRecipes()
      fetchCategories()
    }
  }, [session])

  const fetchRecipes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/recipes')
      if (response.ok) {
        const data = await response.json()
        setRecipes(data.recipes)
      } else {
        toast.error('Kunde inte hämta recept')
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/recipe-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setFormData({ ...formData, categoryId, subcategoryId: '' })
    const category = categories.find(c => c.id === categoryId)
    setSubcategories(category?.subcategories || [])
  }

  const handleCreateRecipe = async () => {
    if (!formData.title || !formData.categoryId) {
      toast.error('Titel och kategori krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId || null,
          servings: parseInt(formData.servings) || 4,
          published: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Recept skapat')
        setIsCreateDialogOpen(false)
        setFormData({ title: '', categoryId: '', subcategoryId: '', servings: '4' })
        setSubcategories([])
        // Navigate to edit page to add ingredients and instructions
        router.push(`/dashboard/content/recipes/${data.recipe.id}/edit`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa recept')
      }
    } catch (error) {
      console.error('Error creating recipe:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (!confirm(`Är du säker på att du vill radera "${recipe.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Recept raderat')
        fetchRecipes()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera recept')
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleTogglePublished = async (recipe: Recipe) => {
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !recipe.published })
      })

      if (response.ok) {
        toast.success(recipe.published ? 'Recept avpublicerat' : 'Recept publicerat')
        fetchRecipes()
      } else {
        toast.error('Kunde inte uppdatera recept')
      }
    } catch (error) {
      console.error('Error toggling published:', error)
      toast.error('Ett fel uppstod')
    }
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-gray-600">Du har inte behörighet att se denna sida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Skapa Recept
          </h1>
          <p className="text-gray-600 mt-1">
            Skapa och hantera recept
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nytt recept
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="h-16 w-16 mx-auto text-gold-primary mb-4" />
          <p className="text-gray-700 text-lg">Inga recept ännu.</p>
          <p className="text-sm text-gray-500 mt-2">
            Skapa ditt första recept för att komma igång.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryRecipes = recipes.filter(r => r.categoryId === category.id)
            if (categoryRecipes.length === 0) return null

            return (
              <div key={category.id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4">
                  <ChefHat className="h-5 w-5 text-gold-primary" />
                  <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                  <Badge className="bg-gold-primary/10 text-gold-primary border border-gold-primary/30">
                    {categoryRecipes.length} recept
                  </Badge>
                </div>

                {/* Recipe Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      onClick={() => router.push(`/dashboard/content/recipes/${recipe.id}/edit`)}
                      className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-gold-primary hover:shadow-lg transition-all"
                    >
                      {/* Image */}
                      {recipe.coverImage ? (
                        <div className="h-32 w-full bg-gray-50 overflow-hidden">
                          <img
                            src={recipe.coverImage}
                            alt={recipe.title}
                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-gray-50 flex items-center justify-center">
                          <ChefHat className="h-12 w-12 text-gray-300" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1">
                            {recipe.title}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRecipe(recipe)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>

                        {recipe.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {recipe.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {recipe.caloriesPerServing && (
                            <div className="flex items-center gap-1">
                              <span className="text-orange-500">🔥</span>
                              <span>{Math.round(recipe.caloriesPerServing)} kcal</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>👤</span>
                            <span>{recipe.servings} {recipe.servings === 1 ? 'portion' : 'portioner'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Skapa nytt recept
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Skapa ett nytt recept. Du kan lägga till ingredienser och instruktioner efteråt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-700">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="t.ex. Protein pannkakor"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-gray-700">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {subcategories.length > 0 && (
              <div>
                <Label htmlFor="subcategory" className="text-gray-700">Subkategori (valfritt)</Label>
                <Select
                  value={formData.subcategoryId}
                  onValueChange={(value) => setFormData({ ...formData, subcategoryId: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Välj subkategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="servings" className="text-gray-700">Portioner *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateRecipe}
              disabled={isSaving}
              className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
            >
              {isSaving ? 'Skapar...' : 'Skapa recept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
