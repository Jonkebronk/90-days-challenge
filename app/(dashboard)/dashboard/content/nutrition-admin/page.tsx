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
  const proteinTargets = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]

  // Calculate food weight needed to get target protein/fat/carbs
  const calculateFoodWeight = (valuePer100g: number, targetValue: number) => {
    if (valuePer100g === 0) return 0
    return Math.round((targetValue * 100) / valuePer100g)
  }

  // Calculate valuePer100g from food weight and target
  const calculateValuePer100g = (foodWeight: number, targetValue: number) => {
    if (foodWeight === 0) return 0
    return parseFloat(((targetValue * 100) / foodWeight).toFixed(2))
  }

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

  const updateItemByWeight = (categoryId: string, itemId: string, targetValue: number, foodWeight: number) => {
    const newValuePer100g = calculateValuePer100g(foodWeight, targetValue)
    updateItemValue(categoryId, itemId, 'valuePer100g', newValuePer100g)
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
              Fyll i hur många gram mat som ger 20g - resten räknas ut automatiskt
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
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={categoryIndex === 0}
                    className="border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={categoryIndex === categories.length - 1}
                    className="border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead className="bg-[rgba(255,215,0,0.05)]">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs font-semibold text-[rgba(255,255,255,0.8)] border border-[rgba(255,215,0,0.2)] sticky left-0 bg-[rgba(10,10,10,0.95)] z-10">
                          Livsmedel
                        </th>
                        {proteinTargets.map((target) => (
                          <th
                            key={target}
                            className="px-2 py-2 text-center text-xs font-semibold text-[#FFD700] border border-[rgba(255,215,0,0.2)] min-w-[70px]"
                          >
                            <div>{target}g</div>
                            <div className="text-[rgba(255,215,0,0.6)] font-normal">(gram mat)</div>
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-xs font-semibold text-[rgba(255,255,255,0.8)] border border-[rgba(255,215,0,0.2)] min-w-[80px]">
                          Åtgärder
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)] ${
                            idx % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''
                          }`}
                        >
                          <td className="px-2 py-2 border border-[rgba(255,215,0,0.1)] sticky left-0 bg-[rgba(10,10,10,0.95)] z-10">
                            <Input
                              value={item.name}
                              onChange={(e) => updateItemValue(category.id, item.id, 'name', e.target.value)}
                              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white h-8 text-xs"
                            />
                          </td>
                          {proteinTargets.map((target, targetIndex) => (
                            <td key={target} className="px-2 py-2 border border-[rgba(255,215,0,0.1)]">
                              {targetIndex === 0 ? (
                                <Input
                                  type="number"
                                  value={calculateFoodWeight(item.valuePer100g, target)}
                                  onChange={(e) => updateItemByWeight(category.id, item.id, target, parseInt(e.target.value) || 0)}
                                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white h-8 text-xs text-center"
                                  placeholder="0"
                                />
                              ) : (
                                <div className="px-2 py-1 text-center text-[rgba(255,255,255,0.8)]">
                                  {calculateFoodWeight(item.valuePer100g, target)}
                                </div>
                              )}
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center border border-[rgba(255,215,0,0.1)]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(category.id, item.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button
                  onClick={() => addItem(category.id)}
                  variant="ghost"
                  size="sm"
                  className="mt-4 border border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
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
