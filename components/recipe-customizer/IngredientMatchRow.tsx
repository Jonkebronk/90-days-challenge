'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Utensils, Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IngredientMatchRowProps } from './types';

export function IngredientMatchRow({
  ingredient,
  onLinkClick,
  onUnlink,
  onUpdateGrams,
  onToggleInclude,
}: IngredientMatchRowProps) {
  const { originalIngredient, linkedProduct, isLinked, isIncluded } = ingredient;
  const [localGrams, setLocalGrams] = useState(
    linkedProduct?.grams.toString() || Math.round(originalIngredient.amount).toString()
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local grams when linkedProduct changes
  useEffect(() => {
    if (linkedProduct) {
      setLocalGrams(linkedProduct.grams.toString());
    }
  }, [linkedProduct?.grams]);

  const handleGramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalGrams(e.target.value);
  };

  const handleGramsBlur = () => {
    const grams = parseInt(localGrams) || 0;
    if (grams > 0 && grams !== linkedProduct?.grams) {
      onUpdateGrams(grams);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGramsBlur();
      inputRef.current?.blur();
    }
  };

  // Calculate macros display
  const macros = linkedProduct?.macros;

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-3 transition-all',
        !isIncluded && 'opacity-50',
        isLinked
          ? 'border-emerald-300 bg-emerald-50/50'
          : 'border-dashed border-zinc-300 bg-zinc-50/50'
      )}
    >
      {/* Checkbox + Original ingredient reference */}
      <div className="flex items-start gap-3 mb-2">
        {/* Include checkbox */}
        <input
          type="checkbox"
          checked={isIncluded}
          onChange={onToggleInclude}
          className="mt-1 w-5 h-5 rounded border-zinc-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 uppercase font-medium">Original:</span>
            <span className="text-sm text-zinc-600">
              {originalIngredient.foodItem.name}
              {originalIngredient.displayAmount && originalIngredient.displayUnit && (
                <span className="text-zinc-400 ml-1">
                  ({originalIngredient.displayAmount} {originalIngredient.displayUnit})
                </span>
              )}
              <span className="text-zinc-400 ml-1">
                ({Math.round(originalIngredient.amount)}g)
              </span>
            </span>
            {originalIngredient.optional && (
              <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded">
                Valfri
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Linked product or search button */}
      {isLinked && linkedProduct ? (
        <div className="space-y-2">
          {/* Product info row */}
          <div className="flex items-center gap-2">
            {/* Product image */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-zinc-200 shrink-0">
              {linkedProduct.image ? (
                <img
                  src={linkedProduct.image}
                  alt={linkedProduct.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <Utensils className="w-5 h-5" />
                </div>
              )}
            </div>

            {/* Product name */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <Link2 className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="text-sm font-medium text-zinc-800 truncate">
                  {linkedProduct.productName}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 uppercase">
                {linkedProduct.source === 'slv' ? 'Livsmedelsverket' : 'Min produkt'}
              </span>
            </div>

            {/* Unlink button */}
            <button
              onClick={onUnlink}
              className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors"
              title="Ta bort länk"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>

          {/* Grams and macros row */}
          <div className="flex items-center gap-3 pl-12">
            {/* Grams input */}
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                value={localGrams}
                onChange={handleGramsChange}
                onBlur={handleGramsBlur}
                onKeyDown={handleKeyDown}
                className="w-16 text-center text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                min="1"
              />
              <span className="text-xs text-zinc-500">g</span>
            </div>

            {/* Macros display */}
            {macros && (
              <div className="flex items-center gap-2 text-xs">
                <div className="text-center">
                  <div className="text-[8px] text-zinc-400 uppercase">Kcal</div>
                  <div className="font-bold text-amber-600">{Math.round(macros.kcal)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-zinc-400 uppercase">P</div>
                  <div className="font-bold text-rose-600">{Math.round(macros.protein)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-zinc-400 uppercase">K</div>
                  <div className="font-bold text-amber-500">{Math.round(macros.carbs)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-zinc-400 uppercase">F</div>
                  <div className="font-bold text-sky-500">{Math.round(macros.fat)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Search button when not linked */
        <button
          onClick={onLinkClick}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-dashed border-zinc-300 text-zinc-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/50 transition-all"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm font-medium">Sök och länka produkt...</span>
        </button>
      )}
    </div>
  );
}
