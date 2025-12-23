'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickTrackCategory, PortionSize, QuickTrackFoodItem } from '@/lib/social-meal/types';
import { QUICK_TRACK_CATEGORIES } from '@/lib/social-meal/quick-track-categories';

interface FoodItemPickerProps {
  category: QuickTrackCategory;
  onSelect: (item: QuickTrackFoodItem, portion: PortionSize) => void;
}

const portionLabels: Record<PortionSize, string> = {
  small: 'Liten',
  normal: 'Normal',
  large: 'Stor',
  extra: 'Extra stor',
  custom: 'Anpassad',
};

const portionColors: Record<PortionSize, string> = {
  small: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  normal: 'bg-green-100 text-green-700 hover:bg-green-200',
  large: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  extra: 'bg-red-100 text-red-700 hover:bg-red-200',
  custom: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
};

export function FoodItemPicker({ category, onSelect }: FoodItemPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<QuickTrackFoodItem | null>(null);

  const categoryData = QUICK_TRACK_CATEGORIES[category];
  const items = categoryData.commonItems;

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const handleItemClick = (item: QuickTrackFoodItem) => {
    setSelectedItem(item);
  };

  const handlePortionSelect = (portion: PortionSize) => {
    if (selectedItem) {
      onSelect(selectedItem, portion);
      setSelectedItem(null);
      setSearchQuery('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={`Sök ${categoryData.label.toLowerCase()}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Selected item with portion picker */}
      {selectedItem && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{selectedItem.name}</span>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Avbryt
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedItem.portions.map((portion) => (
              <button
                key={portion.size}
                onClick={() => handlePortionSelect(portion.size)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  portionColors[portion.size]
                )}
              >
                <div className="flex flex-col items-center">
                  <span>{portionLabels[portion.size]}</span>
                  <span className="text-xs opacity-75">
                    {portion.grams}g / {portion.kcal} kcal
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items list */}
      {!selectedItem && (
        <div className="grid gap-2 max-h-64 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Inga resultat hittades</p>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
              >
                <div>
                  <span className="font-medium text-gray-900">{item.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    {item.per100g.kcal} kcal/100g
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
