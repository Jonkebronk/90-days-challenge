'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowLeft,
  Plus,
  Search,
  ThumbsUp,
  CheckCircle2,
  Trash2,
  Pencil,
  Apple,
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
  calories: number
  proteinG: number
  carbsG: number
  fatG: number
  commonServingSize?: string | null
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
  const [total, setTotal] = useState(0)

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

  if (!session?.user || (session.user as any).role !== 'coach') {
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

  if (isLoading && !category) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
      </div>
    )
  }

  if (!category) {
    return null
  }

  const Icon = getIconComponent(category.icon)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/content/food-items')}
          className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: category.color }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
              {category.name}
            </h1>
            <p className="text-[rgba(255,255,255,0.6)] mt-0.5">
              {total} livsmedel
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push('/dashboard/content/food-items/create')}
          className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nytt livsmedel
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.5)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sök livsmedel..."
          className="pl-10 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
        />
      </div>

      {/* Food Items Grid */}
      {isLoading ? (
        <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
      ) : foodItems.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="text-center py-16">
            <Apple className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-[rgba(255,255,255,0.6)] text-lg mb-2">
              Inga livsmedel i denna kategori
            </p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mb-6">
              Börja lägga till livsmedel för att bygga din databas
            </p>
            <Button
              onClick={() => router.push('/dashboard/content/food-items/create')}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till livsmedel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foodItems.map((item) => (
            <Card
              key={item.id}
              className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-all backdrop-blur-[10px]"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg mb-1">{item.name}</h3>
                    {item.commonServingSize && (
                      <p className="text-xs text-[rgba(255,255,255,0.5)]">
                        Per {item.commonServingSize}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${
                        item.isRecommended
                          ? 'text-[#FFD700] hover:text-[#FFA500]'
                          : 'text-[rgba(255,255,255,0.3)] hover:text-[#FFD700]'
                      }`}
                      onClick={() => handleToggleRecommended(item.id, item.isRecommended)}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${
                        item.isApproved
                          ? 'text-green-500 hover:text-green-400'
                          : 'text-[rgba(255,255,255,0.3)] hover:text-green-500'
                      }`}
                      onClick={() => handleToggleApproved(item.id, item.isApproved)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="text-center p-2 rounded bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.1)]">
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">Kcal</p>
                    <p className="font-semibold text-white">{item.calories}</p>
                  </div>
                  <div className="text-center p-2 rounded bg-[rgba(100,100,255,0.05)] border border-[rgba(100,100,255,0.1)]">
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">Protein</p>
                    <p className="font-semibold text-blue-300">{item.proteinG}g</p>
                  </div>
                  <div className="text-center p-2 rounded bg-[rgba(255,165,0,0.05)] border border-[rgba(255,165,0,0.1)]">
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">Kolh.</p>
                    <p className="font-semibold text-orange-300">{item.carbsG}g</p>
                  </div>
                  <div className="text-center p-2 rounded bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.1)]">
                    <p className="text-xs text-[rgba(255,255,255,0.5)]">Fett</p>
                    <p className="font-semibold text-yellow-300">{item.fatG}g</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.isVegetarian && (
                      <Badge className="text-xs bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                        Veg
                      </Badge>
                    )}
                    {item.isVegan && (
                      <Badge className="text-xs bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                        Vegan
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[rgba(255,255,255,0.5)] hover:text-[#FFD700]"
                      onClick={() => router.push(`/dashboard/content/food-items/${item.id}/edit`)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[rgba(255,255,255,0.5)] hover:text-red-400"
                      onClick={() => handleDelete(item.id, item.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
