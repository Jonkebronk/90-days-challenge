'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Button } from '@/components/ui/button'
import { CatalogSidebar } from './CatalogSidebar'
import { CatalogDetail } from './CatalogDetail'
import { CatalogSchemaEditor } from './editor'
import {
  CatalogCategory,
  CatalogSchema,
  ApiCatalogCategory,
  ApiCatalogSchema,
  mapApiSchemaToSchema,
  mapApiCategoryToCategory
} from '@/lib/kostschema/catalog'
import { BookOpen, Loader2, Plus } from 'lucide-react'

interface MealPlanCatalogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientKcal?: number
}

export function MealPlanCatalog({ open, onOpenChange, clientKcal }: MealPlanCatalogProps) {
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null)
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [schemas, setSchemas] = useState<CatalogSchema[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSchemaId, setEditingSchemaId] = useState<string | null>(null)

  // Fetch data from API
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (hasFetched && !forceRefresh) return

    try {
      setIsLoading(true)
      const res = await fetch('/api/catalog/categories')

      if (res.ok) {
        const data = await res.json()
        const apiCategories: ApiCatalogCategory[] = data.categories || []

        // Map API categories
        const mappedCategories = apiCategories.map(mapApiCategoryToCategory)
        setCategories(mappedCategories)

        // Fetch full schema data for each category's schemas
        const allSchemas: CatalogSchema[] = []
        for (const cat of apiCategories) {
          if (cat.schemas) {
            for (const schema of cat.schemas) {
              // Fetch full schema with meals and foods
              const schemaRes = await fetch(`/api/catalog/schemas/${schema.id}`)
              if (schemaRes.ok) {
                const schemaData = await schemaRes.json()
                const apiSchema: ApiCatalogSchema = schemaData.schema
                allSchemas.push(mapApiSchemaToSchema(apiSchema))
              }
            }
          }
        }

        setSchemas(allSchemas)
      }
    } catch (error) {
      console.error('Error fetching catalog data:', error)
    } finally {
      setIsLoading(false)
      setHasFetched(true)
    }
  }, [hasFetched])

  // Fetch when sheet opens
  useEffect(() => {
    if (open && !hasFetched) {
      fetchData()
    }
  }, [open, hasFetched, fetchData])

  const selectedSchema = selectedSchemaId
    ? schemas.find(s => s.id === selectedSchemaId)
    : null

  // Handle creating new schema
  const handleCreateSchema = () => {
    setEditingSchemaId(null)
    setEditorOpen(true)
  }

  // Handle editing existing schema
  const handleEditSchema = (schemaId: string) => {
    setEditingSchemaId(schemaId)
    setEditorOpen(true)
  }

  // Handle save - refresh data
  const handleEditorSave = () => {
    setHasFetched(false)
    fetchData(true)
  }

  // Get categories for editor (from API format)
  const editorCategories = categories.map(c => ({ id: c.id, name: c.name }))

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          side="right"
          className="w-full max-w-5xl sm:max-w-6xl p-0 flex flex-col shadow-2xl"
          hideOverlay
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="px-6 py-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
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
              <Button onClick={handleCreateSchema} className="bg-gold-primary hover:bg-gold-primary/90 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Nytt schema
              </Button>
            </div>
          </SheetHeader>

          {/* Mobile: Dropdown selector */}
          <div className="lg:hidden px-4 py-3 border-b border-gray-200 bg-gray-50">
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-gold-primary" />
                <span className="ml-2 text-sm text-gray-500">Laddar scheman...</span>
              </div>
            ) : schemas.length === 0 ? (
              <div className="text-center py-2 text-sm text-gray-500">
                Inga scheman. Klicka &quot;Nytt schema&quot; för att skapa.
              </div>
            ) : (
              <Select
                value={selectedSchemaId || ''}
                onValueChange={(value) => setSelectedSchemaId(value)}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Välj ett kostschema..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => {
                    const categorySchemas = schemas.filter(
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
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Desktop: Sidebar */}
            <div className="hidden lg:block">
              <CatalogSidebar
                categories={categories}
                schemas={schemas}
                selectedSchemaId={selectedSchemaId}
                onSelectSchema={setSelectedSchemaId}
                isLoading={isLoading}
              />
            </div>

            {/* Detail View */}
            <CatalogDetail
              schema={selectedSchema || null}
              clientKcal={clientKcal}
              onEditSchema={handleEditSchema}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Schema Editor */}
      <CatalogSchemaEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        schemaId={editingSchemaId}
        categories={editorCategories}
        onSave={handleEditorSave}
      />
    </>
  )
}
