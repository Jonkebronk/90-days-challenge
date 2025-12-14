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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MacroCategory, MealType, SwapFeedback } from '@/lib/types/meal-plan-generator';

interface FoodOption {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  isRecommended: boolean;
}

interface FoodSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwap: (foodId: string) => Promise<SwapFeedback | null>;
  category: MacroCategory;
  mealType: MealType;
  currentFoodId: string;
}

const categoryLabels: Record<MacroCategory, string> = {
  protein: 'proteinkälla',
  carb: 'kolhydratkälla',
  fat: 'fettkälla',
  vegetable: 'grönsak',
  sauce: 'sås',
};

export function FoodSwapModal({
  isOpen,
  onClose,
  onSwap,
  category,
  mealType,
  currentFoodId,
}: FoodSwapModalProps) {
  const [foods, setFoods] = useState<FoodOption[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [feedback, setFeedback] = useState<SwapFeedback | null>(null);

  // Fetch foods on open
  useEffect(() => {
    if (isOpen) {
      fetchFoods();
      setSelectedFood(null);
      setFeedback(null);
    }
  }, [isOpen, category, mealType]);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/foods/by-category?category=${category}&meal=${mealType}`
      );
      if (response.ok) {
        const data = await response.json();
        setFoods(data);
      }
    } catch (error) {
      console.error('Error fetching foods:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFoods = foods.filter(
    (food) =>
      food.id !== currentFoodId &&
      food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSwap = async () => {
    if (!selectedFood) return;

    setSwapping(true);
    try {
      const result = await onSwap(selectedFood.id);
      setFeedback(result);

      // If successful, close after showing feedback briefly
      if (result?.type === 'success') {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } finally {
      setSwapping(false);
    }
  };

  const feedbackIcon = feedback
    ? {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
      }[feedback.type]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Byt {categoryLabels[category]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Sök ${categoryLabels[category]}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Food list */}
          <ScrollArea className="h-64 border rounded-md">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Laddar...
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Inga livsmedel hittades
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredFoods.map((food) => (
                  <div
                    key={food.id}
                    onClick={() => setSelectedFood(food)}
                    className={cn(
                      'p-3 rounded-md cursor-pointer transition-colors',
                      selectedFood?.id === food.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'hover:bg-gray-100 border-2 border-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{food.name}</span>
                      {food.isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          Rekommenderad
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Per 100g: {food.calories} kcal | P: {food.proteinG}g | K:{' '}
                      {food.carbsG}g | F: {food.fatG}g
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Feedback */}
          {feedback && (
            <div
              className={cn(
                'flex items-start gap-2 p-3 rounded-lg',
                feedback.type === 'success' && 'bg-green-50 text-green-700',
                feedback.type === 'warning' && 'bg-amber-50 text-amber-700',
                feedback.type === 'error' && 'bg-red-50 text-red-700'
              )}
            >
              {feedbackIcon}
              <div className="flex-1">
                <p className="text-sm font-medium">{feedback.message}</p>
                {feedback.adjustments && feedback.adjustments.length > 0 && (
                  <ul className="mt-2 text-xs space-y-1">
                    {feedback.adjustments.map((adj, i) => (
                      <li key={i}>
                        {adj.reason}: {adj.oldGrams}g → {adj.newGrams}g
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            onClick={handleSwap}
            disabled={!selectedFood || swapping}
          >
            {swapping ? 'Byter...' : 'Byt livsmedel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
