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
  customValues?: Record<number, number> // Store manual values for each target
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const isCoach = (session?.user as any)?.role === 'coach'
  const proteinTargets = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]

  // Auto-save when categories change (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges || isLoading || isSaving) return

    const saveTimer = setTimeout(() => {
      saveChanges()
    }, 2000) // Auto-save after 2 seconds of no changes

    return () => clearTimeout(saveTimer)
  }, [categories, hasUnsavedChanges, isLoading, isSaving])

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
    setHasUnsavedChanges(true)
  }

  // Update custom value for a specific target
  const updateCustomValue = (categoryId: string, itemId: string, target: number, value: number) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map(item =>
                item.id === itemId
                  ? {
                      ...item,
                      customValues: {
                        ...(item.customValues || {}),
                        [target]: value
                      }
                    }
                  : item
              ),
            }
          : cat
      )
    )
    setHasUnsavedChanges(true)
  }

  // Get value for a specific target (custom or calculated)
  const getValueForTarget = (item: NutritionItem, target: number): number => {
    // Return custom value if exists, otherwise calculate
    if (item.customValues && item.customValues[target] !== undefined) {
      return item.customValues[target]
    }
    return calculateFoodWeight(item.valuePer100g, target)
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

  const moveItem = (categoryId: string, itemId: string, direction: 'up' | 'down') => {
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat

        const index = cat.items.findIndex(i => i.id === itemId)
        if (index === -1) return cat
        if (direction === 'up' && index === 0) return cat
        if (direction === 'down' && index === cat.items.length - 1) return cat

        const newItems = [...cat.items]
        const swapIndex = direction === 'up' ? index - 1 : index + 1

        // Swap order values
        const tempOrder = newItems[index].order
        newItems[index].order = newItems[swapIndex].order
        newItems[swapIndex].order = tempOrder

        // Swap positions
        ;[newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]]

        return { ...cat, items: newItems }
      })
    )
    setHasUnsavedChanges(true)
  }

  const saveChanges = async () => {
    try {
      setIsSaving(true)

      // Process each category separately to maintain correct order within category
      for (const cat of categories) {
        // Update existing items with reassigned order based on current position
        // Map with index FIRST to preserve original position, then filter
        const existingItems = cat.items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => !item.id.startsWith('temp-'))
          .map(({ item, index }) => ({
            id: item.id,
            name: item.name,
            valuePer100g: item.valuePer100g,
            customValues: item.customValues || null,
            order: index, // Use original array index as order within category
          }))

        if (existingItems.length > 0) {
          const updateResponse = await fetch('/api/nutrition-items', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: existingItems }),
          })

          if (!updateResponse.ok) {
            throw new Error('Failed to update items')
          }
        }

        // Create new items with correct order
        const newItems = cat.items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => item.id.startsWith('temp-'))
          .map(({ item, index }) => ({
            categoryId: cat.id,
            name: item.name,
            valuePer100g: item.valuePer100g,
            customValues: item.customValues || null,
            order: index, // Use current array index as order within category
          }))

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
      }

      setHasUnsavedChanges(false)
      // Don't show toast for auto-save, only for manual save
      if (!hasUnsavedChanges) {
        toast.success('Ändringar sparade!')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Kunde inte spara ändringar')
      setHasUnsavedChanges(true) // Set back to true on error
    } finally {
      setIsSaving(false)
    }
  }

  if (!session?.user || !isCoach) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-gray-400 text-center py-8">Laddar...</p>
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
            className="text-gray-400 hover:text-gold-light"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
              Hantera Näringstabeller
            </h1>
            <p className="text-gray-400 mt-1">
              Fyll i hur många gram mat som ger 20g protein - resten räknas ut automatiskt
            </p>
          </div>
        </div>
        <Button
          onClick={saveChanges}
          disabled={isSaving || !hasUnsavedChanges}
          className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar automatiskt...' : hasUnsavedChanges ? 'Spara nu' : 'Allt sparat'}
        </Button>
      </div>

      {/* Type Selector */}
      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as any)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 bg-white/5">
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
            <Card key={category.id} className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl text-gold-light">{category.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={categoryIndex === 0}
                    className="border border-gold-primary/30 text-gold-light hover:bg-gold-50 hover:text-gold-light"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={categoryIndex === categories.length - 1}
                    className="border border-gold-primary/30 text-gold-light hover:bg-gold-50 hover:text-gold-light"
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
                        <th className="px-2 py-2 text-left text-xs font-semibold text-gray-200 border border-gold-primary/20 sticky left-0 bg-gray-900/95 z-10">
                          Livsmedel
                        </th>
                        {proteinTargets.map((target) => (
                          <th
                            key={target}
                            className="px-2 py-2 text-center text-xs font-semibold text-gold-light border border-gold-primary/20 min-w-[70px]"
                          >
                            <div>{target}g</div>
                            <div className="text-[rgba(255,215,0,0.6)] font-normal">Protein</div>
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-200 border border-gold-primary/20 min-w-[120px]">
                          Åtgärder
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-gold-primary/10 hover:bg-[rgba(255,215,0,0.02)] ${
                            idx % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''
                          }`}
                        >
                          <td className="px-2 py-2 border border-gold-primary/10 sticky left-0 bg-gray-900/95 z-10">
                            <Input
                              value={item.name}
                              onChange={(e) => updateItemValue(category.id, item.id, 'name', e.target.value)}
                              className="bg-black/30 border-gold-primary/30 text-white h-8 text-xs"
                            />
                          </td>
                          {proteinTargets.map((target) => (
                            <td key={target} className="px-2 py-2 border border-gold-primary/10">
                              <Input
                                type="number"
                                value={getValueForTarget(item, target)}
                                onChange={(e) => updateCustomValue(category.id, item.id, target, parseInt(e.target.value) || 0)}
                                className="bg-black/30 border-gold-primary/30 text-white h-8 text-xs text-center"
                                placeholder="0"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-2 text-center border border-gold-primary/10">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveItem(category.id, item.id, 'up')}
                                disabled={idx === 0}
                                className="text-gold-light hover:bg-gold-50/10 h-7 w-7 p-0"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveItem(category.id, item.id, 'down')}
                                disabled={idx === category.items.length - 1}
                                className="text-gold-light hover:bg-gold-50/10 h-7 w-7 p-0"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(category.id, item.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
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
                  className="mt-4 border border-gold-primary/30 text-gold-light hover:bg-gold-50 hover:text-gold-light"
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
