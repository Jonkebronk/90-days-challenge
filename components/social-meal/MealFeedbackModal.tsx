'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ThumbsUp, ThumbsDown, Minus, Check, Pencil } from 'lucide-react';
import type { FeedbackAccuracy, NutritionEstimate } from '@/lib/social-meal/types';

interface MealFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealId: string;
  mealName?: string;
  nutrition: NutritionEstimate;
  onFeedbackSubmit?: (success: boolean) => void;
}

export function MealFeedbackModal({
  isOpen,
  onClose,
  mealId,
  mealName,
  nutrition,
  onFeedbackSubmit,
}: MealFeedbackModalProps) {
  const [accuracy, setAccuracy] = useState<FeedbackAccuracy | null>(null);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustedValues, setAdjustedValues] = useState({
    kcal: nutrition.kcal,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!accuracy) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/social-meals/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialMealId: mealId,
          accuracy,
          originalKcal: nutrition.kcal,
          originalProtein: nutrition.protein,
          originalCarbs: nutrition.carbs,
          originalFat: nutrition.fat,
          ...(showAdjust && {
            adjustedKcal: adjustedValues.kcal,
            adjustedProtein: adjustedValues.protein,
            adjustedCarbs: adjustedValues.carbs,
            adjustedFat: adjustedValues.fat,
          }),
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        onFeedbackSubmit?.(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        onFeedbackSubmit?.(false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      onFeedbackSubmit?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accuracyOptions: { value: FeedbackAccuracy; label: string; icon: typeof ThumbsUp; color: string }[] = [
    { value: 'too_low', label: 'För lågt', icon: ThumbsDown, color: 'text-red-500 bg-red-50 border-red-200 hover:bg-red-100' },
    { value: 'about_right', label: 'Ungefär rätt', icon: Check, color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100' },
    { value: 'too_high', label: 'För högt', icon: ThumbsUp, color: 'text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[95vw] max-w-md max-h-[90vh] overflow-hidden z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-indigo-50">
            <Dialog.Title className="text-lg font-semibold text-gray-800">
              Hur stämde uppskattningen?
            </Dialog.Title>
            {mealName && (
              <p className="text-sm text-gray-500 mt-1">{mealName}</p>
            )}
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/50 transition-colors"
                aria-label="Stäng"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-800">Tack för din feedback!</p>
                <p className="text-sm text-gray-500 mt-2">
                  Vi använder detta för att förbättra uppskattningarna.
                </p>
              </div>
            ) : (
              <>
                {/* Current estimate display */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500 mb-2">Uppskattade värden:</p>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{nutrition.kcal} kcal</span>
                    <span className="text-gray-600">
                      P: {nutrition.protein}g • K: {nutrition.carbs}g • F: {nutrition.fat}g
                    </span>
                  </div>
                </div>

                {/* Accuracy selection */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Hur väl stämmer detta med verkligheten?
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {accuracyOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = accuracy === option.value;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setAccuracy(option.value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? option.color.replace('hover:', '') + ' border-current'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-6 h-6 ${isSelected ? '' : 'text-gray-400'}`} />
                          <span className={`text-xs font-medium ${isSelected ? '' : 'text-gray-600'}`}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Adjust values option */}
                {accuracy && accuracy !== 'about_right' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowAdjust(!showAdjust)}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Pencil className="w-4 h-4" />
                      {showAdjust ? 'Dölj justering' : 'Justera värden (valfritt)'}
                    </button>

                    {showAdjust && (
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Kalorier</label>
                            <input
                              type="number"
                              value={adjustedValues.kcal}
                              onChange={(e) => setAdjustedValues({ ...adjustedValues, kcal: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Protein (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={adjustedValues.protein}
                              onChange={(e) => setAdjustedValues({ ...adjustedValues, protein: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Kolhydrater (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={adjustedValues.carbs}
                              onChange={(e) => setAdjustedValues({ ...adjustedValues, carbs: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Fett (g)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={adjustedValues.fat}
                              onChange={(e) => setAdjustedValues({ ...adjustedValues, fat: Number(e.target.value) })}
                              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Dessa värden hjälper oss att förbättra framtida uppskattningar för dig.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <button
                  onClick={handleSubmit}
                  disabled={!accuracy || isSubmitting}
                  className={`w-full py-3 rounded-xl font-medium transition-all ${
                    accuracy && !isSubmitting
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Skickar...' : 'Skicka feedback'}
                </button>

                {/* Skip button */}
                <button
                  onClick={onClose}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Hoppa över
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
