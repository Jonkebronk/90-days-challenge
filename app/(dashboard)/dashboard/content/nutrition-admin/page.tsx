'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

type NutritionItem = {
  id: string
  name: string
  valuePer100g: number
  order: number
}

type NutritionCategory = {
  id: string
  key: string
  name: string
  order: number
  items: NutritionItem[]
}

export default function NutritionAdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeType, setActiveType] = useState<'protein' | 'fat' | 'carbs'>('protein')
  const [categories, setCategories] = useState<NutritionCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const isCoach = (session?.user as any)?.role === 'coach'

  useEffect(() => {
    if (session?.user) {
      if (!isCoach) {
        router.push('/dashboard')
      } else {
        fetchData()
      }
    }
  }, [session, activeType])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/nutrition-categories?type=${activeType}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Kunde inte hämta data')
    } finally {
      setIsLoading(false)
    }
  }

  const updateItemValue = (categoryId: string, itemId: string, field: 'name' | 'valuePer100g', value: string | number) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
              ),
            }
          : cat
      )
    )
  }

  const addItem = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    const newItem: NutritionItem = {
      id: `temp-${Date.now()}`,
      name: 'Nytt livsmedel',
      valuePer100g: 0,
      order: category.items.length,
    }

    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: [...cat.items, newItem] }
          : cat
      )
    )
  }

  const removeItem = (categoryId: string, itemId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, items: cat.items.filter(item => item.id !== itemId) }
          : cat
      )
    )
  }

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === categoryId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    const newCategories = [...categories]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    // Swap order values
    const tempOrder = newCategories[index].order
    newCategories[index].order = newCategories[swapIndex].order
    newCategories[swapIndex].order = tempOrder

    // Swap positions
    ;[newCategories[index], newCategories[swapIndex]] = [newCategories[swapIndex], newCategories[index]]

    setCategories(newCategories)
  }

  const saveChanges = async () => {
    try {
      setIsSaving(true)

      // Prepare items for bulk update
      const allItems = categories.flatMap(cat =>
        cat.items.filter(item => !item.id.startsWith('temp-')).map(item => ({
          id: item.id,
          name: item.name,
          valuePer100g: item.valuePer100g,
          order: item.order,
        }))
      )

      // Update existing items
      if (allItems.length > 0) {
        const updateResponse = await fetch('/api/nutrition-items', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: allItems }),
        })

        if (!updateResponse.ok) {
          throw new Error('Failed to update items')
        }
      }

      // Create new items
      const newItems = categories.flatMap(cat =>
        cat.items
          .filter(item => item.id.startsWith('temp-'))
          .map(item => ({
            categoryId: cat.id,
            name: item.name,
            valuePer100g: item.valuePer100g,
            order: item.order,
          }))
      )

      for (const newItem of newItems) {
        const createResponse = await fetch('/api/nutrition-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        })

        if (!createResponse.ok) {
          throw new Error('Failed to create item')
        }
      }

      toast.success('Ändringar sparade!')
      await fetchData()
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Kunde inte spara ändringar')
    } finally {
      setIsSaving(false)
    }
  }

  if (!session?.user || !isCoach) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
              Hantera Näringstabeller
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-1">
              Redigera näringsvärden, lägg till eller ta bort livsmedel
            </p>
          </div>
        </div>
        <Button
          onClick={saveChanges}
          disabled={isSaving}
          className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar...' : 'Spara alla ändringar'}
        </Button>
      </div>

      {/* Type Selector */}
      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-[rgba(255,255,255,0.03)]">
          <TabsTrigger value="protein" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a]">
            Protein
          </TabsTrigger>
          <TabsTrigger value="fat" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a]">
            Fett
          </TabsTrigger>
          <TabsTrigger value="carbs" className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a]">
            Kolhydrater
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeType} className="mt-6 space-y-4">
          {categories.map((category, categoryIndex) => (
            <Card key={category.id} className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-[#FFD700]">{category.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={categoryIndex === 0}
                    className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={categoryIndex === categories.length - 1}
                    className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[rgba(255,215,0,0.2)] hover:bg-transparent">
                      <TableHead className="text-[rgba(255,255,255,0.8)]">Livsmedel</TableHead>
                      <TableHead className="text-[rgba(255,255,255,0.8)]">Värde per 100g</TableHead>
                      <TableHead className="text-right text-[rgba(255,255,255,0.8)]">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.items.map((item) => (
                      <TableRow key={item.id} className="border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                        <TableCell className="w-1/2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItemValue(category.id, item.id, 'name', e.target.value)}
                            className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={item.valuePer100g}
                            onChange={(e) => updateItemValue(category.id, item.id, 'valuePer100g', parseFloat(e.target.value) || 0)}
                            className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white max-w-[150px]"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(category.id, item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  onClick={() => addItem(category.id)}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till livsmedel
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
