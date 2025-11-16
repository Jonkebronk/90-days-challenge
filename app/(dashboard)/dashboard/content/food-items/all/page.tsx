'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  ThumbsUp,
  CheckCircle2,
  XCircle,
  Trash2,
  Pencil,
  Upload,
  Apple,
  Filter,
} from 'lucide-react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import { CSVImportDialog } from '@/components/food-items/CSVImportDialog'

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

export default function FoodItemsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [recommendedFilter, setRecommendedFilter] = useState<string>('all')
  const [approvedFilter, setApprovedFilter] = useState<string>('all')

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
      fetchFoodItems()
    }
  }, [session, search, categoryFilter, recommendedFilter, approvedFilter])

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

  const fetchFoodItems = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter)
      if (recommendedFilter !== 'all') params.append('isRecommended', recommendedFilter)
      if (approvedFilter !== 'all') params.append('isApproved', approvedFilter)

      const response = await fetch(`/api/food-items?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setFoodItems(data.items)
        setTotal(data.total)
      } else {
        toast.error('Kunde inte hämta livsmedel')
      }
    } catch (error) {
      console.error('Error fetching food items:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleRecommended = async (item: FoodItem) => {
    try {
      const response = await fetch(`/api/food-items/${item.id}/recommend`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success(item.isRecommended ? 'Rekommendation borttagen' : 'Markerad som rekommenderad')
        fetchFoodItems()
      } else {
        toast.error('Kunde inte uppdatera')
      }
    } catch (error) {
      console.error('Error toggling recommended:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleToggleApproved = async (item: FoodItem) => {
    try {
      const response = await fetch(`/api/food-items/${item.id}/approve`, {
        method: 'PATCH'
      })

      if (response.ok) {
        toast.success(item.isApproved ? 'Godkännande återkallat' : 'Godkänd')
        fetchFoodItems()
      } else {
        toast.error('Kunde inte uppdatera')
      }
    } catch (error) {
      console.error('Error toggling approved:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteItem = async (item: FoodItem) => {
    if (!confirm(`Är du säker på att du vill radera "${item.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/food-items/${item.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Livsmedel raderat')
        fetchFoodItems()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Apple
    const Icon = (LucideIcons as any)[iconName] || Apple
    return Icon
  }

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setRecommendedFilter('all')
    setApprovedFilter('all')
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">Du har inte behörighet att se denna sida.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            Livsmedel
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Skapa och hantera livsmedel
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsImportDialogOpen(true)}
            variant="outline"
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importera CSV
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

      {/* Filters */}
      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-[#FFD700]" />
          <h2 className="text-lg font-bold text-[#FFD700]">Filter</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <Label htmlFor="search" className="text-[rgba(255,255,255,0.8)] text-sm mb-2">Sök</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
              <Input
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök livsmedel..."
                className="pl-10 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-[rgba(255,255,255,0.8)] text-sm mb-2">Kategori</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                <SelectItem value="all" className="text-white">Alla kategorier</SelectItem>
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

          {/* Recommended */}
          <div>
            <Label htmlFor="recommended" className="text-[rgba(255,255,255,0.8)] text-sm mb-2">Rekommenderad</Label>
            <Select value={recommendedFilter} onValueChange={setRecommendedFilter}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                <SelectItem value="all" className="text-white">Alla</SelectItem>
                <SelectItem value="true" className="text-white">Rekommenderade</SelectItem>
                <SelectItem value="false" className="text-white">Ej rekommenderade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Approved */}
          <div>
            <Label htmlFor="approved" className="text-[rgba(255,255,255,0.8)] text-sm mb-2">Godkännande</Label>
            <Select value={approvedFilter} onValueChange={setApprovedFilter}>
              <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                <SelectItem value="all" className="text-white">Alla</SelectItem>
                <SelectItem value="true" className="text-white">Godkända</SelectItem>
                <SelectItem value="false" className="text-white">Ej godkända</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[rgba(255,255,255,0.6)]">
            Visar {foodItems.length} av {total} livsmedel
          </p>
          <Button
            onClick={resetFilters}
            variant="ghost"
            size="sm"
            className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
          >
            Återställ filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-[rgba(255,215,0,0.3)] border-t-[#FFD700] rounded-full animate-spin mx-auto" />
          </div>
        ) : foodItems.length === 0 ? (
          <div className="text-center py-12">
            <Apple className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
            <p className="text-[rgba(255,255,255,0.6)] text-lg">
              {search || categoryFilter !== 'all' || recommendedFilter !== 'all' || approvedFilter !== 'all'
                ? 'Inga livsmedel matchar filtren.'
                : 'Inga livsmedel ännu.'}
            </p>
            <p className="text-sm text-[rgba(255,255,255,0.4)] mt-2">
              {search || categoryFilter !== 'all' || recommendedFilter !== 'all' || approvedFilter !== 'all'
                ? 'Prova att ändra dina filter.'
                : 'Skapa ditt första livsmedel för att komma igång.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[rgba(255,215,0,0.2)] hover:bg-[rgba(255,215,0,0.05)]">
                  <TableHead className="text-[rgba(255,215,0,0.8)]">Namn</TableHead>
                  <TableHead className="text-[rgba(255,215,0,0.8)]">Kategori</TableHead>
                  <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Kcal</TableHead>
                  <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Protein</TableHead>
                  <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Kolhydr.</TableHead>
                  <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Fett</TableHead>
                  <TableHead className="text-[rgba(255,215,0,0.8)]">Portion</TableHead>
                  <TableHead className="text-center text-[rgba(255,215,0,0.8)]">Status</TableHead>
                  <TableHead className="text-right text-[rgba(255,215,0,0.8)]">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foodItems.map((item) => {
                  const category = item.foodCategory
                  const Icon = category ? getIconComponent(category.icon) : Apple

                  return (
                    <TableRow key={item.id} className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.05)] transition-colors">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{item.name}</div>
                          {item.notes && (
                            <div className="text-xs text-[rgba(255,255,255,0.5)] mt-1 line-clamp-1">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {category ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center"
                              style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
                            >
                              <Icon className="h-4 w-4" style={{ color: category.color }} />
                            </div>
                            <span className="text-sm text-[rgba(255,255,255,0.7)]">{category.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[rgba(255,255,255,0.4)]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-white">{Math.round(Number(item.calories))}</TableCell>
                      <TableCell className="text-right text-white">{Number(item.proteinG).toFixed(1)}g</TableCell>
                      <TableCell className="text-right text-white">{Number(item.carbsG).toFixed(1)}g</TableCell>
                      <TableCell className="text-right text-white">{Number(item.fatG).toFixed(1)}g</TableCell>
                      <TableCell className="text-sm text-[rgba(255,255,255,0.6)]">
                        {item.commonServingSize || '100g'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            className={
                              item.isApproved
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }
                          >
                            {item.isApproved ? 'Godkänd' : 'Väntar'}
                          </Badge>
                          {item.isRecommended && (
                            <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">
                              <ThumbsUp className="h-3 w-3" />
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleRecommended(item)}
                            className={
                              item.isRecommended
                                ? 'text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]'
                                : 'text-[rgba(255,255,255,0.4)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]'
                            }
                            title="Toggle rekommenderad"
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleApproved(item)}
                            className={
                              item.isApproved
                                ? 'text-green-400 hover:bg-green-500/10'
                                : 'text-[rgba(255,255,255,0.4)] hover:bg-green-500/10 hover:text-green-400'
                            }
                            title="Toggle godkänd"
                          >
                            {item.isApproved ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/content/food-items/${item.id}/edit`)}
                            className="text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(item)}
                            className="text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,0,0,0.1)] hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportComplete={fetchFoodItems}
      />
    </div>
  )
}
