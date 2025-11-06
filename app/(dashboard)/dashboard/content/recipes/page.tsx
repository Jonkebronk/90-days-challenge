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
  ChefHat,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

type RecipeCategory = {
  id: string
  name: string
}

type Recipe = {
  id: string
  title: string
  categoryId: string
  servings: number
  difficulty?: string | null
  mealType?: string | null
  published: boolean
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
    servings: '4'
  })

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
          servings: parseInt(formData.servings) || 4,
          published: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Recept skapat')
        setIsCreateDialogOpen(false)
        setFormData({ title: '', categoryId: '', servings: '4' })
        // Navigate to recipe detail page to add ingredients and instructions
        router.push(`/dashboard/recipes/${data.recipe.id}`)
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
          <h1 className="text-3xl font-bold">Skapa Recept</h1>
          <p className="text-muted-foreground mt-1">
            Skapa och hantera recept
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nytt recept
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alla recept ({recipes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Laddar...</p>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Inga recept ännu.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Skapa ditt första recept för att komma igång.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Portioner</TableHead>
                  <TableHead>Svårighetsgrad</TableHead>
                  <TableHead>Måltidstyp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell className="font-medium">{recipe.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{recipe.category.name}</Badge>
                    </TableCell>
                    <TableCell>{recipe.servings}</TableCell>
                    <TableCell>
                      {recipe.difficulty ? (
                        <Badge variant="secondary">{recipe.difficulty}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {recipe.mealType || '-'}
                    </TableCell>
                    <TableCell>
                      {recipe.published ? (
                        <Badge className="bg-green-600">Publicerad</Badge>
                      ) : (
                        <Badge variant="secondary">Utkast</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePublished(recipe)}
                          title={recipe.published ? 'Avpublicera' : 'Publicera'}
                        >
                          {recipe.published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRecipe(recipe)}
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
            <DialogTitle>Skapa nytt recept</DialogTitle>
            <DialogDescription>
              Skapa ett nytt recept. Du kan lägga till ingredienser och instruktioner efteråt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="t.ex. Protein pannkakor"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
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
            <div>
              <Label htmlFor="servings">Portioner *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateRecipe} disabled={isSaving}>
              {isSaving ? 'Skapar...' : 'Skapa recept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
