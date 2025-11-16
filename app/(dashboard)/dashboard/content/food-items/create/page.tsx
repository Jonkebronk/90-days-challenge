'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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

export default function CreateFoodItemPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    commonServingSize: '100g',
    imageUrl: '',
    notes: '',
    isVegetarian: true,
    isVegan: false,
    isRecommended: false,
  })

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.categoryId) {
      toast.error('Namn och kategori krävs')
      return
    }

    if (!formData.calories || !formData.proteinG || !formData.carbsG || !formData.fatG) {
      toast.error('Alla näringsvärden krävs')
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
          calories: parseFloat(formData.calories),
          proteinG: parseFloat(formData.proteinG),
          carbsG: parseFloat(formData.carbsG),
          fatG: parseFloat(formData.fatG),
          commonServingSize: formData.commonServingSize || '100g',
          imageUrl: formData.imageUrl || null,
          notes: formData.notes || null,
          isVegetarian: formData.isVegetarian,
          isVegan: formData.isVegan,
          isRecommended: formData.isRecommended,
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
              <Label htmlFor="commonServingSize" className="text-gray-200">Vanlig portion</Label>
              <Input
                id="commonServingSize"
                value={formData.commonServingSize}
                onChange={(e) => setFormData({ ...formData, commonServingSize: e.target.value })}
                placeholder="t.ex. 100g, 1 st, 1 dl"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Näringsvärden anges per denna portion
              </p>
            </div>

            <div>
              <Label htmlFor="imageUrl" className="text-gray-200">Bild-URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://exempel.se/bild.jpg"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Länk till en bild av livsmedlet
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-xl text-gold-light">Näringsvärden per portion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories" className="text-gray-200">Kalorier (kcal) *</Label>
                <Input
                  id="calories"
                  type="number"
                  step="0.01"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="0"
                  required
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>

              <div>
                <Label htmlFor="proteinG" className="text-gray-200">Protein (g) *</Label>
                <Input
                  id="proteinG"
                  type="number"
                  step="0.1"
                  value={formData.proteinG}
                  onChange={(e) => setFormData({ ...formData, proteinG: e.target.value })}
                  placeholder="0"
                  required
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>

              <div>
                <Label htmlFor="carbsG" className="text-gray-200">Kolhydrater (g) *</Label>
                <Input
                  id="carbsG"
                  type="number"
                  step="0.1"
                  value={formData.carbsG}
                  onChange={(e) => setFormData({ ...formData, carbsG: e.target.value })}
                  placeholder="0"
                  required
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>

              <div>
                <Label htmlFor="fatG" className="text-gray-200">Fett (g) *</Label>
                <Input
                  id="fatG"
                  type="number"
                  step="0.1"
                  value={formData.fatG}
                  onChange={(e) => setFormData({ ...formData, fatG: e.target.value })}
                  placeholder="0"
                  required
                  className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                />
              </div>
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
              <Label htmlFor="notes" className="text-gray-200">Anteckningar</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Förslag på tillagning, fördelar med livsmedlet, etc..."
                rows={4}
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Synlig för klienter i Food Guide
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVegetarian"
                  checked={formData.isVegetarian}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isVegetarian: checked as boolean })
                  }
                  className="border-gold-primary/30 data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-[#0a0a0a]"
                />
                <Label
                  htmlFor="isVegetarian"
                  className="text-gray-200 cursor-pointer"
                >
                  Vegetariskt
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVegan"
                  checked={formData.isVegan}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isVegan: checked as boolean })
                  }
                  className="border-gold-primary/30 data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-[#0a0a0a]"
                />
                <Label
                  htmlFor="isVegan"
                  className="text-gray-200 cursor-pointer"
                >
                  Veganskt
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecommended"
                  checked={formData.isRecommended}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isRecommended: checked as boolean })
                  }
                  className="border-gold-primary/30 data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-[#0a0a0a]"
                />
                <Label
                  htmlFor="isRecommended"
                  className="text-gray-200 cursor-pointer"
                >
                  Rekommenderad (visas med tumme upp)
                </Label>
              </div>
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
