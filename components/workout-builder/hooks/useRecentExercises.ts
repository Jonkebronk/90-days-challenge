import { useState, useEffect, useCallback } from 'react'
import { Exercise } from '../types'

const STORAGE_KEY = 'recent-exercises'
const MAX_RECENT = 5

interface RecentExerciseEntry {
  exerciseId: string
  lastUsed: string
}

/**
 * Hook for managing recently used exercises in localStorage
 */
export function useRecentExercises(allExercises: Exercise[]) {
  const [recentIds, setRecentIds] = useState<string[]>([])

  // Load recent exercises from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const entries: RecentExerciseEntry[] = JSON.parse(stored)
        // Sort by most recent first
        entries.sort((a, b) =>
          new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        )
        setRecentIds(entries.slice(0, MAX_RECENT).map(e => e.exerciseId))
      }
    } catch (error) {
      console.error('Failed to load recent exercises:', error)
    }
  }, [])

  // Add an exercise to recent list
  const addRecentExercise = useCallback((exerciseId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      let entries: RecentExerciseEntry[] = stored ? JSON.parse(stored) : []

      // Remove existing entry for this exercise
      entries = entries.filter(e => e.exerciseId !== exerciseId)

      // Add new entry at the beginning
      entries.unshift({
        exerciseId,
        lastUsed: new Date().toISOString()
      })

      // Keep only MAX_RECENT entries
      entries = entries.slice(0, MAX_RECENT)

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))

      // Update state
      setRecentIds(entries.map(e => e.exerciseId))
    } catch (error) {
      console.error('Failed to save recent exercise:', error)
    }
  }, [])

  // Get full exercise objects for recent exercises
  const recentExercises = allExercises.filter(ex =>
    recentIds.includes(ex.id)
  ).sort((a, b) =>
    recentIds.indexOf(a.id) - recentIds.indexOf(b.id)
  )

  // Clear all recent exercises
  const clearRecentExercises = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setRecentIds([])
    } catch (error) {
      console.error('Failed to clear recent exercises:', error)
    }
  }, [])

  return {
    recentExercises,
    addRecentExercise,
    clearRecentExercises
  }
}
