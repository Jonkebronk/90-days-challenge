/**
 * Smart Meal Planner Page
 * Route: /dashboard/tools/meal-planner
 */

import { SmartMealPlanner } from '@/components/smart-meal-planner'

export const metadata = {
  title: 'Måltidsplanerare | 90 Days Challenge',
  description: 'Hitta recept och generera måltidsplaner baserat på dina makromål'
}

export default function MealPlannerPage() {
  return (
    <div className="container py-8">
      <SmartMealPlanner />
    </div>
  )
}
