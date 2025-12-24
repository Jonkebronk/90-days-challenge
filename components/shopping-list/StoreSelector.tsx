'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Store, Check, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ICAStore {
  id: string
  storeId: string
  name: string
  address?: string
  city?: string
  format?: string
}

interface StoreSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (store: ICAStore) => void
  currentStoreId?: string
}

export function StoreSelector({
  isOpen,
  onClose,
  onSelect,
  currentStoreId,
}: StoreSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [stores, setStores] = useState<ICAStore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search stores when query changes
  useEffect(() => {
    const searchStores = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        if (searchQuery) params.append('query', searchQuery)

        const res = await fetch(`/api/ica/stores?${params}`)
        if (!res.ok) throw new Error('Failed to fetch stores')

        const data = await res.json()
        setStores(data.stores || [])
      } catch (err) {
        console.error('Error fetching stores:', err)
        setError('Kunde inte hämta butiker')
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchStores, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Load stores on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
    }
  }, [isOpen])

  const handleSelectStore = async (store: ICAStore) => {
    try {
      // Save preference
      await fetch('/api/user/store-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.storeId || store.id,
          storeName: store.name,
        }),
      })

      onSelect(store)
      onClose()
    } catch (err) {
      console.error('Error saving store preference:', err)
    }
  }

  const getFormatColor = (format?: string) => {
    switch (format?.toLowerCase()) {
      case 'maxi':
        return 'bg-red-100 text-red-700'
      case 'kvantum':
        return 'bg-blue-100 text-blue-700'
      case 'supermarket':
        return 'bg-green-100 text-green-700'
      case 'nära':
        return 'bg-amber-100 text-amber-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-red-600" />
            Välj din ICA-butik
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Sök stad eller butiksnamn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-zinc-500">{error}</div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              {searchQuery
                ? 'Inga butiker matchar sökningen'
                : 'Skriv för att söka butiker'}
            </div>
          ) : (
            stores.map((store) => {
              const isSelected =
                currentStoreId === store.storeId || currentStoreId === store.id

              return (
                <button
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    isSelected
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                      : 'border-zinc-200 hover:border-red-300 hover:bg-red-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Store icon */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                        isSelected ? 'bg-red-600' : 'bg-red-100'
                      )}
                    >
                      <Store
                        className={cn(
                          'h-5 w-5',
                          isSelected ? 'text-white' : 'text-red-600'
                        )}
                      />
                    </div>

                    {/* Store info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'font-semibold',
                            isSelected ? 'text-red-700' : 'text-zinc-900'
                          )}
                        >
                          {store.name}
                        </span>
                        {store.format && (
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              getFormatColor(store.format)
                            )}
                          >
                            {store.format}
                          </span>
                        )}
                      </div>
                      {(store.address || store.city) && (
                        <div className="flex items-center gap-1 text-sm text-zinc-500 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>
                            {[store.address, store.city]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="text-xs text-zinc-500 text-center pt-2 border-t">
          Priser och sortiment varierar mellan butiker
        </div>
      </DialogContent>
    </Dialog>
  )
}
