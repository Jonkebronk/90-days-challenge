'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Loader2,
  Folder,
  FolderOpen,
  Trash2,
  ChevronRight,
  ChevronDown,
  Pencil,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SUBCATEGORIES_BY_CATEGORY } from '@/lib/products/subcategories'

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

  // Expanded categories (to show subcategories)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // New subcategory form
  const [addingSubcategoryTo, setAddingSubcategoryTo] = useState<string | null>(null)
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false)

  // Editing state
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

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

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
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

  const handleAddSubcategory = async (parentKey: string) => {
    if (!newSubcategoryName.trim()) return

    setIsAddingSubcategory(true)
    setError(null)

    try {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newSubcategoryName.trim(),
          parentKey: parentKey
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte skapa underkategori')
      }

      setNewSubcategoryName('')
      setAddingSubcategoryTo(null)
      fetchCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAddingSubcategory(false)
    }
  }

  const handleDeleteCategory = async (key: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna?')) return

    try {
      const res = await fetch(`/api/product-categories?key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte ta bort')
      }

      fetchCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const startEditing = (key: string, label: string) => {
    setEditingKey(key)
    setEditingLabel(label)
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditingLabel('')
  }

  const saveEdit = async () => {
    if (!editingKey || !editingLabel.trim()) return

    setIsSavingEdit(true)
    setError(null)

    try {
      const res = await fetch('/api/product-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: editingKey,
          label: editingLabel.trim()
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kunde inte uppdatera')
      }

      cancelEditing()
      fetchCategories()
      onCategoriesChanged()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Get all subcategories for a category (both from DB and hardcoded)
  const getSubcategoriesForCategory = (categoryKey: string) => {
    // DB subcategories
    const dbSubs = subcategories.filter(s => s.parentKey === categoryKey)

    // Hardcoded subcategories
    const hardcodedSubs = SUBCATEGORIES_BY_CATEGORY[categoryKey.toLowerCase()] || []

    // Merge - use DB version if exists, otherwise use hardcoded
    const mergedMap = new Map<string, { key: string; label: string; isHardcoded: boolean }>()

    // Add hardcoded first
    for (const sub of hardcodedSubs) {
      mergedMap.set(sub.key, { key: sub.key, label: sub.label, isHardcoded: true })
    }

    // Override with DB versions
    for (const sub of dbSubs) {
      mergedMap.set(sub.key, { key: sub.key, label: sub.label, isHardcoded: false })
    }

    return Array.from(mergedMap.values())
  }

  // Combine built-in and custom categories for display
  const allMainCategories = [
    ...BUILT_IN_CATEGORIES.map(c => {
      // Check if there's a DB override for the label
      const dbCat = categories.find(cat => cat.key === c.key)
      return {
        key: c.key,
        label: dbCat?.label || c.label,
        isBuiltIn: true,
        hasDbOverride: !!dbCat
      }
    }),
    ...categories.filter(c => c.isCustom && !c.parentKey).map(c => ({
      key: c.key,
      label: c.label,
      isBuiltIn: false,
      hasDbOverride: true
    }))
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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Add new category */}
          <div className="bg-gray-50 rounded-lg p-3">
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
            <Label className="text-sm font-medium mb-2 block">Kategorier & Underkategorier</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-1">
                {allMainCategories.map(cat => {
                  const subs = getSubcategoriesForCategory(cat.key)
                  const isExpanded = expandedCategories.has(cat.key)
                  const isEditing = editingKey === cat.key

                  return (
                    <div key={cat.key} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Category header */}
                      <div className="flex items-center justify-between p-2 bg-gray-50">
                        <button
                          onClick={() => toggleCategory(cat.key)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          {isExpanded ? (
                            <FolderOpen className="w-4 h-4 text-gold-primary" />
                          ) : (
                            <Folder className="w-4 h-4 text-gray-400" />
                          )}

                          {isEditing ? (
                            <Input
                              value={editingLabel}
                              onChange={(e) => setEditingLabel(e.target.value)}
                              className="h-7 text-sm w-32"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation()
                                if (e.key === 'Enter') saveEdit()
                                if (e.key === 'Escape') cancelEditing()
                              }}
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-gray-900">{cat.label}</span>
                          )}

                          {subs.length > 0 && !isExpanded && (
                            <span className="text-xs text-gray-400">
                              ({subs.length} underkategorier)
                            </span>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveEdit}
                                disabled={isSavingEdit}
                                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                {isSavingEdit ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditing}
                                className="h-7 w-7 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditing(cat.key, cat.label)
                                }}
                                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              {!cat.isBuiltIn && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCategory(cat.key)
                                  }}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Subcategories */}
                      {isExpanded && (
                        <div className="p-2 pt-0 space-y-1">
                          {subs.length === 0 ? (
                            <p className="text-xs text-gray-400 py-2 pl-10">Inga underkategorier</p>
                          ) : (
                            subs.map(sub => {
                              const isSubEditing = editingKey === sub.key

                              return (
                                <div
                                  key={sub.key}
                                  className="flex items-center justify-between py-1.5 px-2 ml-6 bg-white rounded border border-gray-100"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="w-3 h-3 text-gray-300" />
                                    {isSubEditing ? (
                                      <Input
                                        value={editingLabel}
                                        onChange={(e) => setEditingLabel(e.target.value)}
                                        className="h-6 text-sm w-28"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEdit()
                                          if (e.key === 'Escape') cancelEditing()
                                        }}
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="text-sm text-gray-700">{sub.label}</span>
                                    )}
                                    {sub.isHardcoded && !isSubEditing && (
                                      <span className="text-[10px] text-gray-400">(standard)</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {isSubEditing ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={saveEdit}
                                          disabled={isSavingEdit}
                                          className="h-6 w-6 p-0 text-green-600"
                                        >
                                          {isSavingEdit ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={cancelEditing}
                                          className="h-6 w-6 p-0 text-gray-400"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => startEditing(sub.key, sub.label)}
                                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        {!sub.isHardcoded && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(sub.key)}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}

                          {/* Add subcategory */}
                          {addingSubcategoryTo === cat.key ? (
                            <div className="flex gap-2 ml-6 mt-2">
                              <Input
                                value={newSubcategoryName}
                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                placeholder="Ny underkategori..."
                                className="text-sm h-8"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddSubcategory(cat.key)
                                  if (e.key === 'Escape') {
                                    setAddingSubcategoryTo(null)
                                    setNewSubcategoryName('')
                                  }
                                }}
                                autoFocus
                              />
                              <Button
                                onClick={() => handleAddSubcategory(cat.key)}
                                disabled={isAddingSubcategory || !newSubcategoryName.trim()}
                                size="sm"
                                className="h-8 bg-gray-800 hover:bg-gray-700 text-white"
                              >
                                {isAddingSubcategory ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                onClick={() => {
                                  setAddingSubcategoryTo(null)
                                  setNewSubcategoryName('')
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingSubcategoryTo(cat.key)}
                              className="flex items-center gap-2 ml-6 mt-2 text-xs text-gray-500 hover:text-gray-700"
                            >
                              <Plus className="w-3 h-3" />
                              Lägg till underkategori
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
