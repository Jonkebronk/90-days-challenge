'use client'

import { useState } from 'react'
import { Heart, Plus, Tag, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ICAProduct {
  id: string
  name: string
  price: number
  comparePrice?: string
  imageUrl?: string
  categoryPath?: string
  offer?: {
    type: string
    price: number
  }
  ean?: string
}

interface ICAProductCardProps {
  product: ICAProduct
  onAdd: (product: ICAProduct) => void
  onToggleFavorite?: (product: ICAProduct) => void
  isFavorite?: boolean
  isAdded?: boolean
  compact?: boolean
}

export function ICAProductCard({
  product,
  onAdd,
  onToggleFavorite,
  isFavorite = false,
  isAdded = false,
  compact = false,
}: ICAProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const hasOffer = product.offer && product.offer.price < product.price

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg border transition-all',
          isAdded
            ? 'border-green-500 bg-green-50'
            : 'border-zinc-200 hover:border-red-300 hover:bg-red-50/30'
        )}
      >
        {/* Image */}
        <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
              ICA
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-zinc-900 truncate">
            {product.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold">
              {hasOffer ? product.offer!.price : product.price} kr
            </span>
            {product.comparePrice && (
              <span className="text-xs text-zinc-500">
                {product.comparePrice}
              </span>
            )}
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={() => onAdd(product)}
          disabled={isAdded}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0',
            isAdded
              ? 'bg-green-500 text-white'
              : 'bg-red-600 text-white hover:bg-red-700'
          )}
        >
          {isAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative bg-white rounded-xl border overflow-hidden transition-all',
        isAdded
          ? 'border-green-500 ring-2 ring-green-500/20'
          : 'border-zinc-200 hover:border-red-300 hover:shadow-md'
      )}
    >
      {/* Offer badge */}
      {hasOffer && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
          <Tag className="h-3 w-3" />
          Erbjudande
        </div>
      )}

      {/* Favorite button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(product)
          }}
          className={cn(
            'absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            isFavorite
              ? 'bg-red-100 text-red-600'
              : 'bg-white/80 text-zinc-400 hover:text-red-500'
          )}
        >
          <Heart
            className={cn('h-5 w-5', isFavorite && 'fill-current')}
          />
        </button>
      )}

      {/* Product image */}
      <div className="aspect-square bg-zinc-100 relative">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-zinc-300">ICA</span>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        <h3 className="font-medium text-zinc-900 text-sm line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          {hasOffer ? (
            <>
              <span className="text-xl font-bold text-red-600">
                {product.offer!.price.toFixed(2)} kr
              </span>
              <span className="text-sm text-zinc-400 line-through">
                {product.price.toFixed(2)} kr
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-zinc-900">
              {product.price.toFixed(2)} kr
            </span>
          )}
        </div>

        {/* Compare price */}
        {product.comparePrice && (
          <p className="text-xs text-zinc-500 mt-1">{product.comparePrice}</p>
        )}

        {/* Add button */}
        <button
          onClick={() => onAdd(product)}
          disabled={isAdded}
          className={cn(
            'mt-3 w-full py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2',
            isAdded
              ? 'bg-green-500 text-white'
              : 'bg-red-600 text-white hover:bg-red-700'
          )}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4" />
              Tillagd
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Lägg till
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Export types
export type { ICAProduct }
