// Zustand store for Nutrition Calculator
// Global state management with localStorage persistence

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Phase1Data,
  Phase2Data,
  Phase3Data,
  Phase4Data,
  PlanStatus,
} from '@/lib/types/nutrition';

interface NutritionCalculatorState {
  // Plan metadata
  planId: string | null;
  clientId: string | null;
  clientName: string;
  status: PlanStatus;
  currentPhase: 1 | 2 | 3 | 4;

  // Phase data
  phase1Data: Phase1Data | null;
  phase2Data: Phase2Data | null;
  phase3Data: Phase3Data | null;
  phase4Data: Phase4Data | null;

  // UI state
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;

  // Actions - Basic setters
  setClientId: (clientId: string, clientName: string) => void;
  setCurrentPhase: (phase: 1 | 2 | 3 | 4) => void;
  setStatus: (status: PlanStatus) => void;

  // Actions - Phase data management
  setPhase1Data: (data: Phase1Data) => void;
  setPhase2Data: (data: Phase2Data) => void;
  setPhase3Data: (data: Phase3Data) => void;
  setPhase4Data: (data: Phase4Data) => void;

  // Actions - Navigation
  nextPhase: () => void;
  previousPhase: () => void;
  canGoToNextPhase: () => boolean;
  canGoToPreviousPhase: () => boolean;

  // Actions - Plan management
  loadPlan: (plan: {
    id: string;
    clientId: string;
    clientName: string;
    status: PlanStatus;
    phase1Data: Phase1Data;
    phase2Data?: Phase2Data | null;
    phase3Data?: Phase3Data | null;
    phase4Data?: Phase4Data | null;
  }) => void;
  setPlanId: (id: string) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  reset: () => void;
}

const initialState = {
  planId: null,
  clientId: null,
  clientName: '',
  status: 'DRAFT' as PlanStatus,
  currentPhase: 1 as 1 | 2 | 3 | 4,
  phase1Data: null,
  phase2Data: null,
  phase3Data: null,
  phase4Data: null,
  isDirty: false,
  isSaving: false,
  lastSaved: null,
};

export const useNutritionStore = create<NutritionCalculatorState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setClientId: (clientId, clientName) =>
        set({ clientId, clientName, isDirty: true }),

      setCurrentPhase: (phase) => set({ currentPhase: phase }),

      setStatus: (status) => set({ status, isDirty: true }),

      // Phase data setters
      setPhase1Data: (data) => set({ phase1Data: data, isDirty: true }),

      setPhase2Data: (data) => set({ phase2Data: data, isDirty: true }),

      setPhase3Data: (data) => set({ phase3Data: data, isDirty: true }),

      setPhase4Data: (data) => set({ phase4Data: data, isDirty: true }),

      // Navigation
      nextPhase: () => {
        const { currentPhase, canGoToNextPhase } = get();
        if (canGoToNextPhase()) {
          set({ currentPhase: (currentPhase + 1) as 1 | 2 | 3 | 4 });
        }
      },

      previousPhase: () => {
        const { currentPhase, canGoToPreviousPhase } = get();
        if (canGoToPreviousPhase()) {
          set({ currentPhase: (currentPhase - 1) as 1 | 2 | 3 | 4 });
        }
      },

      canGoToNextPhase: () => {
        const { currentPhase, phase1Data, phase2Data, phase3Data } = get();

        // Can't go beyond phase 4
        if (currentPhase >= 4) return false;

        // Phase 1 must be completed to go to phase 2
        if (currentPhase === 1 && !phase1Data) return false;

        // Phase 2 must be completed to go to phase 3
        if (currentPhase === 2 && !phase2Data) return false;

        // Phase 3 must be completed to go to phase 4
        if (currentPhase === 3 && !phase3Data) return false;

        return true;
      },

      canGoToPreviousPhase: () => {
        const { currentPhase } = get();
        return currentPhase > 1;
      },

      // Plan management
      loadPlan: (plan) =>
        set({
          planId: plan.id,
          clientId: plan.clientId,
          clientName: plan.clientName,
          status: plan.status,
          phase1Data: plan.phase1Data,
          phase2Data: plan.phase2Data || null,
          phase3Data: plan.phase3Data || null,
          phase4Data: plan.phase4Data || null,
          currentPhase: 1,
          isDirty: false,
          isSaving: false,
          lastSaved: new Date(),
        }),

      setPlanId: (id) => set({ planId: id }),

      setSaving: (saving) => set({ isSaving: saving }),

      markSaved: () =>
        set({ isDirty: false, isSaving: false, lastSaved: new Date() }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: 'nutrition-calculator',
      // Only persist plan data, not UI state
      partialize: (state) => ({
        planId: state.planId,
        clientId: state.clientId,
        clientName: state.clientName,
        status: state.status,
        currentPhase: state.currentPhase,
        phase1Data: state.phase1Data,
        phase2Data: state.phase2Data,
        phase3Data: state.phase3Data,
        phase4Data: state.phase4Data,
      }),
    }
  )
);
