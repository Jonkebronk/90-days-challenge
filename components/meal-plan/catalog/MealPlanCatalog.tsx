'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { CatalogSidebar } from './CatalogSidebar'
import { CatalogDetail } from './CatalogDetail'
import {
  CATALOG_CATEGORIES,
  CATALOG_SCHEMAS,
  getSchemaById
} from '@/lib/kostschema/catalog'
import { BookOpen } from 'lucide-react'

interface MealPlanCatalogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientKcal?: number
}

export function MealPlanCatalog({ open, onOpenChange, clientKcal }: MealPlanCatalogProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null)

  const selectedSchema = selectedSchemaId ? getSchemaById(selectedSchemaId) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        side="right"
        className="w-full max-w-5xl sm:max-w-6xl p-0 flex flex-col shadow-2xl"
        hideOverlay
      >
        <SheetHeader className="px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gold-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Kostschema-katalog</SheetTitle>
              <SheetDescription>
                Inspirerande kostscheman för olika kalorimål och kosttyper
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Mobile: Dropdown selector */}
        <div className="lg:hidden px-4 py-3 border-b border-gray-200 bg-gray-50">
          <Select
            value={selectedSchemaId || ''}
            onValueChange={(value) => setSelectedSchemaId(value)}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Välj ett kostschema..." />
            </SelectTrigger>
            <SelectContent>
              {CATALOG_CATEGORIES.map((category) => {
                const categorySchemas = CATALOG_SCHEMAS.filter(
                  s => s.categoryId === category.id
                ).sort((a, b) => a.calorieLevel - b.calorieLevel)

                if (categorySchemas.length === 0) return null

                return (
                  <div key={category.id}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                      {category.name}
                    </div>
                    {categorySchemas.map((schema) => (
                      <SelectItem key={schema.id} value={schema.id}>
                        {schema.name}
                      </SelectItem>
                    ))}
                  </div>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop: Sidebar */}
          <div className="hidden lg:block">
            <CatalogSidebar
              categories={CATALOG_CATEGORIES}
              schemas={CATALOG_SCHEMAS}
              selectedSchemaId={selectedSchemaId}
              onSelectSchema={setSelectedSchemaId}
            />
          </div>

          {/* Detail View */}
          <CatalogDetail
            schema={selectedSchema || null}
            clientKcal={clientKcal}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
