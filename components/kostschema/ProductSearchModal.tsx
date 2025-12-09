'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Package, ShoppingBag, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  ean: string
  name: string
  brand?: string
  category?: string
  image?: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
}

interface ProductSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (product: Product) => void
  initialSearchTerm?: string
}

export function ProductSearchModal({
  isOpen,
  onClose,
  onSelect,
  initialSearchTerm = ''
}: ProductSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  // Reset search when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm(initialSearchTerm)
      if (initialSearchTerm) {
        searchProducts(initialSearchTerm)
      }
    }
  }, [isOpen, initialSearchTerm])

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([])
      setTotal(0)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=20`)
      if (!res.ok) throw new Error('Failed to search products')

      const data = await res.json()
      setProducts(data.products || [])
      setTotal(data.total || 0)
    } catch (err) {
      console.error('Product search error:', err)
      setError('Kunde inte söka produkter')
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchProducts(searchTerm)
      } else {
        setProducts([])
        setTotal(0)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, searchProducts])

  const handleSelect = (product: Product) => {
    onSelect(product)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-zinc-900 border-zinc-700 max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShoppingBag className="h-5 w-5 text-emerald-500" />
            Hitta produkt från biblioteket
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Sök efter produktnamn, märke eller EAN..."
            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results count */}
        {searchTerm && !isLoading && (
          <div className="text-sm text-zinc-400">
            {total === 0 ? 'Inga produkter hittades' : `${total} produkter hittades`}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-8 text-red-400">
            {error}
          </div>
        )}

        {/* Product list */}
        {!isLoading && products.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="w-full flex items-start gap-3 p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 transition-all text-left group"
              >
                {/* Product image or placeholder */}
                <div className="w-12 h-12 rounded-lg bg-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-zinc-500" />
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white group-hover:text-emerald-400 transition-colors truncate">
                    {product.name}
                  </div>
                  {product.brand && (
                    <div className="text-xs text-zinc-400 truncate">
                      {product.brand}
                    </div>
                  )}
                  {product.category && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {product.category}
                    </div>
                  )}
                </div>

                {/* Macros */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-400">
                    {Math.round(product.kcal)} kcal
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400">
                    P {product.protein}g
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                    K {product.carbs}g
                  </span>
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400">
                    F {product.fat}g
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && searchTerm && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <Package className="h-12 w-12 mb-3 text-zinc-600" />
            <p className="text-lg font-medium">Inga produkter hittades</p>
            <p className="text-sm mt-1">Prova ett annat sökord</p>
          </div>
        )}

        {/* Initial state */}
        {!searchTerm && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
            <Search className="h-12 w-12 mb-3 text-zinc-600" />
            <p className="text-lg font-medium">Sök efter produkter</p>
            <p className="text-sm mt-1">Skriv för att söka i produktbiblioteket</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
