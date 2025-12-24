'use client'

import { useState, useEffect } from 'react'
import { Heart, Plus, Loader2, Trash2, ShoppingCart } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
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
          Tryck på hjärtat på en produkt i ICA-sökningen för att spara den som favorit.
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
              const isAdded = addedIds.has(fav.id) || addedIds.has(fav.icaProductId || '')
              const imageUrl = fav.icaProductData?.imageUrl || fav.imageUrl
              const price = fav.icaProductData?.price

              return (
                <div
                  key={fav.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all',
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
                    {price && (
                      <p className="text-sm text-gold-primary font-semibold">
                        {price.toFixed(2)} kr
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onAddToList && (
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
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
