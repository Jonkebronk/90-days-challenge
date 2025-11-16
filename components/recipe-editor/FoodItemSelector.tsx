import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, ThumbsUp, Apple } from 'lucide-react'
import { FoodItem } from './types'
import * as LucideIcons from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FoodItemSelectorProps {
  onSelect: (foodItem: FoodItem) => void
  selectedId?: string
  placeholder?: string
}

type FoodCategory = {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

export function FoodItemSelector({ onSelect, selectedId, placeholder = "Sök ingrediens..." }: FoodItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [categories, setCategories] = useState<FoodCategory[]>([])
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Fetch food items and categories on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch categories
        const categoriesResponse = await fetch('/api/food-categories')
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }

        // Fetch food items (all approved items)
        const response = await fetch('/api/food-items?isApproved=true&limit=1000')
        if (response.ok) {
          const data = await response.json()
          setFoodItems(data.items || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter items based on search and category
  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredItems([])
      setShowDropdown(false)
      return
    }

    let filtered = foodItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.categoryId === categoryFilter)
    }

    // Sort: recommended first, then alphabetically
    filtered.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1
      if (!a.isRecommended && b.isRecommended) return 1
      return a.name.localeCompare(b.name)
    })

    setFilteredItems(filtered.slice(0, 10)) // Limit to 10 results
    setShowDropdown(true)
  }, [searchTerm, foodItems, categoryFilter])

  const handleSelect = (item: FoodItem) => {
    onSelect(item)
    setSearchTerm(item.name)
    setShowDropdown(false)
  }

  const selectedItem = foodItems.find(item => item.id === selectedId)

  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Apple
    const Icon = (LucideIcons as any)[iconName] || Apple
    return Icon
  }

  return (
    <div className="space-y-2">
      {/* Category Filter */}
      {categories.length > 0 && (
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white">
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
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(255,255,255,0.4)]" />
          <Input
            value={searchTerm || selectedItem?.name || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (filteredItems.length > 0) setShowDropdown(true)
            }}
            placeholder={placeholder}
            className="pl-10 bg-[rgba(255,255,255,0.05)] border-[rgba(255,215,0,0.2)] text-white"
            disabled={loading}
          />
        </div>

        {/* Dropdown */}
        {showDropdown && filteredItems.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[rgba(10,10,10,0.98)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg shadow-lg max-h-60 overflow-y-auto backdrop-blur-xl">
            {filteredItems.map((item) => {
              const category = item.foodCategory
              const Icon = category ? getIconComponent(category.icon) : Apple

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="w-full px-4 py-3 text-left hover:bg-[rgba(255,215,0,0.1)] border-b border-[rgba(255,215,0,0.1)] last:border-0 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      {category && (
                        <div
                          className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}40` }}
                        >
                          <Icon className="h-3 w-3" style={{ color: category.color }} />
                        </div>
                      )}
                      <span className="text-[rgba(255,255,255,0.9)] font-medium">
                        {item.name}
                      </span>
                      {item.isRecommended && (
                        <ThumbsUp className="h-3 w-3 text-[#FFD700] flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-[rgba(255,255,255,0.5)] ml-2">
                      {Math.round(Number(item.calories))} kcal/{item.commonServingSize || '100g'}
                    </span>
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.5)]">
                    P: {Number(item.proteinG).toFixed(1)}g | K: {Number(item.carbsG).toFixed(1)}g | F: {Number(item.fatG).toFixed(1)}g
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {showDropdown && filteredItems.length === 0 && searchTerm.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[rgba(10,10,10,0.98)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg shadow-lg p-4 backdrop-blur-xl">
            <p className="text-[rgba(255,255,255,0.5)] text-sm">
              Inga ingredienser hittades
              {categoryFilter !== 'all' && ' i vald kategori'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
