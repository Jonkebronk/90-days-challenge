'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

type FoodItem = {
  id: string;
  name: string;
  brand?: string | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG?: number | null;
  sugarG?: number | null;
  saturatedFatG?: number | null;
  servingSize?: number | null;
  servingUnit?: string | null;
  image?: string | null;
};

interface FoodItemDetailDialogProps {
  foodId: string | null;
  foodName?: string;
  currentGrams?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FoodItemDetailDialog({
  foodId,
  foodName,
  currentGrams = 100,
  open,
  onOpenChange,
}: FoodItemDetailDialogProps) {
  const [foodItem, setFoodItem] = useState<FoodItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && foodId) {
      fetchFoodItem();
    } else {
      setFoodItem(null);
    }
  }, [open, foodId]);

  const fetchFoodItem = async () => {
    if (!foodId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/food-items/${foodId}`);
      if (response.ok) {
        const data = await response.json();
        setFoodItem(data.item);
      }
    } catch (error) {
      console.error('Error fetching food item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate macros for current grams
  const calculateMacro = (per100g: number | null): number => {
    if (!per100g) return 0;
    return Math.round((per100g * currentGrams / 100) * 10) / 10;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : foodItem ? (
          <>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold text-zinc-900">
                {foodItem.name}
              </DialogTitle>
              {foodItem.brand && (
                <p className="text-sm text-zinc-500">{foodItem.brand}</p>
              )}
            </DialogHeader>

            {/* Image */}
            {foodItem.image && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={foodItem.image}
                  alt={foodItem.name}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* Nutrition per 100g */}
            <div className="space-y-3">
              <h3 className="font-semibold text-zinc-900 text-sm">
                Näringsvärde per 100g
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-zinc-50 rounded">
                  <span className="text-zinc-600">Kalorier</span>
                  <span className="font-medium">{foodItem.calories || 0} kcal</span>
                </div>
                <div className="flex justify-between p-2 bg-rose-50 rounded">
                  <span className="text-zinc-600">Protein</span>
                  <span className="font-medium text-rose-600">{foodItem.proteinG || 0}g</span>
                </div>
                <div className="flex justify-between p-2 bg-amber-50 rounded">
                  <span className="text-zinc-600">Kolhydrater</span>
                  <span className="font-medium text-amber-600">{foodItem.carbsG || 0}g</span>
                </div>
                <div className="flex justify-between p-2 bg-sky-50 rounded">
                  <span className="text-zinc-600">Fett</span>
                  <span className="font-medium text-sky-600">{foodItem.fatG || 0}g</span>
                </div>
                {foodItem.fiberG !== null && foodItem.fiberG !== undefined && (
                  <div className="flex justify-between p-2 bg-emerald-50 rounded">
                    <span className="text-zinc-600">Fiber</span>
                    <span className="font-medium text-emerald-600">{foodItem.fiberG}g</span>
                  </div>
                )}
                {foodItem.sugarG !== null && foodItem.sugarG !== undefined && (
                  <div className="flex justify-between p-2 bg-purple-50 rounded">
                    <span className="text-zinc-600">Socker</span>
                    <span className="font-medium text-purple-600">{foodItem.sugarG}g</span>
                  </div>
                )}
              </div>
            </div>

            {/* Nutrition for current serving */}
            {currentGrams !== 100 && (
              <div className="border-t border-zinc-200 pt-3 space-y-3">
                <h3 className="font-semibold text-zinc-900 text-sm">
                  Näringsvärde för {currentGrams}g
                </h3>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div className="text-center p-2 bg-zinc-100 rounded">
                    <div className="font-semibold text-zinc-700">
                      {calculateMacro(foodItem.calories)}
                    </div>
                    <div className="text-xs text-zinc-500">kcal</div>
                  </div>
                  <div className="text-center p-2 bg-rose-100 rounded">
                    <div className="font-semibold text-rose-600">
                      {calculateMacro(foodItem.proteinG)}g
                    </div>
                    <div className="text-xs text-zinc-500">Protein</div>
                  </div>
                  <div className="text-center p-2 bg-amber-100 rounded">
                    <div className="font-semibold text-amber-600">
                      {calculateMacro(foodItem.carbsG)}g
                    </div>
                    <div className="text-xs text-zinc-500">Kolh.</div>
                  </div>
                  <div className="text-center p-2 bg-sky-100 rounded">
                    <div className="font-semibold text-sky-600">
                      {calculateMacro(foodItem.fatG)}g
                    </div>
                    <div className="text-xs text-zinc-500">Fett</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center text-zinc-500">
            {foodName || 'Kunde inte ladda livsmedlet'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
