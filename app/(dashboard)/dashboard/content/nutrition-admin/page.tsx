'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

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
        console.log('📥 Categories loaded from DB:', data.categories.map((c: any) => `${c.name}:${c.order}`).join(', '))
        data.categories.forEach((cat: any) => {
          const orderInfo = cat.items.map((item: any) => `${item.name}:${item.order}`).join(', ')
          console.log(`${cat.name} ITEMS ORDER:`, orderInfo)
        })
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
    console.log('🔄 Moving category:', categoryId, direction)
    const index = categories.findIndex(c => c.id === categoryId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === categories.length - 1) return

    const newCategories = [...categories]
    const swapIndex = direction === 'up' ? index - 1 : index + 1

    console.log(`  Moving ${newCategories[index].name} from position ${index} to ${swapIndex}`)

    // Just swap positions in array - order will be assigned based on array position when saving
    ;[newCategories[index], newCategories[swapIndex]] = [newCategories[swapIndex], newCategories[index]]

    setCategories(newCategories)
    setHasUnsavedChanges(true)
    console.log('✅ Category moved, hasUnsavedChanges set to true')
  }

  const moveItem = (categoryId: string, itemId: string, direction: 'up' | 'down') => {
    console.log('🔄 Moving item:', itemId, direction)
    setCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat

        const index = cat.items.findIndex(i => i.id === itemId)
        if (index === -1) return cat
        if (direction === 'up' && index === 0) return cat
        if (direction === 'down' && index === cat.items.length - 1) return cat

        const newItems = [...cat.items]
        const swapIndex = direction === 'up' ? index - 1 : index + 1

        console.log(`  Swapping ${newItems[index].name} (${index}) with ${newItems[swapIndex].name} (${swapIndex})`)

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
    console.log('✅ hasUnsavedChanges set to true')
  }

  const saveChanges = useCallback(async () => {
    try {
      setIsSaving(true)

      // Save category order first
      const categoryUpdates = categories.map((cat, index) => ({
        id: cat.id,
        order: index, // Use current array position as order
      }))

      console.log('💾 Saving category order:', categories.map((c, i) => `${c.name}:${i}`).join(', '))

      const categoryResponse = await fetch('/api/nutrition-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: categoryUpdates }),
      })

      if (!categoryResponse.ok) {
        const errorData = await categoryResponse.json()
        console.error('❌ Failed to save category order:', errorData)
        throw new Error('Failed to update category order')
      }

      console.log('✅ Category order saved successfully')

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
            order: index, // Use original array index as order within category
          }))

        const orderInfo = existingItems.map(i => `${i.name}:${i.order}`).join(', ')
        console.log(`${cat.name} SAVE ORDER:`, orderInfo)

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
      console.log('Save completed, reloading data...')

      // Reload data to sync with database
      await fetchData()

      toast.success('Ändringar sparade!')
    } catch (error) {
      console.error('Error saving changes:', error)
      toast.error('Kunde inte spara ändringar')
      setHasUnsavedChanges(true) // Set back to true on error
    } finally {
      setIsSaving(false)
    }
  }, [categories, activeType])


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
              Redigera livsmedel under varje kategori
            </p>
          </div>
        </div>
        <Button
          onClick={saveChanges}
          disabled={isSaving || !hasUnsavedChanges}
          className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar...' : hasUnsavedChanges ? 'Spara ändringar' : 'Allt sparat'}
        </Button>
      </div>

      {/* Type Selector */}
      <Tabs value={activeType} onValueChange={async (v) => {
        // Auto-save before switching tabs if there are unsaved changes
        if (hasUnsavedChanges) {
          await saveChanges()
        }
        setActiveType(v as any)
      }} className="w-full">
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

        <TabsContent value={activeType} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category, categoryIndex) => (
              <Card key={category.id} className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg text-gold-light">{category.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCategory(category.id, 'up')}
                      disabled={categoryIndex === 0}
                      className="text-gold-light hover:bg-gold-50/10 h-7 w-7 p-0"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveCategory(category.id, 'down')}
                      disabled={categoryIndex === categories.length - 1}
                      className="text-gold-light hover:bg-gold-50/10 h-7 w-7 p-0"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 flex-1">
                    {category.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 bg-white/5 border border-gold-primary/20 rounded-lg hover:bg-gold-primary/10 transition-colors"
                      >
                        <Input
                          value={item.name}
                          onChange={(e) => updateItemValue(category.id, item.id, 'name', e.target.value)}
                          className="flex-1 bg-black/30 border-gold-primary/30 text-white text-sm h-8"
                        />
                        <div className="flex items-center gap-0.5">
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
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => addItem(category.id)}
                    variant="ghost"
                    size="sm"
                    className="mt-3 border border-gold-primary/30 text-gold-light hover:bg-gold-50 hover:text-gold-light w-full"
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Lägg till
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
