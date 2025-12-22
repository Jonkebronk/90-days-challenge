'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X, Apple, Database, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Sauce {
  id: string;
  name: string;
  brand?: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  image?: string | null;
}

interface SauceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sauceId: string, grams: number) => void;
  isLoading?: boolean;
}

type SourceTab = 'products' | 'slv';

export function SauceSelector({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
}: SauceSelectorProps) {
  const [sauces, setSauces] = useState<Sauce[]>([]);
  const [slvSauces, setSlvSauces] = useState<Sauce[]>([]);
  const [selectedSauce, setSelectedSauce] = useState<Sauce | null>(null);
  const [grams, setGrams] = useState<number>(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SourceTab>('products');

  // Fetch sauces on open
  useEffect(() => {
    if (isOpen) {
      fetchSauces();
      fetchSlvSauces();
    }
  }, [isOpen]);

  const fetchSauces = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/foods/by-category?category=sauce&limit=100');
      if (response.ok) {
        const data = await response.json();
        setSauces(data);
      }
    } catch (error) {
      console.error('Error fetching sauces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlvSauces = async () => {
    try {
      const response = await fetch('/data/slv-foods.json');
      if (response.ok) {
        const data = await response.json();
        // Find sauce category or filter by keywords
        const allFoods: any[] = [];
        for (const categoryFoods of Object.values(data.categories || {})) {
          allFoods.push(...(categoryFoods as any[]));
        }
        // Filter for sauces
        const sauceKeywords = ['sås', 'ketchup', 'senap', 'majonnäs', 'mayo', 'dressing', 'crème fraiche', 'gräddfil'];
        const filteredSauces = allFoods
          .filter(f => sauceKeywords.some(kw => f.namn?.toLowerCase().includes(kw)))
          .map(f => ({
            id: `slv-${f.nummer}`,
            name: f.namn,
            brand: 'Livsmedelsverket',
            calories: f.kcal || 0,
            proteinG: f.protein || 0,
            carbsG: f.carbs || 0,
            fatG: f.fat || 0,
            image: null,
          }));
        setSlvSauces(filteredSauces);
      }
    } catch (error) {
      console.error('Error fetching SLV sauces:', error);
    }
  };

  // Get active source items
  const sourceItems = activeTab === 'products' ? sauces : slvSauces;

  const filteredSauces = useMemo(() => {
    return sourceItems
      .filter((sauce) =>
        sauce.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  }, [sourceItems, searchTerm]);

  const handleSelect = () => {
    if (selectedSauce && grams > 0) {
      onSelect(selectedSauce.id, grams);
      setSelectedSauce(null);
      setGrams(30);
      onClose();
    }
  };

  // Calculate macros for selected grams
  const calculateMacros = (sauce: Sauce, g: number) => {
    const factor = g / 100;
    return {
      kcal: Math.round(sauce.calories * factor),
      protein: (sauce.proteinG * factor).toFixed(1),
      carbs: (sauce.carbsG * factor).toFixed(1),
      fat: (sauce.fatG * factor).toFixed(1),
    };
  };

  const handleClose = () => {
    setSelectedSauce(null);
    setGrams(30);
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Välj sås</DialogTitle>
        </DialogHeader>

        {/* Source tabs */}
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === 'products'
                ? 'border-b-2 border-orange-500 text-orange-700'
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
            placeholder={activeTab === 'slv' ? 'Sök i Livsmedelsverkets databas...' : 'Sök sås...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded"
            >
              <X className="h-4 w-4 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Sauce list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-zinc-500">Laddar...</div>
          ) : filteredSauces.length === 0 ? (
            <div className="py-8 text-center text-zinc-500">
              {searchTerm ? 'Inga såser matchar sökningen' : 'Inga såser i denna kategori'}
            </div>
          ) : (
            filteredSauces.map((sauce) => {
              const isSelected = selectedSauce?.id === sauce.id;
              const macros = calculateMacros(sauce, grams);
              return (
                <button
                  key={sauce.id}
                  onClick={() => setSelectedSauce(sauce)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors group",
                    isSelected
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20'
                      : activeTab === 'slv'
                        ? 'border-green-200 hover:border-green-400 hover:bg-green-50/50'
                        : 'border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection checkbox */}
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-1 transition-colors",
                      isSelected
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-zinc-300 group-hover:border-orange-400'
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Product image or icon */}
                    {sauce.image ? (
                      <img
                        src={sauce.image}
                        alt={sauce.name}
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
                          <span className="text-2xl">🥫</span>
                        )}
                      </div>
                    )}

                    {/* Sauce info */}
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "font-medium truncate",
                        activeTab === 'slv'
                          ? 'text-zinc-900 group-hover:text-green-700'
                          : 'text-zinc-900 group-hover:text-orange-700'
                      )}>
                        {sauce.name}
                      </div>
                      {sauce.brand && (
                        <div className="text-xs text-zinc-500 truncate">{sauce.brand}</div>
                      )}
                      <div className="text-xs text-zinc-400 mt-1">
                        Per 100g: {sauce.calories} kcal | P: {sauce.proteinG}g | K: {sauce.carbsG}g | F: {sauce.fatG}g
                      </div>
                    </div>

                    {/* Calculated amount */}
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-lg font-semibold",
                        activeTab === 'slv' ? 'text-green-600' : 'text-orange-600'
                      )}>
                        {grams}g
                      </div>
                      <div className="text-xs text-zinc-500">
                        {macros.kcal} kcal
                      </div>
                    </div>
                  </div>

                  {/* Macro breakdown for selected grams */}
                  <div className="mt-2 flex gap-3 text-xs text-zinc-500 ml-8">
                    <span>P: {macros.protein}g</span>
                    <span>K: {macros.carbs}g</span>
                    <span>F: {macros.fat}g</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer with grams input and confirm button */}
        {selectedSauce && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-zinc-700">
                {selectedSauce.name}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">Mängd:</span>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={grams}
                  onChange={(e) => setGrams(Math.min(200, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-zinc-500">g</span>
              </div>
            </div>
            <Button
              onClick={handleSelect}
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isLoading ? 'Lägger till...' : 'Lägg till sås'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
