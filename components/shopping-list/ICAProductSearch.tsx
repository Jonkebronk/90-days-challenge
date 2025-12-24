'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Loader2, Store, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ICAProductCard, type ICAProduct } from './ICAProductCard'
import { StoreSelector } from './StoreSelector'
import { cn } from '@/lib/utils'

interface ICAProductSearchProps {
  onAddProduct: (product: ICAProduct) => void
  onToggleFavorite?: (product: ICAProduct) => void
  favoriteIds?: Set<string>
  addedIds?: Set<string>
  className?: string
  compact?: boolean
}

interface StorePreference {
  storeId: string
  storeName: string
}

export function ICAProductSearch({
  onAddProduct,
  onToggleFavorite,
  favoriteIds = new Set(),
  addedIds = new Set(),
  className,
  compact = false,
}: ICAProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<ICAProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store selection
  const [storePreference, setStorePreference] = useState<StorePreference | null>(null)
  const [showStoreSelector, setShowStoreSelector] = useState(false)
  const [loadingPreference, setLoadingPreference] = useState(true)

  // Load store preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const res = await fetch('/api/user/store-preference')
        if (res.ok) {
          const data = await res.json()
          if (data.preference) {
            setStorePreference(data.preference)
          } else {
            // No store selected - prompt user
            setShowStoreSelector(true)
          }
        }
      } catch (err) {
        console.error('Error loading store preference:', err)
      } finally {
        setLoadingPreference(false)
      }
    }

    loadPreference()
  }, [])

  // Search products
  const searchProducts = useCallback(async () => {
    if (!searchQuery.trim() || !storePreference?.storeId) {
      setProducts([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        term: searchQuery,
        storeId: storePreference.storeId,
        limit: '20',
      })

      const res = await fetch(`/api/ica/search?${params}`)

      if (!res.ok) {
        throw new Error('Failed to search products')
      }

      const data = await res.json()
      setProducts(data.products || [])

      if (data.warning) {
        setError(data.warning)
      }
    } catch (err) {
      console.error('Error searching products:', err)
      setError('Kunde inte söka produkter')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [searchQuery, storePreference?.storeId])

  // Debounced search
  useEffect(() => {
    const debounce = setTimeout(searchProducts, 400)
    return () => clearTimeout(debounce)
  }, [searchProducts])

  const handleStoreSelect = (store: any) => {
    setStorePreference({
      storeId: store.storeId || store.id,
      storeName: store.name,
    })
  }

  if (loadingPreference) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Store indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowStoreSelector(true)}
          className="flex items-center gap-2 text-sm text-zinc-600 hover:text-red-600 transition-colors"
        >
          <Store className="h-4 w-4" />
          <span>
            {storePreference?.storeName || 'Välj butik'}
          </span>
        </button>
        {storePreference && (
          <button
            onClick={() => setShowStoreSelector(true)}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Byt butik
          </button>
        )}
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Sök produkter i ICA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
          disabled={!storePreference}
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setProducts([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* No store selected message */}
      {!storePreference && (
        <div className="text-center py-8 bg-red-50 rounded-xl border border-red-200">
          <Store className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Välj din ICA-butik</p>
          <p className="text-red-600 text-sm mt-1">
            För att söka produkter och se priser
          </p>
          <button
            onClick={() => setShowStoreSelector(true)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Välj butik
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-red-600" />
        </div>
      )}

      {/* Results */}
      {!loading && products.length > 0 && (
        <div
          className={cn(
            compact
              ? 'space-y-2'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'
          )}
        >
          {products.map((product) => (
            <ICAProductCard
              key={product.id}
              product={product}
              onAdd={onAddProduct}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favoriteIds.has(product.id)}
              isAdded={addedIds.has(product.id)}
              compact={compact}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {!loading &&
        searchQuery &&
        products.length === 0 &&
        storePreference && (
          <div className="text-center py-8 text-zinc-500">
            <p>Inga produkter hittades</p>
            <p className="text-sm mt-1">Prova ett annat sökord</p>
          </div>
        )}

      {/* Store selector dialog */}
      <StoreSelector
        isOpen={showStoreSelector}
        onClose={() => setShowStoreSelector(false)}
        onSelect={handleStoreSelect}
        currentStoreId={storePreference?.storeId}
      />
    </div>
  )
}
