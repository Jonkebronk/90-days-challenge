'use client'

import { CatalogCategory, CatalogSchema } from '@/lib/kostschema/catalog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface CatalogSidebarProps {
  categories: CatalogCategory[]
  schemas: CatalogSchema[]
  selectedSchemaId: string | null
  onSelectSchema: (schemaId: string) => void
  isLoading?: boolean
}

export function CatalogSidebar({
  categories,
  schemas,
  selectedSchemaId,
  onSelectSchema,
  isLoading = false
}: CatalogSidebarProps) {
  const getSchemasByCategory = (categoryId: string) => {
    return schemas
      .filter(s => s.categoryId === categoryId)
      .sort((a, b) => a.calorieLevel - b.calorieLevel)
  }

  // Find which category contains the selected schema
  const selectedSchema = schemas.find(s => s.id === selectedSchemaId)
  const defaultOpenCategory = selectedSchema?.categoryId || categories[0]?.id

  return (
    <div className="w-72 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Kategorier</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {isLoading ? 'Laddar...' : `${schemas.length} scheman tillgängliga`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gold-primary" />
        </div>
      ) : (
      <ScrollArea className="flex-1">
        <Accordion
          type="single"
          collapsible
          defaultValue={defaultOpenCategory}
          className="px-2 py-2"
        >
          {categories.map((category) => {
            const categorySchemas = getSchemasByCategory(category.id)
            if (categorySchemas.length === 0) return null

            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border-none"
              >
                <AccordionTrigger className="py-3 px-3 hover:bg-gray-100 rounded-lg hover:no-underline">
                  <div className="flex items-center gap-2 text-left">
                    <span className="font-medium text-gray-900">
                      {category.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {categorySchemas.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="space-y-1 ml-2">
                    {categorySchemas.map((schema) => (
                      <button
                        key={schema.id}
                        onClick={() => onSelectSchema(schema.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                          selectedSchemaId === schema.id
                            ? "bg-gold-primary/10 border border-gold-primary/30 text-gray-900"
                            : "hover:bg-gray-100 text-gray-700"
                        )}
                      >
                        <span className="text-sm font-medium truncate pr-2">
                          {schema.calorieLevel} kcal
                        </span>
                        <div className="flex items-center gap-1.5 text-xs shrink-0">
                          <span className="text-red-600">{schema.totals.protein}P</span>
                          <span className="text-amber-600">{schema.totals.carbs}K</span>
                          <span className="text-blue-600">{schema.totals.fat}F</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>
      )}

      {/* Legend */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
          <span><span className="text-red-600 font-medium">P</span> = Protein</span>
          <span><span className="text-amber-600 font-medium">K</span> = Kolhydrat</span>
          <span><span className="text-blue-600 font-medium">F</span> = Fett</span>
        </div>
      </div>
    </div>
  )
}
