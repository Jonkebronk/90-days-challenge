'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Apple, Database } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MacroCategory, MealType, CalculatedMacros } from '@/lib/types/meal-plan-generator';
import { MACRO_CATEGORY_LABELS } from '@/lib/types/meal-plan-generator';

// Subkategorier för varje makrokategori
const SUBCATEGORIES: Record<MacroCategory, { key: string; label: string; keywords: string[] }[]> = {
  protein: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'chicken', label: 'Kyckling', keywords: ['kyckling', 'höns'] },
    { key: 'beef', label: 'Nöt', keywords: ['nöt', 'biff', 'oxfilé', 'lövbiff', 'rostbiff', 'entrecote', 'färs'] },
    { key: 'pork', label: 'Fläsk', keywords: ['fläsk', 'kassler', 'bacon', 'skinka'] },
    { key: 'fish', label: 'Fisk', keywords: ['lax', 'torsk', 'sej', 'pollock', 'tonfisk', 'fisk', 'pangasius', 'makrill', 'sill'] },
    { key: 'seafood', label: 'Skaldjur', keywords: ['räk', 'krabba', 'musslor', 'bläckfisk'] },
    { key: 'egg', label: 'Ägg', keywords: ['ägg', 'äggvita'] },
    { key: 'dairy', label: 'Mejeri', keywords: ['kvarg', 'cottage', 'yoghurt', 'skyr', 'ost', 'fil'] },
    { key: 'game', label: 'Vilt', keywords: ['älg', 'vildsvin', 'rådjur', 'hjort', 'ren'] },
    { key: 'turkey', label: 'Kalkon', keywords: ['kalkon'] },
  ],
  carb: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'rice', label: 'Ris', keywords: ['ris', 'jasmin', 'basmati'] },
    { key: 'pasta', label: 'Pasta', keywords: ['pasta', 'spagetti', 'penne', 'fusilli', 'makaroner'] },
    { key: 'potato', label: 'Potatis', keywords: ['potatis', 'sötpotatis', 'potatismos'] },
    { key: 'bread', label: 'Bröd', keywords: ['bröd', 'knäcke', 'fralla', 'bagel'] },
    { key: 'oats', label: 'Havre', keywords: ['havre', 'gryn', 'havrefras', 'müsli'] },
    { key: 'fruit', label: 'Frukt', keywords: ['banan', 'äpple', 'apelsin', 'ananas', 'mango', 'frukt', 'päron', 'kiwi', 'vindruvor'] },
    { key: 'berry', label: 'Bär', keywords: ['bär', 'blåbär', 'hallon', 'jordgubb', 'björnbär', 'lingon', 'krusbär', 'vinbär', 'smultron'] },
    { key: 'beans', label: 'Baljväxter', keywords: ['bönor', 'linser', 'kikärter', 'ärtor'] },
    { key: 'couscous', label: 'Bulgur/Couscous', keywords: ['bulgur', 'couscous', 'quinoa'] },
  ],
  fat: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'nuts', label: 'Nötter', keywords: ['mandel', 'cashew', 'valnöt', 'hasselnöt', 'pistasch', 'jordnöt', 'nötter'] },
    { key: 'seeds', label: 'Frön', keywords: ['chia', 'lin', 'sesam', 'pumpa', 'solros', 'frö'] },
    { key: 'oil', label: 'Oljor', keywords: ['olja', 'olivolja', 'kokosolja', 'rapsolja'] },
    { key: 'avocado', label: 'Avokado', keywords: ['avokado'] },
    { key: 'butter', label: 'Smör/Ost', keywords: ['smör', 'ost', 'cream cheese', 'grädde'] },
    { key: 'nutbutter', label: 'Nötsmör', keywords: ['jordnötssmör', 'mandelsmör', 'peanut butter', 'nötsmör'] },
  ],
  vegetable: [
    { key: 'all', label: 'Alla', keywords: [] },
    { key: 'leafy', label: 'Bladgrönsaker', keywords: ['sallad', 'spenat', 'grönkål', 'ruccola'] },
    { key: 'root', label: 'Rotfrukter', keywords: ['morot', 'rödbetor', 'palsternacka', 'selleri'] },
    { key: 'cruciferous', label: 'Kål', keywords: ['broccoli', 'blomkål', 'vitkål', 'brysselkål'] },
    { key: 'other', label: 'Övrigt', keywords: ['tomat', 'gurka', 'paprika', 'zucchini', 'lök'] },
  ],
  sauce: [
    { key: 'all', label: 'Alla', keywords: [] },
  ],
};

// Funktion för att matcha produkt mot subkategori
function matchesSubcategory(productName: string, subcategory: { key: string; keywords: string[] }): boolean {
  if (subcategory.key === 'all') return true;
  const nameLower = productName.toLowerCase();
  return subcategory.keywords.some(keyword => nameLower.includes(keyword));
}

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
  onSelect: (product: Product, grams: number, macros: CalculatedMacros, isAlternative?: boolean) => void;
  showAlternativeOption?: boolean; // Show "Lägg till som alternativ" checkbox
  defaultSubcategory?: string; // Pre-select a subcategory filter (e.g., 'berry' for berries)
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

// Default grams per category when no target macro is set
const DEFAULT_GRAMS_BY_CATEGORY: Record<MacroCategory, number> = {
  protein: 150,
  carb: 100,
  fat: 30,
  vegetable: 200,
  sauce: 30,
};

// Calculate grams needed to hit target macro, or use default if no target
function calculateGramsForTarget(product: Product, targetMacro: number, category: MacroCategory): number {
  // For sauce, always calculate based on target (keep original behavior)
  if (category === 'sauce') {
    const macroKey = getMacroKey(category);
    const per100g = product[macroKey] || 0;
    if (per100g <= 0 || targetMacro <= 0) return 0;
    return Math.round((targetMacro / per100g) * 100);
  }

  // For other categories: if no target macro, use sensible default
  if (!targetMacro || targetMacro <= 0) {
    return DEFAULT_GRAMS_BY_CATEGORY[category] || 100;
  }

  const macroKey = getMacroKey(category);
  const per100g = product[macroKey] || 0;

  // If product has no macro value for this category, use default grams
  if (per100g <= 0) {
    return DEFAULT_GRAMS_BY_CATEGORY[category] || 100;
  }

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
  showAlternativeOption = true,
  defaultSubcategory,
}: ProductSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [slvFoods, setSlvFoods] = useState<SlvFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceTab>('products');
  const [activeSubcategory, setActiveSubcategory] = useState(defaultSubcategory || 'all');
  const [addAsAlternative, setAddAsAlternative] = useState(false);

  // Hämta subkategorier för aktuell makrokategori
  const subcategories = SUBCATEGORIES[category] || [{ key: 'all', label: 'Alla', keywords: [] }];

  // Reset subkategori när kategori eller defaultSubcategory ändras
  useEffect(() => {
    setActiveSubcategory(defaultSubcategory || 'all');
  }, [category, defaultSubcategory]);

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
        // For sauce, filter out products with 0 grams (target-based filtering)
        if (category === 'sauce' && p.calculatedGrams <= 0) return false;

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
      .filter((p) => {
        // Subkategori-filter
        const selectedSubcategory = subcategories.find(s => s.key === activeSubcategory);
        if (!selectedSubcategory) return true;
        return matchesSubcategory(p.name, selectedSubcategory);
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [sourceItems, targetMacro, category, mealType, searchQuery, isVegetable, activeTab, activeSubcategory, subcategories]);

  const handleSelect = (product: ProductWithCalculation) => {
    onSelect(product, product.calculatedGrams, product.calculatedMacros, addAsAlternative);
    setAddAsAlternative(false); // Reset for next selection
    onClose();
  };

  const macroLabel = getMacroKey(category);
  const categoryTitle = MACRO_CATEGORY_LABELS[category] || category;

  // Get display title based on defaultSubcategory or category
  const getDialogTitle = () => {
    if (defaultSubcategory && defaultSubcategory !== 'all') {
      const sub = subcategories.find(s => s.key === defaultSubcategory);
      if (sub) return `Välj ${sub.label.toLowerCase()}`;
    }
    return `Välj ${categoryTitle.toLowerCase()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
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

        {/* Subkategori-chips - hide when a specific subcategory is pre-selected */}
        {subcategories.length > 1 && !defaultSubcategory && (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {subcategories.map((sub) => (
              <button
                key={sub.key}
                onClick={() => setActiveSubcategory(sub.key)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                  activeSubcategory === sub.key
                    ? activeTab === 'slv'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 hover:border-zinc-400'
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Add as alternative checkbox */}
        {showAlternativeOption && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
            <input
              type="checkbox"
              checked={addAsAlternative}
              onChange={(e) => setAddAsAlternative(e.target.checked)}
              className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm text-amber-800 font-medium">
              Lägg till som alternativ (visar ELLER)
            </span>
          </label>
        )}

        {/* Target info - only show for vegetables */}
        {isVegetable && (
          <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            Grönsaker räknas inte i makros - ät fritt!
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
