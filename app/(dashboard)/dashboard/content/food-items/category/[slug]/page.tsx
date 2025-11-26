'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Pencil,
  Apple,
  X,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

type FoodCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

type FoodItem = {
  id: string
  name: string
  categoryId?: string | null
  calories: number | null
  proteinG: number | null
  carbsG: number | null
  fatG: number | null
  commonServingSize?: string | null
  imageUrl?: string | null
  isRecommended: boolean
  notes?: string | null
  isApproved: boolean
  isVegetarian: boolean
  isVegan: boolean
  foodCategory?: FoodCategory | null
}

export default function CategoryFoodItemsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { data: session } = useSession()
  const router = useRouter()

  const [categorySlug, setCategorySlug] = useState<string>('')
  const [category, setCategory] = useState<FoodCategory | null>(null)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null)

  useEffect(() => {
    params.then((p) => setCategorySlug(p.slug))
  }, [params])

  useEffect(() => {
    if (categorySlug && session?.user) {
      fetchCategory()
      fetchFoodItems()
    }
  }, [categorySlug, session, search])

  const fetchCategory = async () => {
    try {
      const response = await fetch(`/api/food-categories/slug/${categorySlug}`)
      if (response.ok) {
        const data = await response.json()
        setCategory(data.category)
      } else {
        toast.error('Kategori hittades inte')
        router.push('/dashboard/content/food-items')
      }
    } catch (error) {
      console.error('Error fetching category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const fetchFoodItems = async () => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      params.append('categorySlug', categorySlug)
      if (search) params.append('search', search)

      const response = await fetch(`/api/food-items?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFoodItems(data.items || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error fetching food items:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleRecommended = async (itemId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/food-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRecommended: !currentValue }),
      })

      if (response.ok) {
        toast.success(currentValue ? 'Borttagen från rekommenderade' : 'Tillagd till rekommenderade')
        fetchFoodItems()
      } else {
        toast.error('Kunde inte uppdatera')
      }
    } catch (error) {
      console.error('Error updating food item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleToggleApproved = async (itemId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/food-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentValue }),
      })

      if (response.ok) {
        toast.success(currentValue ? 'Markerad som ej godkänd' : 'Godkänd')
        fetchFoodItems()
      } else {
        toast.error('Kunde inte uppdatera')
      }
    } catch (error) {
      console.error('Error updating food item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (itemId: string, itemName: string) => {
    if (!confirm(`Är du säker på att du vill radera "${itemName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/food-items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Livsmedel raderat')
        fetchFoodItems()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera')
      }
    } catch (error) {
      console.error('Error deleting food item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName]
    return IconComponent || Apple
  }

  if (!session?.user) {
    return null
  }

  const isCoach = (session.user as any).role === 'coach'

  if (isLoading && !category) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-gray-400 text-center py-8">Laddar...</p>
      </div>
    )
  }

  if (!category) {
    return null
  }

  const Icon = getIconComponent(category.icon)

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <button
          onClick={() => {
            if (selectedSubcategory) {
              setSelectedSubcategory(null)
            } else {
              router.push('/dashboard/content/food-items')
            }
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-gold-primary transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tillbaka</span>
        </button>

        <div className="text-center mb-4 sm:mb-6">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-3 sm:mb-4 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-xl sm:text-2xl md:text-3xl font-black tracking-[1px] sm:tracking-[2px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-2">
            {selectedSubcategory || category.name}
          </h1>
          <p className="text-gray-400 text-xs">
            {selectedSubcategory ? `${foodItems.filter(item => (item as any).subcategory === selectedSubcategory).length} livsmedel` : `${total} livsmedel`}
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-3 sm:mt-4 opacity-30" />
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="flex gap-2 max-w-6xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök livsmedel..."
            className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        {isCoach && (
          <Button
            onClick={() => router.push('/dashboard/content/food-items/create')}
            className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nytt livsmedel</span>
          </Button>
        )}
      </div>

      {/* Food Items Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : foodItems.length === 0 ? (
        <Card className="bg-white border border-gray-200 max-w-6xl mx-auto">
          <CardContent className="text-center py-12">
            <Apple className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">
              Inga livsmedel i denna kategori
            </p>
            {isCoach && (
              <Button
                onClick={() => router.push('/dashboard/content/food-items/create')}
                className="mt-4 bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till livsmedel
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (() => {
        // Group items by subcategory
        const grouped = foodItems.reduce((acc, item) => {
          const key = (item as any).subcategory || 'Övrigt'
          if (!acc[key]) acc[key] = []
          acc[key].push(item)
          return acc
        }, {} as Record<string, FoodItem[]>)

        const subcategoryNames = Object.keys(grouped).sort((a, b) => {
          if (a === 'Övrigt') return 1
          if (b === 'Övrigt') return -1
          return a.localeCompare(b, 'sv')
        })

        const hasSubcategories = subcategoryNames.length > 1 || !grouped['Övrigt']

        // If we have subcategories and none is selected, show them as clickable cards first
        if (hasSubcategories && !selectedSubcategory && !search) {
          return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
              {subcategoryNames.map((subcategoryName) => {
                const items = grouped[subcategoryName]
                const categoryColor = category?.color || '#22c55e'
                return (
                  <div
                    key={subcategoryName}
                    onClick={() => setSelectedSubcategory(subcategoryName)}
                    className="group relative bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center"
                  >
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-md"
                      style={{ background: `linear-gradient(135deg, ${categoryColor}, ${categoryColor}dd)` }}
                    >
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 text-center">
                      {subcategoryName}
                    </h3>
                    <p className="text-gray-500 text-center text-[10px] sm:text-xs mt-0.5">
                      {items.length} livsmedel
                    </p>
                  </div>
                )
              })}
            </div>
          )
        }

        // Show individual food items (when a subcategory is selected or searching)
        let itemsToShow = foodItems
        if (selectedSubcategory) {
          itemsToShow = grouped[selectedSubcategory] || []
        } else if (search) {
          itemsToShow = foodItems.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
        }

        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
            {itemsToShow.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gold-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {item.imageUrl ? (
                  <div className="h-20 sm:h-24 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-20 sm:h-24 w-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <Apple className="h-8 w-8 text-green-300" />
                  </div>
                )}
                <div className="p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-gold-primary transition-colors">
                    {item.name}
                  </h3>
                </div>
                {isCoach && (
                  <div className="absolute top-1 right-1 flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 hover:bg-white text-gray-600 hover:text-gold-primary rounded-full"
                      onClick={() => router.push(`/dashboard/content/food-items/${item.id}/edit?categorySlug=${categorySlug}`)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 rounded-full"
                      onClick={() => handleDelete(item.id, item.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      })()}

      {/* Food Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="bg-white border border-gray-200 max-w-md sm:max-w-lg">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900 pr-8">
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image */}
                {selectedItem.imageUrl && (
                  <div className="w-full h-48 rounded-lg overflow-hidden">
                    <img
                      src={selectedItem.imageUrl}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {/* Notes */}
                {selectedItem.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Anteckningar</p>
                    <p className="text-sm text-gray-700">{selectedItem.notes}</p>
                  </div>
                )}

                {/* Actions */}
                {isCoach && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button
                      onClick={() => {
                        setSelectedItem(null)
                        router.push(`/dashboard/content/food-items/${selectedItem.id}/edit?categorySlug=${categorySlug}`)
                      }}
                      className="flex-1 bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Redigera
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDelete(selectedItem.id, selectedItem.name)
                        setSelectedItem(null)
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
