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
            Skapa Recept
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Skapa och hantera recept
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nytt recept
        </Button>
      </div>

      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
        <div className="p-6 border-b border-[rgba(255,215,0,0.2)]">
          <h2 className="text-xl font-bold text-[#FFD700] tracking-[1px]">Alla recept ({recipes.length})</h2>
        </div>
        <div className="p-6">
          {isLoading ? (
            <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
          ) : recipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">Inga recept ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                Skapa ditt första recept för att komma igång.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,215,0,0.05)]">
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Titel</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Kategori</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Portioner</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Svårighetsgrad</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Måltidstyp</TableHead>
                    <TableHead className="text-[rgba(255,215,0,0.8)]">Status</TableHead>
                    <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow key={recipe.id} className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                      <TableCell className="font-medium text-white">{recipe.title}</TableCell>
                      <TableCell>
                        <Badge className="bg-[rgba(255,215,0,0.1)] text-[#FFD700] border border-[rgba(255,215,0,0.3)] hover:bg-[rgba(255,215,0,0.2)]">
                          {recipe.category.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{recipe.servings}</TableCell>
                      <TableCell>
                        {recipe.difficulty ? (
                          <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                            {recipe.difficulty}
                          </Badge>
                        ) : <span className="text-[rgba(255,255,255,0.4)]">-</span>}
                      </TableCell>
                      <TableCell className="text-[rgba(255,255,255,0.6)]">
                        {recipe.mealType || '-'}
                      </TableCell>
                      <TableCell>
                        {recipe.published ? (
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
                            onClick={() => handleTogglePublished(recipe)}
                            title={recipe.published ? 'Avpublicera' : 'Publicera'}
                            className="hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
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
                            onClick={() => router.push(`/dashboard/content/recipes/${recipe.id}/edit`)}
                            title="Redigera recept"
                            className="hover:bg-[rgba(255,215,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteRecipe(recipe)}
                            className="hover:bg-[rgba(255,0,0,0.1)] text-[rgba(255,255,255,0.6)] hover:text-red-400"
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
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Skapa nytt recept
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Skapa ett nytt recept. Du kan lägga till ingredienser och instruktioner efteråt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-[rgba(255,255,255,0.8)]">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="t.ex. Protein pannkakor"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-[rgba(255,255,255,0.8)]">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-[rgba(255,215,0,0.1)]">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="servings" className="text-[rgba(255,255,255,0.8)]">Portioner *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateRecipe}
              disabled={isSaving}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {isSaving ? 'Skapar...' : 'Skapa recept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
