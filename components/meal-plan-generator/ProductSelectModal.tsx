'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Apple, Database, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MacroCategory, MealType, CalculatedMacros } from '@/lib/types/meal-plan-generator';
import { MACRO_CATEGORY_LABELS } from '@/lib/types/meal-plan-generator';

// Mappning från MacroCategory till databas-kategori
const MACRO_TO_DB_CATEGORY: Record<MacroCategory, string> = {
  protein: 'Proteinkällor',
  carb: 'Kolhydratskällor',
  fat: 'Fettkällor',
  vegetable: 'Grönsaker',
  sauce: 'Såser',
};

interface Subcategory {
  key: string;
  label: string;
  count: number;
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
  subCategory?: string | null;
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

// Default grams per category when no target macro is set (100g standard for all except sauce)
const DEFAULT_GRAMS_BY_CATEGORY: Record<MacroCategory, number> = {
  protein: 100,
  carb: 100,
  fat: 100,
  vegetable: 100,
  sauce: 30,
};

// Calculate grams - use defaults for protein/carb/fat/vegetable, target-based for sauce
function calculateGramsForTarget(product: Product, targetMacro: number, category: MacroCategory): number {
  // For sauce, always calculate based on target (keep original behavior)
  if (category === 'sauce') {
    const macroKey = getMacroKey(category);
    const per100g = product[macroKey] || 0;
    if (per100g <= 0 || targetMacro <= 0) return 0;
    return Math.round((targetMacro / per100g) * 100);
  }

  // For protein, carb, fat, vegetable: always use default grams
  // User controls portion size manually, not based on meal target macros
  return DEFAULT_GRAMS_BY_CATEGORY[category] || 100;
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

// Helper to check if a food name is a berry
function isBerry(name: string): boolean {
  const nameLower = name.toLowerCase();
  return nameLower.includes('bär') || nameLower.includes('hallon') ||
         nameLower.includes('blåbär') || nameLower.includes('jordgubb') ||
         nameLower.includes('björnbär') || nameLower.includes('lingon') ||
         nameLower.includes('krusbär') || nameLower.includes('vinbär');
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
  const [selectedProducts, setSelectedProducts] = useState<ProductWithCalculation[]>([]);

  // Dynamiska subkategorier från databasen
  const [subcategories, setSubcategories] = useState<Subcategory[]>([{ key: 'all', label: 'Alla', count: 0 }]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  // Reset subkategori när kategori eller defaultSubcategory ändras
  useEffect(() => {
    setActiveSubcategory(defaultSubcategory || 'all');
  }, [category, defaultSubcategory]);

  // Hämta dynamiska subkategorier från databasen
  useEffect(() => {
    if (!isOpen || !category) return;

    const fetchSubcategories = async () => {
      setSubcategoriesLoading(true);
      try {
        const dbCategory = MACRO_TO_DB_CATEGORY[category];
        const res = await fetch(`/api/products/subcategories?category=${encodeURIComponent(dbCategory)}`);

        if (res.ok) {
          const data = await res.json();

          // Formatera till array med "Alla" först
          const subs: Subcategory[] = [
            { key: 'all', label: 'Alla', count: data.total || 0 },
            ...Object.entries(data.subcategories || {})
              .map(([key, count]) => ({
                key,
                label: key,
                count: count as number,
              }))
              .sort((a, b) => b.count - a.count) // Sortera efter antal (flest först)
          ];
          setSubcategories(subs);
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      } finally {
        setSubcategoriesLoading(false);
      }
    };

    fetchSubcategories();
  }, [isOpen, category]);

  // Fetch products for the category
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch products, food items, and SLV foods in parallel (no limits)
        const [productsRes, foodItemsRes, slvRes] = await Promise.all([
          fetch(`/api/products?macroCategory=${category}&limit=1000`),
          fetch(`/api/food-items?macroCategory=${category}&limit=1000`),
          fetch('/data/slv-foods.json'),
        ]);

        // Combine products from both sources
        const allProducts: Product[] = [];

        if (productsRes.ok) {
          const data = await productsRes.json();
          allProducts.push(...(data.products || []));
        }

        // Add food items (converted to Product format)
        if (foodItemsRes.ok) {
          const foodData = await foodItemsRes.json();
          const foodItemsAsProducts = (foodData.items || []).map((item: any) => ({
            id: `fooditem-${item.id}`,
            name: item.name,
            brand: item.foodCategory?.name || null,
            image: item.imageUrl || null,
            kcal: item.calories || 0,
            protein: item.proteinG || 0,
            carbs: item.carbsG || 0,
            fat: item.fatG || 0,
            macroCategory: item.macroCategory,
            mealTypes: item.mealTypes,
            source: 'product' as const,
          }));
          allProducts.push(...foodItemsAsProducts);
        }

        setProducts(allProducts);

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
      brand: 'SLV',
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
        // Subkategori-filter - matcha på produktens subCategory-fält
        if (activeSubcategory === 'all') return true;
        // Special case for berries - match by name since products may not have subCategory set
        if (activeSubcategory.toLowerCase() === 'bär') {
          return isBerry(p.name);
        }
        // Matcha subCategory (case-insensitive)
        return p.subCategory?.toLowerCase() === activeSubcategory.toLowerCase();
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [sourceItems, targetMacro, category, mealType, searchQuery, isVegetable, activeTab, activeSubcategory, subcategories]);

  // Toggle product selection
  const handleToggleSelect = (product: ProductWithCalculation) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // Check if a product is selected
  const isProductSelected = (productId: string) => {
    return selectedProducts.some(p => p.id === productId);
  };

  // Confirm selection and add all selected products sequentially
  const handleConfirmSelection = async () => {
    // Add each selected product sequentially to avoid race conditions
    for (const product of selectedProducts) {
      onSelect(product, product.calculatedGrams, product.calculatedMacros, addAsAlternative);
      // Small delay to ensure API calls don't overlap
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setSelectedProducts([]);
    setAddAsAlternative(false);
    onClose();
  };

  // Reset selection when modal closes
  const handleClose = () => {
    setSelectedProducts([]);
    setAddAsAlternative(false);
    onClose();
  };

  const macroLabel = getMacroKey(category);
  const categoryTitle = MACRO_CATEGORY_LABELS[category] || category;

  // Get display title based on defaultSubcategory or category
  const getDialogTitle = () => {
    if (defaultSubcategory && defaultSubcategory !== 'all') {
      // Use defaultSubcategory directly for title - don't wait for API
      return `Välj ${defaultSubcategory.toLowerCase()}`;
    }
    return `Välj ${categoryTitle.toLowerCase()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Source tabs */}
        <div className="flex border-b border-[rgba(255,215,0,0.2)]">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'products'
                ? 'border-b-2 border-[#FFD700] text-[#FFD700]'
                : 'text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.8)]'
            )}
          >
            <Apple className="h-4 w-4" />
            Livsmedel
            {products.length > 0 && (
              <span className="text-xs bg-[rgba(255,215,0,0.2)] text-[#FFD700] px-1.5 py-0.5 rounded-full">
                {products.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('slv')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'slv'
                ? 'border-b-2 border-green-500 text-green-400'
                : 'text-[rgba(255,255,255,0.5)] hover:text-[rgba(255,255,255,0.8)]'
            )}
          >
            <Database className="h-4 w-4" />
            SLV-databas
            {slvAsProducts.length > 0 && (
              <span className="text-xs bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded-full">
                {slvAsProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
          <Input
            placeholder={activeTab === 'slv' ? 'Sök i SLV-databasen...' : 'Sök livsmedel...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.4)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[rgba(255,255,255,0.1)] rounded"
            >
              <X className="h-4 w-4 text-[rgba(255,255,255,0.4)]" />
            </button>
          )}
        </div>

        {/* Subkategori-chips - always show for filtering */}
        {subcategories.length > 1 && (
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
                      : 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] border-[#FFD700]'
                    : 'bg-[rgba(0,0,0,0.3)] text-[rgba(255,255,255,0.7)] border-[rgba(255,215,0,0.3)] hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.5)]'
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Add as alternative checkbox */}
        {showAlternativeOption && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)] cursor-pointer hover:bg-[rgba(255,215,0,0.15)] transition-colors">
            <input
              type="checkbox"
              checked={addAsAlternative}
              onChange={(e) => setAddAsAlternative(e.target.checked)}
              className="w-4 h-4 rounded border-[rgba(255,215,0,0.5)] text-[#FFD700] focus:ring-[#FFD700] bg-[rgba(0,0,0,0.3)]"
            />
            <span className="text-sm text-[#FFD700] font-medium">
              Lägg till som alternativ (visar ELLER)
            </span>
          </label>
        )}

        {/* Target info - only show for vegetables */}
        {isVegetable && (
          <div className="text-sm text-green-400 bg-green-900/30 px-3 py-2 rounded-lg border border-green-800/50">
            Grönsaker räknas inte i makros - ät fritt!
          </div>
        )}

        {/* Products list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-[rgba(255,255,255,0.5)]">Laddar...</div>
          ) : productsWithCalculations.length === 0 ? (
            <div className="py-8 text-center text-[rgba(255,255,255,0.5)]">
              {searchQuery ? 'Inga livsmedel matchar sökningen' : 'Inga livsmedel i denna kategori'}
            </div>
          ) : (
            productsWithCalculations.map((product) => {
              const isSelected = isProductSelected(product.id);
              return (
              <button
                key={product.id}
                onClick={() => handleToggleSelect(product)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors group",
                  isSelected
                    ? 'border-[#FFD700] bg-[rgba(255,215,0,0.1)] ring-2 ring-[rgba(255,215,0,0.3)]'
                    : activeTab === 'slv'
                      ? 'border-[rgba(74,222,128,0.3)] bg-[rgba(0,0,0,0.3)] hover:border-green-500 hover:bg-[rgba(74,222,128,0.1)]'
                      : 'border-[rgba(255,215,0,0.2)] bg-[rgba(0,0,0,0.3)] hover:border-[rgba(255,215,0,0.4)] hover:bg-[rgba(255,215,0,0.05)]'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Selection checkbox */}
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-1 transition-colors",
                    isSelected
                      ? 'bg-[#FFD700] border-[#FFD700]'
                      : 'border-[rgba(255,255,255,0.3)] group-hover:border-[#FFD700]'
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-[#0a0a0a]" />}
                  </div>

                  {/* Product image or icon */}
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover bg-[rgba(255,255,255,0.1)]"
                    />
                  ) : (
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      activeTab === 'slv' ? 'bg-green-900/30' : 'bg-[rgba(255,255,255,0.1)]'
                    )}>
                      {activeTab === 'slv' ? (
                        <Database className="h-5 w-5 text-green-400" />
                      ) : (
                        <span className="text-[rgba(255,255,255,0.4)] text-xs">Bild</span>
                      )}
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium truncate",
                      isSelected
                        ? 'text-[#FFD700]'
                        : activeTab === 'slv'
                          ? 'text-white group-hover:text-green-400'
                          : 'text-white group-hover:text-[#FFD700]'
                    )}>
                      {product.name}
                    </div>
                    {product.brand && (
                      <div className="text-xs text-[rgba(255,255,255,0.5)] truncate">{product.brand}</div>
                    )}
                    {!isVegetable && (
                      <div className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                        {product[getMacroKey(category)]}g {macroLabel}/100g
                      </div>
                    )}
                  </div>

                  {/* Calculated amount */}
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "text-lg font-semibold",
                      isVegetable ? 'text-green-400' : activeTab === 'slv' ? 'text-green-400' : 'text-[#FFD700]'
                    )}>
                      {product.calculatedGrams}g
                    </div>
                    <div className="text-xs text-[rgba(255,255,255,0.5)]">
                      {product.calculatedMacros.kcal} kcal
                    </div>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="mt-2 flex gap-3 text-xs text-[rgba(255,255,255,0.5)] ml-8">
                  <span>P: {product.calculatedMacros.protein}g</span>
                  <span>K: {product.calculatedMacros.carbs}g</span>
                  <span>F: {product.calculatedMacros.fat}g</span>
                </div>
              </button>
              );
            })
          )}
        </div>

        {/* Footer with confirm button */}
        {selectedProducts.length > 0 && (
          <div className="border-t border-[rgba(255,215,0,0.2)] pt-4 mt-4 space-y-3">
            <div className="text-sm text-[rgba(255,255,255,0.6)]">
              {selectedProducts.length} produkt{selectedProducts.length > 1 ? 'er' : ''} vald{selectedProducts.length > 1 ? 'a' : ''}
            </div>
            <Button
              onClick={handleConfirmSelection}
              className="w-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-[1.02] transition-transform"
            >
              Lägg till {selectedProducts.length > 1 ? 'alla' : ''}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
