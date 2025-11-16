'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Apple, ThumbsUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import * as LucideIcons from 'lucide-react'

type FoodCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  orderIndex: number
  _count: {
    foodItems: number
  }
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
  foodCategory?: {
    id: string
    name: string
    slug: string
    color: string
    icon: string
  } | null
}

export default function FoodGuidePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch categories
      const categoriesResponse = await fetch('/api/food-categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories)
      }

      // Fetch approved food items
      const itemsResponse = await fetch('/api/food-items?isApproved=true&limit=1000')
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        setFoodItems(itemsData.items)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Apple
    const Icon = (LucideIcons as any)[iconName] || Apple
    return Icon
  }

  const filteredItems = foodItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  )

  const groupedByCategory = categories.map(category => ({
    category,
    items: filteredItems.filter(item => item.categoryId === category.id)
  })).filter(group => group.items.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar livsmedelsguide...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-[rgba(255,255,255,0.8)] hover:text-[#FFD700]"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <div className="flex items-center justify-center gap-3 mb-4">
            <Apple className="w-8 h-8 text-[#FFD700]" />
            <h1 className="font-['Orbitron',sans-serif] text-3xl md:text-4xl font-black tracking-[3px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Livsmedelsguide
            </h1>
          </div>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Godkända livsmedel med näringsinformation
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök livsmedel..."
              className="pl-10 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
            />
          </div>
        </div>

        {/* Food Items by Category */}
        {groupedByCategory.length === 0 ? (
          <div className="text-center py-12">
            <Apple className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-[rgba(255,255,255,0.6)] text-lg">
              {search ? 'Inga livsmedel matchar din sökning.' : 'Inga godkända livsmedel ännu.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedByCategory.map(({ category, items }) => {
              const Icon = getIconComponent(category.icon)

              return (
                <div key={category.id} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{
                        backgroundColor: `${category.color}20`,
                        border: `2px solid ${category.color}40`
                      }}
                    >
                      <Icon className="h-6 w-6" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: category.color }}>
                        {category.name}
                      </h2>
                      <p className="text-sm text-[rgba(255,255,255,0.5)]">
                        {items.length} {items.length === 1 ? 'livsmedel' : 'livsmedel'}
                      </p>
                    </div>
                  </div>

                  {/* Food Items Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items
                      .sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4 hover:border-[rgba(255,215,0,0.4)] transition-all"
                        >
                          {/* Item Header */}
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-white flex-1">
                              {item.name}
                            </h3>
                            {item.isRecommended && (
                              <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30 ml-2">
                                <ThumbsUp className="h-3 w-3" />
                              </Badge>
                            )}
                          </div>

                          {/* Serving Size */}
                          {item.commonServingSize && (
                            <p className="text-xs text-[rgba(255,255,255,0.5)] mb-3">
                              Per {item.commonServingSize}
                            </p>
                          )}

                          {/* Nutrition Grid */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-[rgba(0,0,0,0.3)] rounded p-2">
                              <p className="text-xs text-[rgba(255,255,255,0.5)]">Kalorier</p>
                              <p className="text-sm font-semibold text-white">
                                {Math.round(Number(item.calories))} kcal
                              </p>
                            </div>
                            <div className="bg-[rgba(0,0,0,0.3)] rounded p-2">
                              <p className="text-xs text-[rgba(255,255,255,0.5)]">Protein</p>
                              <p className="text-sm font-semibold text-white">
                                {Number(item.proteinG).toFixed(1)}g
                              </p>
                            </div>
                            <div className="bg-[rgba(0,0,0,0.3)] rounded p-2">
                              <p className="text-xs text-[rgba(255,255,255,0.5)]">Kolhydr.</p>
                              <p className="text-sm font-semibold text-white">
                                {Number(item.carbsG).toFixed(1)}g
                              </p>
                            </div>
                            <div className="bg-[rgba(0,0,0,0.3)] rounded p-2">
                              <p className="text-xs text-[rgba(255,255,255,0.5)]">Fett</p>
                              <p className="text-sm font-semibold text-white">
                                {Number(item.fatG).toFixed(1)}g
                              </p>
                            </div>
                          </div>

                          {/* Diet Badges */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.isVegan && (
                              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                                Veganskt
                              </Badge>
                            )}
                            {item.isVegetarian && !item.isVegan && (
                              <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                                Vegetariskt
                              </Badge>
                            )}
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <div className="border-t border-[rgba(255,215,0,0.1)] pt-3">
                              <p className="text-xs text-[rgba(255,255,255,0.6)] italic">
                                {item.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom Action */}
        <div className="text-center pt-6">
          <Button
            onClick={() => router.push('/dashboard/meal-plan')}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold px-8 py-6 text-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all"
          >
            Till Mitt Kostschema
          </Button>
        </div>
      </div>
    </div>
  )
}
