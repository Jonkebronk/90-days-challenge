'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Plus,
  Trash2,
  BookOpen,
  Download,
  FolderOpen,
  ChevronRight,
  Edit,
  Loader2,
  AlertTriangle
} from 'lucide-react'

type CatalogFood = {
  id?: string
  name: string
  amountG: number
  category: string
  protein: number
  carbs: number
  fat: number
  kcal: number
  orderIndex: number
}

type CatalogMeal = {
  id?: string
  name: string
  time: string
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalKcal: number
  orderIndex: number
  foods: CatalogFood[]
}

type CatalogSchema = {
  id: string
  categoryId: string
  name: string
  description?: string
  calorieLevel: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalKcal: number
  isActive: boolean
  orderIndex: number
  meals: CatalogMeal[]
  category?: { id: string; name: string }
}

type CatalogCategory = {
  id: string
  name: string
  description?: string
  icon?: string
  orderIndex: number
  schemas?: CatalogSchema[]
  _count?: { schemas: number }
}

export default function CatalogAdminPage() {
  const { data: session, status } = useSession()
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [schemas, setSchemas] = useState<CatalogSchema[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeedingDb, setIsSeedingDb] = useState(false)
  const [selectedSchema, setSelectedSchema] = useState<CatalogSchema | null>(null)

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDesc, setNewCategoryDesc] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)

  // New schema form
  const [newSchemaDialog, setNewSchemaDialog] = useState(false)
  const [newSchema, setNewSchema] = useState({
    categoryId: '',
    name: '',
    description: '',
    calorieLevel: 2000,
    totalProtein: 150,
    totalCarbs: 200,
    totalFat: 70,
    totalKcal: 2000
  })
  const [isCreatingSchema, setIsCreatingSchema] = useState(false)

  // Redirect non-coaches
  if (status === 'authenticated' && (session?.user as any)?.role !== 'coach') {
    redirect('/dashboard')
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [catRes, schemaRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/schemas?includeInactive=true')
      ])

      if (catRes.ok) {
        const catData = await catRes.json()
        setCategories(catData.categories || [])
      }

      if (schemaRes.ok) {
        const schemaData = await schemaRes.json()
        setSchemas(schemaData.schemas || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Kunde inte hämta katalogdata')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDatabase = async () => {
    if (!confirm('Vill du importera alla fördefinierade scheman till databasen?')) {
      return
    }

    try {
      setIsSeedingDb(true)
      const res = await fetch('/api/catalog/seed', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        toast.success(data.message)
        fetchData()
      } else {
        toast.error(data.error || 'Ett fel uppstod')
      }
    } catch (error) {
      console.error('Error seeding database:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSeedingDb(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Ange ett kategorinamn')
      return
    }

    try {
      setIsCreatingCategory(true)
      const res = await fetch('/api/catalog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Kategori skapad!')
        setNewCategoryName('')
        setNewCategoryDesc('')
        fetchData()
      } else {
        toast.error(data.error || 'Ett fel uppstod')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Är du säker? Alla scheman i kategorin kommer att raderas.')) {
      return
    }

    try {
      const res = await fetch(`/api/catalog/categories/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        toast.success('Kategori raderad')
        fetchData()
      } else {
        toast.error(data.error || 'Ett fel uppstod')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleCreateSchema = async () => {
    if (!newSchema.categoryId || !newSchema.name.trim()) {
      toast.error('Ange kategori och namn')
      return
    }

    try {
      setIsCreatingSchema(true)
      const res = await fetch('/api/catalog/schemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchema)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Schema skapat!')
        setNewSchemaDialog(false)
        setNewSchema({
          categoryId: '',
          name: '',
          description: '',
          calorieLevel: 2000,
          totalProtein: 150,
          totalCarbs: 200,
          totalFat: 70,
          totalKcal: 2000
        })
        fetchData()
      } else {
        toast.error(data.error || 'Ett fel uppstod')
      }
    } catch (error) {
      console.error('Error creating schema:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsCreatingSchema(false)
    }
  }

  const handleDeleteSchema = async (id: string) => {
    if (!confirm('Är du säker på att du vill radera detta schema?')) {
      return
    }

    try {
      const res = await fetch(`/api/catalog/schemas/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        toast.success('Schema raderat')
        setSelectedSchema(null)
        fetchData()
      } else {
        toast.error(data.error || 'Ett fel uppstod')
      }
    } catch (error) {
      console.error('Error deleting schema:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const viewSchema = async (id: string) => {
    try {
      const res = await fetch(`/api/catalog/schemas/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedSchema(data.schema)
      }
    } catch (error) {
      console.error('Error fetching schema:', error)
      toast.error('Kunde inte hämta schemat')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laddar katalog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Kostschema-katalog
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Hantera fördefinierade kostscheman
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.length === 0 && schemas.length === 0 && (
          <Button
            onClick={handleSeedDatabase}
            disabled={isSeedingDb}
            className="bg-gradient-to-r from-gold-primary to-amber-500 hover:from-gold-light hover:to-amber-400 text-gray-900"
          >
            {isSeedingDb ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importerar...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Importera fördefinierade scheman
              </>
            )}
          </Button>
        )}

        <Dialog open={newSchemaDialog} onOpenChange={setNewSchemaDialog}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nytt schema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Skapa nytt kostschema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Kategori</Label>
                <Select
                  value={newSchema.categoryId}
                  onValueChange={(val) => setNewSchema({ ...newSchema, categoryId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Namn</Label>
                <Input
                  value={newSchema.name}
                  onChange={(e) => setNewSchema({ ...newSchema, name: e.target.value })}
                  placeholder="T.ex. Standard 2000 kcal"
                />
              </div>
              <div>
                <Label>Beskrivning (valfritt)</Label>
                <Textarea
                  value={newSchema.description}
                  onChange={(e) => setNewSchema({ ...newSchema, description: e.target.value })}
                  placeholder="Kort beskrivning av schemat"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Kalorier (kcal)</Label>
                  <Input
                    type="number"
                    value={newSchema.calorieLevel}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      setNewSchema({ ...newSchema, calorieLevel: val, totalKcal: val })
                    }}
                  />
                </div>
                <div>
                  <Label>Protein (g)</Label>
                  <Input
                    type="number"
                    value={newSchema.totalProtein}
                    onChange={(e) => setNewSchema({ ...newSchema, totalProtein: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Kolhydrater (g)</Label>
                  <Input
                    type="number"
                    value={newSchema.totalCarbs}
                    onChange={(e) => setNewSchema({ ...newSchema, totalCarbs: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Fett (g)</Label>
                  <Input
                    type="number"
                    value={newSchema.totalFat}
                    onChange={(e) => setNewSchema({ ...newSchema, totalFat: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Avbryt</Button>
              </DialogClose>
              <Button onClick={handleCreateSchema} disabled={isCreatingSchema}>
                {isCreatingSchema ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Skapa schema
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Categories & Schemas List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Create Category */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-gold-primary" />
                Ny kategori
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Kategorinamn"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Input
                placeholder="Beskrivning (valfritt)"
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
              />
              <Button
                onClick={handleCreateCategory}
                disabled={isCreatingCategory}
                className="w-full"
                size="sm"
              >
                {isCreatingCategory ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Lägg till
              </Button>
            </CardContent>
          </Card>

          {/* Categories List */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold-primary" />
                Kategorier ({categories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {categories.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Inga kategorier ännu
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <Accordion type="single" collapsible className="px-2">
                    {categories.map((category) => {
                      const categorySchemas = schemas.filter((s) => s.categoryId === category.id)
                      return (
                        <AccordionItem key={category.id} value={category.id} className="border-b-0">
                          <AccordionTrigger className="py-3 px-2 hover:bg-gray-50 rounded hover:no-underline">
                            <div className="flex items-center gap-2 text-left">
                              <span className="font-medium text-gray-900">{category.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {categorySchemas.length}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-2">
                            <div className="ml-2 space-y-1">
                              {categorySchemas.length === 0 ? (
                                <p className="text-xs text-gray-500 px-2 py-1">Inga scheman</p>
                              ) : (
                                categorySchemas
                                  .sort((a, b) => a.calorieLevel - b.calorieLevel)
                                  .map((schema) => (
                                    <button
                                      key={schema.id}
                                      onClick={() => viewSchema(schema.id)}
                                      className={`w-full flex items-center justify-between px-3 py-2 rounded text-left text-sm transition-colors ${
                                        selectedSchema?.id === schema.id
                                          ? 'bg-gold-primary/10 border border-gold-primary/30'
                                          : 'hover:bg-gray-100'
                                      }`}
                                    >
                                      <span className="truncate">{schema.calorieLevel} kcal</span>
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                  ))
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Ta bort kategori
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Schema Detail View */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {selectedSchema ? selectedSchema.name : 'Välj ett schema'}
                </span>
                {selectedSchema && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteSchema(selectedSchema.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Radera
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSchema ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Välj ett schema i listan till vänster för att se detaljer</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Schema Info */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-gray-500 mb-1">Kalorier</p>
                      <p className="text-lg font-bold text-gray-900">{selectedSchema.totalKcal}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-red-600 mb-1">Protein</p>
                      <p className="text-lg font-bold text-red-700">{selectedSchema.totalProtein}g</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-amber-600 mb-1">Kolhydrater</p>
                      <p className="text-lg font-bold text-amber-700">{selectedSchema.totalCarbs}g</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-blue-600 mb-1">Fett</p>
                      <p className="text-lg font-bold text-blue-700">{selectedSchema.totalFat}g</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedSchema.description && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedSchema.description}
                    </div>
                  )}

                  {/* Meals */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Måltider ({selectedSchema.meals?.length || 0})</h3>
                    {(!selectedSchema.meals || selectedSchema.meals.length === 0) ? (
                      <div className="text-center py-6 bg-amber-50 rounded-lg">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-sm text-amber-700">
                          Detta schema har inga måltider ännu.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedSchema.meals.map((meal) => (
                          <div key={meal.id || meal.orderIndex} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{meal.name}</h4>
                                <p className="text-xs text-gray-500">{meal.time}</p>
                              </div>
                              <div className="flex gap-2 text-xs">
                                <span className="text-red-600">{meal.totalProtein}P</span>
                                <span className="text-amber-600">{meal.totalCarbs}K</span>
                                <span className="text-blue-600">{meal.totalFat}F</span>
                                <span className="text-gray-700">{meal.totalKcal} kcal</span>
                              </div>
                            </div>
                            {meal.foods && meal.foods.length > 0 && (
                              <div className="space-y-1">
                                {meal.foods.map((food, idx) => (
                                  <div key={food.id || idx} className="flex items-center justify-between text-sm py-1 border-t first:border-t-0">
                                    <span className="text-gray-700">{food.name}</span>
                                    <span className="text-gray-500">{food.amountG}g</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
