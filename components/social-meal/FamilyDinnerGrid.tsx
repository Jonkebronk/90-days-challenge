'use client';

import { useState, useMemo } from 'react';
import { Search, ChefHat, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FamilyDinnerPreset } from '@/lib/social-meal/types';
import { FAMILY_DINNER_PRESETS, getAllTags } from '@/lib/social-meal/family-dinners';

interface FamilyDinnerGridProps {
  onSelect: (preset: FamilyDinnerPreset) => void;
}

const tagLabels: Record<string, string> = {
  husmanskost: 'Husmanskost',
  klassiker: 'Klassiker',
  barnfavorit: 'Barnfavorit',
  fisk: 'Fisk',
  kyckling: 'Kyckling',
  pasta: 'Pasta',
  vegetariskt: 'Vegetariskt',
  snabb: 'Snabb',
  festmat: 'Festmat',
  modern: 'Modern',
  helg: 'Helg',
  grill: 'Grill',
  sommar: 'Sommar',
  asiatiskt: 'Asiatiskt',
  mexikanskt: 'Mexikanskt',
  italienskt: 'Italienskt',
};

const tagColors: Record<string, string> = {
  husmanskost: 'bg-amber-100 text-amber-700',
  klassiker: 'bg-purple-100 text-purple-700',
  barnfavorit: 'bg-pink-100 text-pink-700',
  fisk: 'bg-blue-100 text-blue-700',
  kyckling: 'bg-yellow-100 text-yellow-700',
  pasta: 'bg-orange-100 text-orange-700',
  vegetariskt: 'bg-green-100 text-green-700',
  snabb: 'bg-emerald-100 text-emerald-700',
  festmat: 'bg-rose-100 text-rose-700',
  modern: 'bg-indigo-100 text-indigo-700',
  helg: 'bg-cyan-100 text-cyan-700',
  grill: 'bg-red-100 text-red-700',
  sommar: 'bg-sky-100 text-sky-700',
  asiatiskt: 'bg-lime-100 text-lime-700',
  mexikanskt: 'bg-teal-100 text-teal-700',
  italienskt: 'bg-violet-100 text-violet-700',
};

export function FamilyDinnerGrid({ onSelect }: FamilyDinnerGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = getAllTags();
  const popularTags = ['husmanskost', 'barnfavorit', 'snabb', 'fisk', 'vegetariskt', 'pasta'];

  const filteredPresets = useMemo(() => {
    let presets = FAMILY_DINNER_PRESETS;

    // Filter by tag
    if (selectedTag) {
      presets = presets.filter((p) => p.tags?.includes(selectedTag));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      presets = presets.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return presets;
  }, [selectedTag, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Sök bland middagar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Popular tags */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            selectedTag === null
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          Alla
        </button>
        {popularTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              selectedTag === tag
                ? 'ring-2 ring-offset-1 ring-gray-900'
                : '',
              tagColors[tag] || 'bg-gray-100 text-gray-700'
            )}
          >
            {tagLabels[tag] || tag}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500">
        {filteredPresets.length} middagar
      </p>

      {/* Grid */}
      <div className="grid gap-3 max-h-80 overflow-y-auto">
        {filteredPresets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UtensilsCrossed className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Inga middagar hittades</p>
          </div>
        ) : (
          filteredPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <ChefHat className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{preset.name}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.tags?.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs',
                        tagColors[tag] || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {tagLabels[tag] || tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-gray-900">
                  {preset.totalNutrition.kcal} kcal
                </p>
                <p className="text-xs text-gray-500">
                  P: {preset.totalNutrition.protein}g
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
