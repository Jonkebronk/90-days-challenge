// Custom hook combining React Hook Form + Zustand
// Manages form state for nutrition calculator phases

'use client';

import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useNutritionStore } from '@/lib/stores/nutrition-calculator-store';
import {
  phase1DataSchema,
  phase2DataSchema,
  phase3DataSchema,
  phase4DataSchema,
} from '@/lib/validations/nutrition-plan';
import {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
} from '@/lib/types/nutrition';

type PhaseNumber = 1 | 2 | 3 | 4;
type PhaseData = Phase1Data | Phase2Data | Phase3Data | Phase4Data;

interface UsePhaseFormOptions {
  phase: PhaseNumber;
  onSubmit?: (data: PhaseData) => void | Promise<void>;
}

type PhaseFormReturn<T extends PhaseNumber> = UseFormReturn<
  T extends 1
    ? Phase1Data
    : T extends 2
    ? Phase2Data
    : T extends 3
    ? Phase3Data
    : Phase4Data
> & {
  isLoading: boolean;
  handleFormSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
};

export function usePhaseForm<T extends PhaseNumber>(
  options: UsePhaseFormOptions
): PhaseFormReturn<T> {
  const { phase, onSubmit } = options;

  // Get data from store
  const phase1Data = useNutritionStore((state) => state.phase1Data);
  const phase2Data = useNutritionStore((state) => state.phase2Data);
  const phase3Data = useNutritionStore((state) => state.phase3Data);
  const phase4Data = useNutritionStore((state) => state.phase4Data);

  // Get setters from store
  const setPhase1Data = useNutritionStore((state) => state.setPhase1Data);
  const setPhase2Data = useNutritionStore((state) => state.setPhase2Data);
  const setPhase3Data = useNutritionStore((state) => state.setPhase3Data);
  const setPhase4Data = useNutritionStore((state) => state.setPhase4Data);

  // Select appropriate schema and data based on phase
  const getSchemaAndData = () => {
    switch (phase) {
      case 1:
        return {
          schema: phase1DataSchema,
          data: phase1Data,
          setter: setPhase1Data,
        };
      case 2:
        return {
          schema: phase2DataSchema,
          data: phase2Data,
          setter: setPhase2Data,
        };
      case 3:
        return {
          schema: phase3DataSchema,
          data: phase3Data,
          setter: setPhase3Data,
        };
      case 4:
        return {
          schema: phase4DataSchema,
          data: phase4Data,
          setter: setPhase4Data,
        };
      default:
        throw new Error(`Invalid phase: ${phase}`);
    }
  };

  const { schema, data, setter } = getSchemaAndData();

  // Initialize form with schema validation
  const form = useForm({
    resolver: zodResolver(schema as any),
    defaultValues: data || {},
    mode: 'onChange',
  }) as any;

  // Sync form values with store when data changes
  useEffect(() => {
    if (data) {
      form.reset(data);
    }
  }, [data, form]);

  // Handle form submission
  const handleFormSubmit = async (e?: React.BaseSyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    await form.handleSubmit(async (formData: PhaseData) => {
      // Update store
      (setter as any)(formData);

      // Call custom onSubmit if provided
      if (onSubmit) {
        await onSubmit(formData);
      }
    })(e);
  };

  return {
    ...form,
    isLoading: form.formState.isSubmitting,
    handleFormSubmit,
  } as PhaseFormReturn<T>;
}

// Convenience hooks for each phase
export function usePhase1Form(onSubmit?: (data: Phase1Data) => void | Promise<void>) {
  return usePhaseForm({ phase: 1, onSubmit: onSubmit as any });
}

export function usePhase2Form(onSubmit?: (data: Phase2Data) => void | Promise<void>) {
  return usePhaseForm({ phase: 2, onSubmit: onSubmit as any });
}

export function usePhase3Form(onSubmit?: (data: Phase3Data) => void | Promise<void>) {
  return usePhaseForm({ phase: 3, onSubmit: onSubmit as any });
}

export function usePhase4Form(onSubmit?: (data: Phase4Data) => void | Promise<void>) {
  return usePhaseForm({ phase: 4, onSubmit: onSubmit as any });
}
