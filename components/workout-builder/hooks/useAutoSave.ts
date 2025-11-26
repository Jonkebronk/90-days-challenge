import { useEffect, useRef, useCallback } from 'react'

/**
 * Auto-save hook that triggers a save callback at regular intervals
 * when data has changed
 */
export function useAutoSave<T>(
  data: T,
  onSave: (data: T) => Promise<void> | void,
  delay: number = 30000, // Default 30 seconds
  enabled: boolean = true
) {
  const lastSavedRef = useRef<string>('')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)

  const save = useCallback(async () => {
    if (isSavingRef.current) return

    const currentData = JSON.stringify(data)
    if (currentData === lastSavedRef.current) return

    isSavingRef.current = true
    try {
      await onSave(data)
      lastSavedRef.current = currentData
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      isSavingRef.current = false
    }
  }, [data, onSave])

  // Set up interval-based auto-save
  useEffect(() => {
    if (!enabled) return

    timeoutRef.current = setInterval(() => {
      save()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current)
      }
    }
  }, [save, delay, enabled])

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      const currentData = JSON.stringify(data)
      if (currentData !== lastSavedRef.current && enabled) {
        // Synchronous save attempt on unmount
        onSave(data)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Manual save trigger
  const triggerSave = useCallback(() => {
    save()
  }, [save])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(data) !== lastSavedRef.current
  }, [data])

  // Reset saved state (useful after external save)
  const markAsSaved = useCallback(() => {
    lastSavedRef.current = JSON.stringify(data)
  }, [data])

  return {
    triggerSave,
    hasUnsavedChanges,
    markAsSaved,
    isSaving: isSavingRef.current
  }
}
