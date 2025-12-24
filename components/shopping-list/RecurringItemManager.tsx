'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Plus, Loader2, Trash2, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface RecurringItem {
  id: string
  icaProductId: string | null
  foodItemId: string | null
  customName: string | null
  quantity: number
  unit: string
  category: string
  frequency: string
  isActive: boolean
  icaProductData?: {
    price?: number
    imageUrl?: string
    name?: string
  } | null
  foodItem?: {
    id: string
    name: string
  } | null
  createdAt: string
}

interface RecurringItemManagerProps {
  onAddAllToList?: (items: RecurringItem[]) => void
  className?: string
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Varje vecka',
  biweekly: 'Varannan vecka',
  monthly: 'Varje månad',
}

export function RecurringItemManager({
  onAddAllToList,
  className,
}: RecurringItemManagerProps) {
  const [items, setItems] = useState<RecurringItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/recurring-items')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (err) {
      console.error('Error fetching recurring items:', err)
      toast.error('Kunde inte hämta återkommande varor')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, currentValue: boolean) => {
    try {
      setUpdatingId(id)
      const res = await fetch('/api/recurring-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentValue }),
      })

      if (res.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, isActive: !currentValue } : item
          )
        )
      } else {
        toast.error('Kunde inte uppdatera')
      }
    } catch (err) {
      console.error('Error updating item:', err)
      toast.error('Ett fel uppstod')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/recurring-items?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
        toast.success('Vara borttagen')
      } else {
        toast.error('Kunde inte ta bort vara')
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      toast.error('Ett fel uppstod')
    } finally {
      setDeletingId(null)
    }
  }

  const activeItems = items.filter((i) => i.isActive)

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="h-8 w-8 text-blue-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          Inga återkommande varor
        </h3>
        <p className="text-zinc-600 max-w-sm mx-auto">
          Lägg till varor som du köper regelbundet så läggs de automatiskt till i dina inköpslistor.
        </p>
      </div>
    )
  }

  // Group by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Övrigt'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, RecurringItem[]>)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Add all button */}
      {onAddAllToList && activeItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-blue-900">
                {activeItems.length} aktiva varor
              </p>
              <p className="text-sm text-blue-700">
                Lägg till alla i din inköpslista
              </p>
            </div>
            <Button
              onClick={() => onAddAllToList(activeItems)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till alla
            </Button>
          </div>
        </div>
      )}

      {/* Items by category */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-1 mb-3">
            {category}
          </h3>
          <div className="space-y-2">
            {categoryItems.map((item) => {
              const name = item.customName || item.icaProductData?.name || item.foodItem?.name || 'Okänd vara'
              const imageUrl = item.icaProductData?.imageUrl
              const price = item.icaProductData?.price

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
                    item.isActive
                      ? 'border-zinc-200 bg-white'
                      : 'border-zinc-100 bg-zinc-50 opacity-60'
                  )}
                >
                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <RefreshCw className="h-5 w-5 text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{name}</p>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <span>
                        {item.quantity} {item.unit}
                      </span>
                      <span>•</span>
                      <span>{frequencyLabels[item.frequency] || item.frequency}</span>
                      {price && (
                        <>
                          <span>•</span>
                          <span className="text-gold-primary font-medium">
                            {price.toFixed(2)} kr
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                      disabled={updatingId === item.id}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                        item.isActive
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                      )}
                    >
                      {updatingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : item.isActive ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
