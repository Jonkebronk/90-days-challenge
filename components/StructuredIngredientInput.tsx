'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X } from 'lucide-react'

interface StructuredIngredientInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label: string
}

export function StructuredIngredientInput({
  value,
  onChange,
  placeholder = '',
  label,
}: StructuredIngredientInputProps) {
  const [items, setItems] = useState<string[]>([''])

  // Parse initial value on mount or when value changes externally
  useEffect(() => {
    if (!value) {
      setItems([''])
      return
    }

    // Split by "eller" (case insensitive)
    const parts = value.split(/\s+eller\s+/i).map((p) => p.trim()).filter((p) => p.length > 0)
    if (parts.length > 0) {
      setItems(parts)
    } else {
      setItems([''])
    }
  }, [value])

  const updateItems = (newItems: string[]) => {
    setItems(newItems)
    // Join with " eller " and update parent
    const newValue = newItems.filter((item) => item.trim().length > 0).join(' eller ')
    onChange(newValue)
  }

  const handleItemChange = (index: number, newValue: string) => {
    const newItems = [...items]
    newItems[index] = newValue
    updateItems(newItems)
  }

  const addItem = () => {
    updateItems([...items, ''])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return // Keep at least one item
    const newItems = items.filter((_, i) => i !== index)
    updateItems(newItems)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index}>
          {index > 0 && (
            <div className="flex items-center justify-center my-2">
              <span className="text-blue-400 font-bold text-xs tracking-wider">
                ELLER
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">•</span>
            <Input
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={placeholder}
              className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)] text-sm flex-1"
            />
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full border-gold-primary/30 text-gray-300 hover:bg-gold-primary/10 mt-2"
      >
        <Plus className="w-4 h-4 mr-1" />
        Lägg till alternativ
      </Button>
    </div>
  )
}
