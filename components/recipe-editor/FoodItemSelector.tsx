import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { FoodItem } from './types'

interface FoodItemSelectorProps {
  onSelect: (foodItem: FoodItem) => void
  selectedId?: string
  placeholder?: string
}

export function FoodItemSelector({ onSelect, selectedId, placeholder = "Sök ingrediens..." }: FoodItemSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch food items on mount
  useEffect(() => {
    const fetchFoodItems = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/food-items')
        if (response.ok) {
          const data = await response.json()
          setFoodItems(data.foodItems || [])
        }
      } catch (error) {
        console.error('Error fetching food items:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFoodItems()
  }, [])

  // Filter items based on search
  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredItems([])
      setShowDropdown(false)
      return
    }

    const filtered = foodItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10) // Limit to 10 results

    setFilteredItems(filtered)
    setShowDropdown(true)
  }, [searchTerm, foodItems])

  const handleSelect = (item: FoodItem) => {
    onSelect(item)
    setSearchTerm(item.name)
    setShowDropdown(false)
  }

  const selectedItem = foodItems.find(item => item.id === selectedId)

  return (
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

      {showDropdown && filteredItems.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[rgba(10,10,10,0.98)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg shadow-lg max-h-60 overflow-y-auto backdrop-blur-xl">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-3 text-left hover:bg-[rgba(255,215,0,0.1)] border-b border-[rgba(255,215,0,0.1)] last:border-0 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[rgba(255,255,255,0.9)] font-medium">
                  {item.name}
                </span>
                <span className="text-xs text-[rgba(255,255,255,0.5)]">
                  {item.caloriesPer100g} kcal/100g
                </span>
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.5)] mt-1">
                P: {item.proteinPer100g}g | K: {item.carbsPer100g}g | F: {item.fatPer100g}g
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && filteredItems.length === 0 && searchTerm.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[rgba(10,10,10,0.98)] border-2 border-[rgba(255,215,0,0.3)] rounded-lg shadow-lg p-4 backdrop-blur-xl">
          <p className="text-[rgba(255,255,255,0.5)] text-sm">
            Inga ingredienser hittades
          </p>
        </div>
      )}
    </div>
  )
}
