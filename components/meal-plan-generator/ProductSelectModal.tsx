'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Apple, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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
  source?: 'product' | 'slv';
}

interface ProductWithCalculation extends Product {
  calculatedGrams: number;
  calculatedMacros: CalculatedMacros;
}

interface SlvFood {
  nummer: number;
  namn: string;
  typ: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number | null;
}

interface ProductSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: MacroCategory;
  targetMacro: number;
  mealType: MealType;
  onSelect: (product: Product, grams: number, macros: CalculatedMacros) => void;
}

type SourceTab = 'products' | 'slv';

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

// Filter SLV foods by category
function filterSlvByCategory(foods: SlvFood[], category: MacroCategory): SlvFood[] {
  switch (category) {
    case 'protein':
      return foods.filter(f => f.protein > 10);
    case 'carb':
      return foods.filter(f => f.carbs > 15 && f.protein < 10);
    case 'fat':
      return foods.filter(f => f.fat > 10 && f.carbs < 10);
    case 'vegetable':
      return foods.filter(f =>
        f.kcal < 50 && (f.fiber ?? 0) > 1 ||
        f.typ?.toLowerCase().includes('grönsak')
      );
    default:
      return foods;
  }
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
  const [slvFoods, setSlvFoods] = useState<SlvFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceTab>('products');

  // Fetch products for the category
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both products and SLV foods in parallel
        const [productsRes, slvRes] = await Promise.all([
          fetch(`/api/products?macroCategory=${category}`),
          fetch('/data/slv-foods.json'),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
        }

        if (slvRes.ok) {
          const slvData = await slvRes.json();
          // Flatten all categories into one array
          const allFoods: SlvFood[] = [];
          for (const categoryFoods of Object.values(slvData.categories || {})) {
            allFoods.push(...(categoryFoods as SlvFood[]));
          }
          setSlvFoods(allFoods);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, category]);

  // Check if this is vegetable category (free, no macro calculation)
  const isVegetable = category === 'vegetable';
  const defaultVegetableGrams = 100;

  // Convert SLV foods to Product format
  const slvAsProducts: Product[] = useMemo(() => {
    return filterSlvByCategory(slvFoods, category).map(f => ({
      id: `slv-${f.nummer}`,
      name: f.namn,
      brand: 'Livsmedelsverket',
      image: null,
      kcal: f.kcal,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      source: 'slv' as const,
    }));
  }, [slvFoods, category]);

  // Get active source items
  const sourceItems = activeTab === 'products' ? products : slvAsProducts;

  // Calculate products with grams and filter
  const productsWithCalculations: ProductWithCalculation[] = useMemo(() => {
    return sourceItems
      .map((product) => {
        // For vegetables, use default grams instead of calculating
        const calculatedGrams = isVegetable
          ? defaultVegetableGrams
          : calculateGramsForTarget(product, targetMacro, category);
        const calculatedMacros = calculateMacrosForGrams(product, calculatedGrams);
        return {
          ...product,
          calculatedGrams,
          calculatedMacros,
        };
      })
      .filter((p) => {
        // For vegetables, don't filter out based on grams
        if (!isVegetable && p.calculatedGrams <= 0) return false;

        // Filter by mealType if product has mealTypes set (only for coach products)
        if (activeTab === 'products' && p.mealTypes && p.mealTypes.length > 0) {
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
  }, [sourceItems, targetMacro, category, mealType, searchQuery, isVegetable, activeTab]);

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

        {/* Source tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'products'
                ? 'border-b-2 border-amber-500 text-amber-700'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            <Apple className="h-4 w-4" />
            Mina produkter
          </button>
          <button
            onClick={() => setActiveTab('slv')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'slv'
                ? 'border-b-2 border-green-500 text-green-700'
                : 'text-zinc-500 hover:text-zinc-700'
            )}
          >
            <Database className="h-4 w-4" />
            Livsmedelsverket
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder={activeTab === 'slv' ? 'Sök i Livsmedelsverkets databas...' : 'Sök livsmedel...'}
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
        {isVegetable ? (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Grönsaker räknas inte i makros - ät fritt!
          </div>
        ) : (
          <div className={cn(
            "text-sm px-3 py-2 rounded-lg",
            activeTab === 'slv' ? 'text-green-700 bg-green-50' : 'text-zinc-500 bg-zinc-50'
          )}>
            Mål: <span className={cn("font-medium", activeTab === 'slv' ? 'text-green-800' : 'text-zinc-700')}>
              {targetMacro}g {macroLabel}
            </span>
            {activeTab === 'slv' && (
              <span className="ml-2 text-xs">(Livsmedelsverkets officiella data)</span>
            )}
          </div>
        )}

        {/* Products list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-zinc-500">Laddar...</div>
          ) : productsWithCalculations.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              {searchQuery ? 'Inga livsmedel matchar sökningen' : 'Inga livsmedel i denna kategori'}
            </div>
          ) : (
            productsWithCalculations.map((product) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors group",
                  activeTab === 'slv'
                    ? 'border-green-200 hover:border-green-400 hover:bg-green-50/50'
                    : 'border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Product image or icon */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-zinc-100"
                    />
                  ) : (
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      activeTab === 'slv' ? 'bg-green-100' : 'bg-zinc-100'
                    )}>
                      {activeTab === 'slv' ? (
                        <Database className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-zinc-400 text-xs">Bild</span>
                      )}
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium truncate",
                      activeTab === 'slv'
                        ? 'text-zinc-900 group-hover:text-green-700'
                        : 'text-zinc-900 group-hover:text-amber-700'
                    )}>
                      {product.name}
                    </div>
                    {product.brand && (
                      <div className="text-xs text-zinc-500 truncate">{product.brand}</div>
                    )}
                    {!isVegetable && (
                      <div className="text-xs text-zinc-400 mt-1">
                        {product[getMacroKey(category)]}g {macroLabel}/100g
                      </div>
                    )}
                  </div>

                  {/* Calculated amount */}
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "text-lg font-semibold",
                      isVegetable ? 'text-green-600' : activeTab === 'slv' ? 'text-green-600' : 'text-amber-600'
                    )}>
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
