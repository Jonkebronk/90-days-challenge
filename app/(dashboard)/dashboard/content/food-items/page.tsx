'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Apple,
  ChevronRight,
  Plus,
  List,
  FileText,
  Beef,
  Droplet,
  Wheat,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { toast } from 'sonner'

type FoodCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  _count: {
    foodItems: number
  }
}

export default function FoodItemsCategoriesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/food-categories?includeCounts=true')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        toast.error('Kunde inte hämta kategorier')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            Livsmedelbanken
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Välj en kategori för att se livsmedel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/dashboard/content/food-items/all')}
            variant="outline"
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            <List className="h-4 w-4 mr-2" />
            Visa alla
          </Button>
          <Button
            onClick={() => router.push('/dashboard/content/food-items/create')}
            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nytt livsmedel
          </Button>
        </div>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardContent className="text-center py-16">
            <Apple className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-[rgba(255,255,255,0.6)] text-lg mb-2">
              Inga kategorier ännu
            </p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mb-6">
              Skapa kategorier för att organisera dina livsmedel
            </p>
            <Button
              onClick={() => router.push('/dashboard/content/categories')}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold"
            >
              Skapa kategorier
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const Icon = getIconComponent(category.icon)
            return (
              <Card
                key={category.id}
                className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] hover:border-[rgba(255,215,0,0.4)] hover:scale-105 transition-all cursor-pointer backdrop-blur-[10px]"
                onClick={() => router.push(`/dashboard/content/food-items/category/${category.slug}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon
                        className="h-7 w-7"
                        style={{ color: category.color }}
                      />
                    </div>
                    <ChevronRight className="h-5 w-5 text-[rgba(255,255,255,0.4)]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: `${category.color}15`,
                        color: category.color,
                        borderColor: `${category.color}40`,
                      }}
                    >
                      {category._count?.foodItems || 0} livsmedel
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Nutrition Overviews Section */}
      <div className="mt-8 space-y-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            Näringsöversikter
          </h2>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Detaljerade tabeller med näringsinnehåll
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein Overview Card */}
          <Card
            className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(59,130,246,0.2)] hover:border-[rgba(59,130,246,0.4)] hover:scale-105 transition-all cursor-pointer backdrop-blur-[10px]"
            onClick={() => router.push('/dashboard/content/food-items/overviews/protein')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                >
                  <Beef className="h-7 w-7 text-blue-400" />
                </div>
                <ChevronRight className="h-5 w-5 text-[rgba(255,255,255,0.4)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Protein källor
              </h3>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">
                Komplett översikt med näringsinnehåll för olika portioner
              </p>
            </CardContent>
          </Card>

          {/* Fat Overview Card */}
          <Card
            className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(234,179,8,0.2)] hover:border-[rgba(234,179,8,0.4)] hover:scale-105 transition-all cursor-pointer backdrop-blur-[10px]"
            onClick={() => router.push('/dashboard/content/food-items/overviews/fett')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)' }}
                >
                  <Droplet className="h-7 w-7 text-yellow-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-[rgba(255,255,255,0.4)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Fett källor
              </h3>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">
                Komplett översikt med näringsinnehåll för olika portioner
              </p>
            </CardContent>
          </Card>

          {/* Carbs Overview Card */}
          <Card
            className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(249,115,22,0.2)] hover:border-[rgba(249,115,22,0.4)] hover:scale-105 transition-all cursor-pointer backdrop-blur-[10px]"
            onClick={() => router.push('/dashboard/content/food-items/overviews/kolhydrater')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)' }}
                >
                  <Wheat className="h-7 w-7 text-orange-500" />
                </div>
                <ChevronRight className="h-5 w-5 text-[rgba(255,255,255,0.4)]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Kolhydrat källor
              </h3>
              <p className="text-sm text-[rgba(255,255,255,0.6)]">
                Komplett översikt med näringsinnehåll för olika portioner
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
