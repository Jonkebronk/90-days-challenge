'use client'

import { useState, useEffect, useCallback } from 'react'
import { Heart, Plus, Loader2, Trash2, ListPlus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface FavoriteProduct {
  id: string
  icaProductId: string | null
  foodItemId: string | null
  name: string
  imageUrl: string | null
  category: string | null
  icaProductData?: {
    price?: number
    comparePrice?: string
    imageUrl?: string
  } | null
  foodItem?: {
    id: string
    name: string
  } | null
  createdAt: string
}

interface ShoppingList {
  id: string
  name: string
  color: string
}

interface FavoriteProductListProps {
  onAddToList?: (product: FavoriteProduct) => void
  addedIds?: Set<string>
  className?: string
}

export function FavoriteProductList({
  onAddToList,
  addedIds = new Set(),
  className,
}: FavoriteProductListProps) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showListPicker, setShowListPicker] = useState<string | null>(null)
  const [addedToList, setAddedToList] = useState<Set<string>>(new Set())

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        setFavorites(data.favorites || [])
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
      toast.error('Kunde inte hämta favoriter')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchShoppingLists = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-lists')
      if (res.ok) {
        const data = await res.json()
        setShoppingLists((data.ownLists || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        })))
      }
    } catch (err) {
      console.error('Error fetching shopping lists:', err)
    }
  }, [])

  useEffect(() => {
    fetchFavorites()
    fetchShoppingLists()
  }, [fetchFavorites, fetchShoppingLists])

  const handleAddToShoppingList = async (fav: FavoriteProduct, listId: string) => {
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: fav.name,
          quantity: 1,
          unit: 'st',
          category: fav.category || 'Övrigt',
        }),
      })

      if (res.ok) {
        const list = shoppingLists.find(l => l.id === listId)
        toast.success(`${fav.name} tillagd i ${list?.name || 'inköpslistan'}`)
        setAddedToList(prev => new Set([...prev, fav.id]))
        setShowListPicker(null)
      } else {
        toast.error('Kunde inte lägga till vara')
      }
    } catch (err) {
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      const res = await fetch(`/api/favorites?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.id !== id))
        toast.success('Favorit borttagen')
      } else {
        toast.error('Kunde inte ta bort favorit')
      }
    } catch (err) {
      console.error('Error deleting favorite:', err)
      toast.error('Ett fel uppstod')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="h-8 w-8 text-pink-500" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          Inga favoriter ännu
        </h3>
        <p className="text-zinc-600 max-w-sm mx-auto">
          Gå till Livsmedel och tryck på hjärtat på ett livsmedel för att spara som favorit.
        </p>
      </div>
    )
  }

  // Group by category
  const groupedFavorites = favorites.reduce((acc, fav) => {
    const category = fav.category || 'Övrigt'
    if (!acc[category]) acc[category] = []
    acc[category].push(fav)
    return acc
  }, {} as Record<string, FavoriteProduct[]>)

  return (
    <div className={cn('space-y-6', className)}>
      {Object.entries(groupedFavorites).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-1 mb-3">
            {category}
          </h3>
          <div className="space-y-2">
            {items.map((fav) => {
              const isAdded = addedIds.has(fav.id) || addedIds.has(fav.icaProductId || '') || addedToList.has(fav.id)
              const imageUrl = fav.icaProductData?.imageUrl || fav.imageUrl
              const isPickerOpen = showListPicker === fav.id

              return (
                <div
                  key={fav.id}
                  className={cn(
                    'relative flex items-center gap-3 p-3 rounded-xl border transition-all',
                    isAdded
                      ? 'border-green-500 bg-green-50'
                      : 'border-zinc-200 bg-white hover:border-gold-primary/50'
                  )}
                >
                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={fav.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-5 w-5 text-pink-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900 truncate">{fav.name}</p>
                    <p className="text-xs text-zinc-500">{fav.category || 'Övrigt'}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToList ? (
                      <Button
                        size="sm"
                        variant={isAdded ? 'secondary' : 'default'}
                        onClick={() => onAddToList(fav)}
                        disabled={isAdded}
                        className={cn(
                          'h-8 px-3',
                          isAdded
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gold-primary text-white hover:bg-gold-secondary'
                        )}
                      >
                        {isAdded ? 'Tillagd' : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Lägg till
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={isAdded ? 'secondary' : 'outline'}
                        onClick={() => setShowListPicker(isPickerOpen ? null : fav.id)}
                        disabled={isAdded}
                        className={cn(
                          'h-8 px-3',
                          isAdded
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                        )}
                      >
                        {isAdded ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Tillagd
                          </>
                        ) : (
                          <>
                            <ListPlus className="h-4 w-4 mr-1" />
                            Handla
                          </>
                        )}
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(fav.id)}
                      disabled={deletingId === fav.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      {deletingId === fav.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* List picker dropdown */}
                  {isPickerOpen && (
                    <div className="absolute right-3 top-14 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden min-w-[180px]">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-medium text-gray-700">Lägg till i lista</p>
                      </div>
                      {shoppingLists.length === 0 ? (
                        <div className="p-3 text-center text-xs text-gray-500">
                          Inga inköpslistor ännu
                        </div>
                      ) : (
                        <div className="max-h-40 overflow-auto">
                          {shoppingLists.map(list => (
                            <button
                              key={list.id}
                              onClick={() => handleAddToShoppingList(fav, list.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                            >
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: list.color }}
                              />
                              <span className="text-sm text-gray-700 truncate">{list.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
