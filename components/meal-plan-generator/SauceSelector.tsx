'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Sauce {
  id: string;
  name: string;
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

export function SauceSelector({
  isOpen,
  onClose,
  onSelect,
  isLoading = false,
}: SauceSelectorProps) {
  const [sauces, setSauces] = useState<Sauce[]>([]);
  const [selectedSauce, setSelectedSauce] = useState<Sauce | null>(null);
  const [grams, setGrams] = useState<number>(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch sauces on open
  useEffect(() => {
    if (isOpen) {
      fetchSauces();
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

  const filteredSauces = sauces.filter((sauce) =>
    sauce.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = () => {
    if (selectedSauce && grams > 0) {
      onSelect(selectedSauce.id, grams);
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

  const selectedMacros = selectedSauce
    ? calculateMacros(selectedSauce, grams)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Välj sås</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Sök sås..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sauce list */}
          <ScrollArea className="h-48 border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Laddar såser...
              </div>
            ) : filteredSauces.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Inga såser hittades
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredSauces.map((sauce) => (
                  <div
                    key={sauce.id}
                    onClick={() => setSelectedSauce(sauce)}
                    className={cn(
                      'p-3 rounded-md cursor-pointer transition-colors flex items-center gap-3',
                      selectedSauce?.id === sauce.id
                        ? 'bg-orange-100 border-2 border-orange-500'
                        : 'hover:bg-gray-100 border-2 border-transparent'
                    )}
                  >
                    {sauce.image ? (
                      <img
                        src={sauce.image}
                        alt={sauce.name}
                        className="w-10 h-10 rounded-lg object-cover bg-white shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-lg">🥫</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{sauce.name}</div>
                      <div className="text-xs text-gray-500">
                        Per 100g: {sauce.calories} kcal | P: {sauce.proteinG}g | K: {sauce.carbsG}g | F: {sauce.fatG}g
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Grams input */}
          {selectedSauce && (
            <div className="space-y-3 p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-4">
                <Label htmlFor="grams" className="whitespace-nowrap">
                  Mängd:
                </Label>
                <Input
                  id="grams"
                  type="number"
                  min={1}
                  max={100}
                  value={grams}
                  onChange={(e) =>
                    setGrams(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))
                  }
                  className="w-24"
                />
                <span className="text-gray-500">gram</span>
              </div>

              {selectedMacros && (
                <div className="text-sm">
                  <div className="font-medium text-orange-700 mb-1">
                    {selectedSauce.name} ({grams}g)
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                    <span>{selectedMacros.kcal} kcal</span>
                    <span>P: {selectedMacros.protein}g</span>
                    <span>K: {selectedMacros.carbs}g</span>
                    <span>F: {selectedMacros.fat}g</span>
                  </div>
                </div>
              )}

              {/* Info about macro adjustment */}
              <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Makron från såsen dras av från övriga måltider för att bibehålla dina dagliga mål.
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedSauce || grams <= 0 || isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? 'Lägger till...' : 'Lägg till sås'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
