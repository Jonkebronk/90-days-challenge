'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2, User, Calendar, Import, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EditorMeal, EditorFood } from './MealEditor'

interface ClientSchema {
  id: string
  name: string
  clientId: string
  clientName: string
  status: string
  mealCount: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalKcal: number
  meals: any[]
  createdAt: string
  updatedAt: string
}

interface ClientSchemasBrowserProps {
  onImport: (meals: EditorMeal[]) => void
}

export function ClientSchemasBrowser({ onImport }: ClientSchemasBrowserProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [schemas, setSchemas] = useState<ClientSchema[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSchemaId, setExpandedSchemaId] = useState<string | null>(null)

  useEffect(() => {
    fetchClientSchemas()
  }, [])

  const fetchClientSchemas = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/catalog/client-schemas')
      if (res.ok) {
        const data = await res.json()
        setSchemas(data.plans || [])
      }
    } catch (error) {
      console.error('Error fetching client schemas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSchemas = schemas.filter((schema) =>
    schema.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    schema.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleImport = (schema: ClientSchema) => {
    // Convert client schema meals to editor format
    const editorMeals: EditorMeal[] = (schema.meals || []).map((meal: any, mealIdx: number) => ({
      id: `imported-meal-${Date.now()}-${mealIdx}`,
      name: meal.name || 'Måltid',
      time: meal.time || '12:00',
      foods: (meal.foods || []).map((food: any, foodIdx: number) => ({
        id: `imported-food-${Date.now()}-${mealIdx}-${foodIdx}`,
        name: food.name || '',
        amountG: food.amountG || food.amount || 100,
        category: mapFoodCategory(food.category),
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        kcal: food.kcal || food.calories || 0,
      })),
    }))

    onImport(editorMeals)
  }

  const mapFoodCategory = (category: string | undefined): EditorFood['category'] => {
    if (!category) return 'protein'
    const lower = category.toLowerCase()
    if (lower.includes('protein')) return 'protein'
    if (lower.includes('kolhydrat') || lower.includes('carb')) return 'kolhydrat'
    if (lower.includes('fett') || lower.includes('fat')) return 'fett'
    if (lower.includes('grönsak') || lower.includes('veg')) return 'grönsak'
    return 'protein'
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return ''
    }
  }

  const toggleExpand = (schemaId: string) => {
    setExpandedSchemaId(expandedSchemaId === schemaId ? null : schemaId)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Sök efter klient eller schema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {filteredSchemas.length} scheman hittade
        </p>
      </div>

      {/* Schema List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredSchemas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Inga klientscheman hittades</p>
              <p className="text-sm mt-1">Scheman visas här när du skapar kostplaner för klienter</p>
            </div>
          ) : (
            filteredSchemas.map((schema) => (
              <Card key={schema.id} className="border-gray-200">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold truncate">
                        {schema.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{schema.clientName}</span>
                        <span className="text-gray-300">•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(schema.updatedAt)}</span>
                      </div>
                    </div>
                    <Badge
                      variant={schema.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-xs shrink-0"
                    >
                      {schema.status === 'ACTIVE' ? 'Aktiv' : 'Utkast'}
                    </Badge>
                  </div>

                  {/* Macro Summary */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex gap-2 text-xs">
                      <span className="text-red-600 font-medium">{schema.totalProtein}P</span>
                      <span className="text-amber-600 font-medium">{schema.totalCarbs}K</span>
                      <span className="text-blue-600 font-medium">{schema.totalFat}F</span>
                      <span className="font-medium">{schema.totalKcal} kcal</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {schema.mealCount} måltider
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="py-0 px-4 pb-3">
                  {/* Expandable meals preview */}
                  <button
                    onClick={() => toggleExpand(schema.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
                  >
                    {expandedSchemaId === schema.id ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Dölj måltider
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        Visa måltider
                      </>
                    )}
                  </button>

                  {expandedSchemaId === schema.id && (
                    <div className="space-y-2 mb-3 pl-2 border-l-2 border-gray-100">
                      {(schema.meals || []).map((meal: any, idx: number) => (
                        <div key={idx} className="text-xs">
                          <span className="font-medium text-gray-700">{meal.name}</span>
                          {meal.time && (
                            <span className="text-gray-400 ml-1">({meal.time})</span>
                          )}
                          <span className="text-gray-400 ml-2">
                            {(meal.foods || []).length} livsmedel
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Import Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleImport(schema)}
                    className="w-full"
                  >
                    <Import className="w-4 h-4 mr-2" />
                    Importera till schema
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
