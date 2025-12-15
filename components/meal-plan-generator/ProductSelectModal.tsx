'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { MacroCategory, MealType, CalculatedMacros } from '@/lib/types/meal-plan-generator';
import { MACRO_CATEGORY_LABELS } from '@/lib/types/meal-plan-generator';

interface Product {
  id: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  macroCategory?: string | null;
  mealTypes?: string[];
}

interface ProductWithCalculation extends Product {
  calculatedGrams: number;
  calculatedMacros: CalculatedMacros;
}

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: MacroCategory;
  targetMacro: number;
  mealType: MealType;
  onSelect: (product: Product, grams: number, macros: CalculatedMacros) => void;
}

// Get the macro field key for each category
function getMacroKey(category: MacroCategory): 'protein' | 'carbs' | 'fat' {
  switch (category) {
    case 'protein':
      return 'protein';
    case 'carb':
      return 'carbs';
    case 'fat':
      return 'fat';
    default:
      return 'protein';
  }
}

// Calculate grams needed to hit target macro
function calculateGramsForTarget(product: Product, targetMacro: number, category: MacroCategory): number {
  const macroKey = getMacroKey(category);
  const per100g = product[macroKey] || 0;

  if (per100g <= 0) return 0;

  // grams = (targetMacro / per100gValue) * 100
  return Math.round((targetMacro / per100g) * 100);
}

// Calculate all macros for a given amount of grams
function calculateMacrosForGrams(product: Product, grams: number): CalculatedMacros {
  const factor = grams / 100;
  return {
    protein: Math.round((product.protein || 0) * factor * 10) / 10,
    carbs: Math.round((product.carbs || 0) * factor * 10) / 10,
    fat: Math.round((product.fat || 0) * factor * 10) / 10,
    kcal: Math.round((product.kcal || 0) * factor),
  };
}

export function ProductSelectModal({
  isOpen,
  onClose,
  category,
  targetMacro,
  mealType,
  onSelect,
}: ProductSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch products for the category
  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?macroCategory=${category}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen, category]);

  // Calculate products with grams and filter
  const productsWithCalculations: ProductWithCalculation[] = useMemo(() => {
    return products
      .map((product) => {
        const calculatedGrams = calculateGramsForTarget(product, targetMacro, category);
        const calculatedMacros = calculateMacrosForGrams(product, calculatedGrams);
        return {
          ...product,
          calculatedGrams,
          calculatedMacros,
        };
      })
      .filter((p) => {
        // Filter out products with 0 grams (would mean division by zero or no macro content)
        if (p.calculatedGrams <= 0) return false;

        // Filter by mealType if product has mealTypes set
        if (p.mealTypes && p.mealTypes.length > 0) {
          return p.mealTypes.includes(mealType);
        }
        return true;
      })
      .filter((p) => {
        // Search filter
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(query) ||
          (p.brand && p.brand.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [products, targetMacro, category, mealType, searchQuery]);

  const handleSelect = (product: ProductWithCalculation) => {
    onSelect(product, product.calculatedGrams, product.calculatedMacros);
    onClose();
  };

  const macroLabel = getMacroKey(category);
  const categoryTitle = MACRO_CATEGORY_LABELS[category] || category;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Välj {categoryTitle.toLowerCase()}</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Sök livsmedel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Target info */}
        <div className="text-sm text-zinc-500 bg-zinc-50 px-3 py-2 rounded-lg">
          Mål: <span className="font-medium text-zinc-700">{targetMacro}g {macroLabel}</span>
        </div>

        {/* Products list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-zinc-500">Laddar produkter...</div>
          ) : productsWithCalculations.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              {searchQuery ? 'Inga produkter matchar sökningen' : 'Inga produkter i denna kategori'}
            </div>
          ) : (
            productsWithCalculations.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className="w-full text-left p-3 rounded-lg border border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  {/* Product image */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-zinc-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <span className="text-zinc-400 text-xs">Bild</span>
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 truncate group-hover:text-amber-700">
                      {product.name}
                    </div>
                    {product.brand && (
                      <div className="text-xs text-zinc-500 truncate">{product.brand}</div>
                    )}
                    <div className="text-xs text-zinc-400 mt-1">
                      {product[getMacroKey(category)]}g {macroLabel}/100g
                    </div>
                  </div>

                  {/* Calculated amount */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-semibold text-amber-600">
                      {product.calculatedGrams}g
                    </div>
                    <div className="text-xs text-zinc-500">
                      {product.calculatedMacros.kcal} kcal
                    </div>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="mt-2 flex gap-3 text-xs text-zinc-500">
                  <span>P: {product.calculatedMacros.protein}g</span>
                  <span>K: {product.calculatedMacros.carbs}g</span>
                  <span>F: {product.calculatedMacros.fat}g</span>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
