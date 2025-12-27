'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Apple, Database, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  onSelect: (product: Product, grams: number, macros: CalculatedMacros, isAlternative?: boolean, targetCategory?: MacroCategory) => void;
  showAlternativeOption?: boolean; // Show "Lägg till som alternativ" checkbox
  defaultSubcategory?: string; // Pre-select a subcategory filter (e.g., 'berry' for berries)
  showCategorySelector?: boolean; // Show dropdown to select target macro category
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
  showCategorySelector = false,
}: ProductSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [slvFoods, setSlvFoods] = useState<SlvFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceTab>('products');
  const [activeSubcategory, setActiveSubcategory] = useState(defaultSubcategory || 'all');
  const [addAsAlternative, setAddAsAlternative] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductWithCalculation[]>([]);
  const [selectedTargetCategory, setSelectedTargetCategory] = useState<MacroCategory>(category);

  // Dynamiska subkategorier från databasen
  const [subcategories, setSubcategories] = useState<Subcategory[]>([{ key: 'all', label: 'Alla', count: 0 }]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);

  // Reset subkategori och target category när kategori eller defaultSubcategory ändras
  useEffect(() => {
    setActiveSubcategory(defaultSubcategory || 'all');
    setSelectedTargetCategory(category);
  }, [category, defaultSubcategory]);

  // Hämta dynamiska subkategorier från databasen (skip when showing all products)
  useEffect(() => {
    if (!isOpen || !category || showCategorySelector) {
      // Reset subcategories when showing all products
      if (showCategorySelector) {
        setSubcategories([{ key: 'all', label: 'Alla', count: 0 }]);
      }
      return;
    }

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
  }, [isOpen, category, showCategorySelector]);

  // Fetch products for the category (or all products when showCategorySelector is true)
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // When showCategorySelector is true, fetch ALL products (no category filter)
        // Otherwise filter by the specified category
        const categoryParam = showCategorySelector ? '' : `macroCategory=${category}&`;

        // Fetch products, food items, and SLV foods in parallel (no limits)
        const [productsRes, foodItemsRes, slvRes] = await Promise.all([
          fetch(`/api/products?${categoryParam}limit=1000`),
          fetch(`/api/food-items?${categoryParam}limit=1000`),
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
  }, [isOpen, category, showCategorySelector]);

  // Check if this is vegetable category (free, no macro calculation)
  const isVegetable = category === 'vegetable';
  const defaultVegetableGrams = 100;

  // Convert SLV foods to Product format
  const slvAsProducts: Product[] = useMemo(() => {
    // When showCategorySelector is true, don't filter SLV foods by category
    const filteredFoods = showCategorySelector ? slvFoods : filterSlvByCategory(slvFoods, category);
    return filteredFoods.map(f => ({
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
  }, [slvFoods, category, showCategorySelector]);

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
      // Pass selectedTargetCategory when showCategorySelector is true
      onSelect(product, product.calculatedGrams, product.calculatedMacros, addAsAlternative, showCategorySelector ? selectedTargetCategory : undefined);
      // Small delay to ensure API calls don't overlap
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    setSelectedProducts([]);
    setAddAsAlternative(false);
    setSelectedTargetCategory(category); // Reset to default
    onClose();
  };

  // Reset selection when modal closes
  const handleClose = () => {
    setSelectedProducts([]);
    setAddAsAlternative(false);
    setSelectedTargetCategory(category);
    onClose();
  };

  const macroLabel = getMacroKey(category);
  const categoryTitle = MACRO_CATEGORY_LABELS[category] || category;

  // Get display title based on context
  const getDialogTitle = () => {
    // When category selector is shown, use generic title
    if (showCategorySelector) {
      return 'Välj livsmedel';
    }
    if (defaultSubcategory && defaultSubcategory !== 'all') {
      // Use defaultSubcategory directly for title - don't wait for API
      return `Välj ${defaultSubcategory.toLowerCase()}`;
    }
    return `Välj ${categoryTitle.toLowerCase()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
            Livsmedel
            {products.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {products.length}
              </span>
            )}
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
            SLV-databas
            {slvAsProducts.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                {slvAsProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder={activeTab === 'slv' ? 'Sök i SLV-databasen...' : 'Sök livsmedel...'}
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

        {/* Subkategori-chips - show for filtering (hide when showing all products) */}
        {subcategories.length > 1 && !showCategorySelector && (
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

        {/* Category selector - choose where product should be placed */}
        {showCategorySelector && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-sm text-blue-800 font-medium">Placera som:</span>
            <Select
              value={selectedTargetCategory}
              onValueChange={(value) => setSelectedTargetCategory(value as MacroCategory)}
            >
              <SelectTrigger className="w-40 h-8 bg-white border-blue-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="protein">Protein</SelectItem>
                <SelectItem value="carb">Kolhydrat</SelectItem>
                <SelectItem value="fat">Fett</SelectItem>
                <SelectItem value="vegetable">Grönsaker</SelectItem>
                <SelectItem value="sauce">Sås</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            productsWithCalculations.map((product) => {
              const isSelected = isProductSelected(product.id);
              const isSlvProduct = product.source === 'slv';
              return (
              <button
                key={product.id}
                onClick={() => handleToggleSelect(product)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors group",
                  isSelected
                    ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                    : isSlvProduct
                      ? 'border-green-200 hover:border-green-400 hover:bg-green-50/50'
                      : 'border-zinc-200 hover:border-amber-300 hover:bg-amber-50/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Selection checkbox */}
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-1 transition-colors",
                    isSelected
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-zinc-300 group-hover:border-amber-400'
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

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
                      isSlvProduct ? 'bg-green-100' : 'bg-zinc-100'
                    )}>
                      {isSlvProduct ? (
                        <Database className="h-5 w-5 text-green-600" />
                      ) : (
                        <span className="text-zinc-400 text-xs">Bild</span>
                      )}
                    </div>
                  )}

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium truncate",
                        isSlvProduct
                          ? 'text-zinc-900 group-hover:text-green-700'
                          : 'text-zinc-900 group-hover:text-amber-700'
                      )}>
                        {product.name}
                      </span>
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
                      isVegetable ? 'text-green-600' : isSlvProduct ? 'text-green-600' : 'text-amber-600'
                    )}>
                      {product.calculatedGrams}g
                    </div>
                    <div className="text-xs text-zinc-500">
                      {product.calculatedMacros.kcal} kcal
                    </div>
                  </div>
                </div>

                {/* Macro breakdown */}
                <div className="mt-2 flex gap-3 text-xs text-zinc-500 ml-8">
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
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="text-sm text-zinc-600">
              {selectedProducts.length} produkt{selectedProducts.length > 1 ? 'er' : ''} vald{selectedProducts.length > 1 ? 'a' : ''}
            </div>
            <Button
              onClick={handleConfirmSelection}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              Lägg till {selectedProducts.length > 1 ? 'alla' : ''}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
