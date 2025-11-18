'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Apple } from 'lucide-react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'

type FoodCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

type NutritionCategory = {
  id: string
  type: string
  key: string
  name: string
  order: number
}

export default function CreateFoodItemPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [nutritionCategories, setNutritionCategories] = useState<NutritionCategory[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    subcategory: '',
    imageUrl: '',
    notes: '',
  })

  // Map food category slug to nutrition type
  const getNutritionType = (categorySlug: string): string => {
    const mapping: Record<string, string> = {
      'proteinkalla': 'protein',
      'kolhydratkalla': 'carbs',
      'fettkalla': 'fat',
      'gronsaker': 'vegetables'
    }
    return mapping[categorySlug] || 'protein'
  }

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  // Fetch nutrition categories when category changes
  useEffect(() => {
    if (formData.categoryId) {
      const category = categories.find(c => c.id === formData.categoryId)
      if (category) {
        fetchNutritionCategories(category.slug)
      }
    }
  }, [formData.categoryId, categories])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/food-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchNutritionCategories = async (categorySlug: string) => {
    try {
      const nutritionType = getNutritionType(categorySlug)
      const response = await fetch(`/api/nutrition-categories?type=${nutritionType}`)
      if (response.ok) {
        const data = await response.json()
        setNutritionCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching nutrition categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.categoryId) {
      toast.error('Namn och kategori krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/food-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId,
          subcategory: formData.subcategory || null,
          imageUrl: formData.imageUrl || null,
          notes: formData.notes || null,
        })
      })

      if (response.ok) {
        toast.success('Livsmedel skapat')
        router.push('/dashboard/content/food-items')
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa livsmedel')
      }
    } catch (error) {
      console.error('Error creating food item:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Apple
    const Icon = (LucideIcons as any)[iconName] || Apple
    return Icon
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">Du har inte behörighet att se denna sida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gold-light"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            Skapa livsmedel
          </h1>
          <p className="text-gray-400 mt-1">
            Lägg till ett nytt livsmedel i databasen
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-xl text-gold-light">Grundläggande information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-200">Namn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="t.ex. Kycklingfilé, Havregryn, Broccoli"
                required
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>

            <div>
              <Label htmlFor="category" className="text-gray-200">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                required
              >
                <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                  {categories.map((cat) => {
                    const Icon = getIconComponent(cat.icon)
                    return (
                      <SelectItem key={cat.id} value={cat.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: cat.color }} />
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subcategory" className="text-gray-200">Subkategori (valfritt)</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
              >
                <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                  <SelectValue placeholder="Välj subkategori" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900/95 border-gold-primary/30">
                  {nutritionCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name} className="text-white">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Används för att gruppera livsmedel inom en kategori
              </p>
            </div>

            <div>
              <Label htmlFor="imageUrl" className="text-gray-200">Bild-URL (valfritt)</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://exempel.se/bild.jpg"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
              {formData.imageUrl && (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">Förhandsvisning:</p>
                  <img src={formData.imageUrl} alt={formData.name || 'Förhandsvisning'} className="w-full h-48 object-cover rounded-lg" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-xl text-gold-light">Ytterligare information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notes" className="text-gray-200">Anteckningar (valfritt)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Förslag på tillagning, fördelar med livsmedlet, etc..."
                rows={4}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gold-primary/20">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-gold-primary/30 text-gray-200 hover:bg-gold-50"
          >
            Avbryt
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Skapa livsmedel'}
          </Button>
        </div>
      </form>
    </div>
  )
}
