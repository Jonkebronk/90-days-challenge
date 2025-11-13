// Auto-save hook with debounced save (500ms delay)
// Automatically saves nutrition plan data when changes are detected

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useNutritionStore } from '@/lib/stores/nutrition-calculator-store';
import { toast } from 'sonner';

interface UseAutoSaveOptions {
  enabled?: boolean;
  delay?: number;
  onSave?: () => Promise<void>;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { enabled = true, delay = 500, onSave } = options;

  const isDirty = useNutritionStore((state) => state.isDirty);
  const isSaving = useNutritionStore((state) => state.isSaving);
  const setSaving = useNutritionStore((state) => state.setSaving);
  const markSaved = useNutritionStore((state) => state.markSaved);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const performSave = useCallback(async () => {
    if (!onSave || !isMountedRef.current) return;

    try {
      setSaving(true);
      await onSave();

      if (isMountedRef.current) {
        markSaved();
      }
    } catch (error) {
      if (isMountedRef.current) {
        setSaving(false);
        console.error('Auto-save failed:', error);
        toast.error('Kunde inte spara planen automatiskt');
      }
    }
  }, [onSave, setSaving, markSaved]);

  useEffect(() => {
    // Don't auto-save if disabled, not dirty, or already saving
    if (!enabled || !isDirty || isSaving || !onSave) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDirty, isSaving, enabled, delay, performSave, onSave]);

  // Manual save function (bypasses debounce)
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  return {
    isSaving,
    isDirty,
    saveNow,
  };
}
