'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Loader2,
  Folder,
  FolderOpen,
  Trash2,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Category {
  id: string
  key: string
  label: string
  icon: string
  isCustom: boolean
  parentKey: string | null
  sortOrder: number
}

interface ManageCategoriesModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoriesChanged: () => void
}

// Built-in categories that always exist
const BUILT_IN_CATEGORIES = [
  { key: 'mejeri', label: 'Mejeri' },
  { key: 'kott', label: 'Kött' },
  { key: 'fisk', label: 'Fisk' },
  { key: 'brod', label: 'Bröd' },
  { key: 'frukt', label: 'Frukt' },
  { key: 'gronsaker', label: 'Grönsaker' },
  { key: 'dryck', label: 'Dryck' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'fryst', label: 'Fryst' },
  { key: 'torrvaror', label: 'Torrvaror' },
]

export function ManageCategoriesModal({ isOpen, onClose, onCategoriesChanged }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New category form
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // New subcategory form
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false)

  // Load categories
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/product-categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
        setSubcategories(data.subcategories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsAddingCategory(true)
    setError(null)

    try {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newCategoryName.trim() })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte skapa kategori')
      }

      setNewCategoryName('')
      fetchCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAddingCategory(false)
    }
  }

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedParent) return

    setIsAddingSubcategory(true)
    setError(null)

    try {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newSubcategoryName.trim(),
          parentKey: selectedParent
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte skapa underkategori')
      }

      setNewSubcategoryName('')
      fetchCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAddingSubcategory(false)
    }
  }

  const handleDeleteCategory = async (key: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna kategori?')) return

    try {
      const res = await fetch(`/api/product-categories?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte ta bort kategori')
      }

      fetchCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Combine built-in and custom categories for display
  const allMainCategories = [
    ...BUILT_IN_CATEGORIES.map(c => ({ ...c, isBuiltIn: true })),
    ...categories.filter(c => c.isCustom).map(c => ({ key: c.key, label: c.label, isBuiltIn: false }))
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-gold-primary" />
            <h2 className="text-lg font-semibold">Hantera kategorier</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Add new category */}
          <div>
            <Label className="text-sm font-medium">Lägg till ny kategori</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="t.ex. Kosttillskott"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button
                onClick={handleAddCategory}
                disabled={isAddingCategory || !newCategoryName.trim()}
                className="bg-gold-primary hover:bg-gold-primary/90 text-black"
              >
                {isAddingCategory ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Categories list */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Kategorier</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-1">
                {allMainCategories.map(cat => {
                  const subs = subcategories.filter(s => s.parentKey === cat.key)
                  const isSelected = selectedParent === cat.key

                  return (
                    <div key={cat.key}>
                      <div
                        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                          isSelected ? 'bg-gold-primary/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <button
                          onClick={() => setSelectedParent(isSelected ? null : cat.key)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          {isSelected ? (
                            <FolderOpen className="w-4 h-4 text-gold-primary" />
                          ) : (
                            <Folder className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium text-gray-900">{cat.label}</span>
                          {cat.isBuiltIn && (
                            <span className="text-xs text-gray-400">(inbyggd)</span>
                          )}
                          {subs.length > 0 && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({subs.length} sub)
                            </span>
                          )}
                        </button>
                        {!cat.isBuiltIn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(cat.key)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {/* Subcategories */}
                      {isSelected && (
                        <div className="ml-6 mt-1 space-y-1">
                          {subs.map(sub => (
                            <div
                              key={sub.key}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700">{sub.label}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCategory(sub.key)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}

                          {/* Add subcategory input */}
                          <div className="flex gap-2 mt-2">
                            <Input
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                              placeholder="Ny underkategori..."
                              className="text-sm h-8"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory()}
                            />
                            <Button
                              onClick={handleAddSubcategory}
                              disabled={isAddingSubcategory || !newSubcategoryName.trim()}
                              size="sm"
                              className="h-8 bg-gray-800 hover:bg-gray-700 text-white"
                            >
                              {isAddingSubcategory ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
            <p className="font-medium">Tips:</p>
            <ul className="mt-1 space-y-1 text-blue-600">
              <li>Klicka på en kategori för att lägga till underkategorier</li>
              <li>Inbyggda kategorier kan inte tas bort</li>
              <li>Egna kategorier visas i produktbiblioteket</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <Button onClick={onClose} className="w-full">
            Stäng
          </Button>
        </div>
      </div>
    </div>
  )
}
