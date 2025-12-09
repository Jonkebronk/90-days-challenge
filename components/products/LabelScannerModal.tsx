'use client'

import { useState, useRef } from 'react'
import { X, Camera, Loader2, Check, SkipForward } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface ScannedProduct {
  name: string | null
  brand: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number | null
  sugar: number | null
  salt: number | null
  image: string | null
}

interface LabelScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
}

const CATEGORIES = [
  { id: 'mejeri', label: 'Mejeri' },
  { id: 'kött', label: 'Kött' },
  { id: 'fisk', label: 'Fisk' },
  { id: 'bröd', label: 'Bröd' },
  { id: 'frukt', label: 'Frukt' },
  { id: 'grönsaker', label: 'Grönsaker' },
  { id: 'dryck', label: 'Dryck' },
  { id: 'snacks', label: 'Snacks' },
  { id: 'fryst', label: 'Fryst' },
  { id: 'torrvaror', label: 'Torrvaror' },
]

type Step = 'label' | 'product' | 'review'

export function LabelScannerModal({ isOpen, onClose, onProductAdded }: LabelScannerModalProps) {
  const labelInputRef = useRef<HTMLInputElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('label')
  const [labelImage, setLabelImage] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('medium')
  const [notes, setNotes] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    ean: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    salt: ''
  })

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handle label image selection
  const handleLabelImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await fileToBase64(file)
      setLabelImage(base64)
      setStep('product')
    } catch (error) {
      console.error('Error reading file:', error)
      toast.error('Kunde inte läsa bilden')
    }
  }

  // Handle product image selection
  const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await fileToBase64(file)
      setProductImage(base64)
      analyzeLabel()
    } catch (error) {
      console.error('Error reading file:', error)
      toast.error('Kunde inte läsa bilden')
      analyzeLabel() // Continue anyway
    }
  }

  // Skip product image
  const handleSkipProductImage = () => {
    analyzeLabel()
  }

  // Analyze label with AI
  const analyzeLabel = async () => {
    if (!labelImage) return

    setStep('review')
    setIsAnalyzing(true)

    try {
      const res = await fetch('/api/products/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          labelImage,
          productImage
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to analyze label')
      }

      const data = await res.json()
      const product = data.product

      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: '',
        ean: '',
        kcal: product.kcal?.toString() || '',
        protein: product.protein?.toString() || '',
        carbs: product.carbs?.toString() || '',
        fat: product.fat?.toString() || '',
        fiber: product.fiber?.toString() || '',
        sugar: product.sugar?.toString() || '',
        salt: product.salt?.toString() || ''
      })
      setConfidence(data.confidence || 'medium')
      setNotes(data.notes || '')
    } catch (error: any) {
      console.error('Analysis error:', error)
      toast.error('Kunde inte analysera etiketten', { description: error.message })
      // Still show review step for manual input
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Generate auto EAN
  const generateAutoEAN = () => {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    setFormData(prev => ({ ...prev, ean: `MANUAL-${timestamp}-${random}` }))
  }

  // Save product
  const handleSaveProduct = async () => {
    if (!formData.name) {
      toast.error('Produktnamn krävs')
      return
    }
    if (!formData.ean) {
      toast.error('EAN krävs - generera automatiskt eller ange manuellt')
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ean: formData.ean,
          name: formData.name,
          brand: formData.brand || null,
          category: formData.category || null,
          image: productImage || null,
          kcal: parseFloat(formData.kcal) || 0,
          protein: parseFloat(formData.protein) || 0,
          carbs: parseFloat(formData.carbs) || 0,
          fat: parseFloat(formData.fat) || 0,
          fiber: formData.fiber ? parseFloat(formData.fiber) : null,
          sugar: formData.sugar ? parseFloat(formData.sugar) : null,
          salt: formData.salt ? parseFloat(formData.salt) : null,
          source: 'label-scan'
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save product')
      }

      toast.success('Produkt sparad!', { description: formData.name })
      onProductAdded()
      handleClose()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('Kunde inte spara produkten', { description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset and close
  const handleClose = () => {
    setStep('label')
    setLabelImage(null)
    setProductImage(null)
    setFormData({
      name: '', brand: '', category: '', ean: '',
      kcal: '', protein: '', carbs: '', fat: '',
      fiber: '', sugar: '', salt: ''
    })
    setConfidence('medium')
    setNotes('')
    // Reset file inputs
    if (labelInputRef.current) labelInputRef.current.value = ''
    if (productInputRef.current) productInputRef.current.value = ''
    onClose()
  }

  const confidenceColors = {
    high: 'text-emerald-500',
    medium: 'text-amber-500',
    low: 'text-red-500'
  }

  const confidenceLabels = {
    high: 'Hög konfidens',
    medium: 'Medium konfidens',
    low: 'Låg konfidens'
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-700 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-white">Lägg till produkt</h2>
            <p className="text-xs text-zinc-400">
              Steg {step === 'label' ? '1' : step === 'product' ? '2' : '3'} av 3
            </p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Step 1: Capture Label */}
        {step === 'label' && (
          <div className="p-4 space-y-4">
            <p className="text-center text-zinc-300">
              Fotografera näringsetiketten (per 100g)
            </p>

            {/* Hidden file input */}
            <input
              ref={labelInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleLabelImageChange}
              className="hidden"
            />

            {/* Camera button area */}
            <div
              onClick={() => labelInputRef.current?.click()}
              className="relative aspect-[4/3] bg-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:bg-zinc-700 transition-colors flex flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-600"
            >
              <Camera className="w-16 h-16 text-zinc-400" />
              <p className="text-zinc-400 text-sm">Tryck för att ta foto</p>
            </div>

            <Button
              onClick={() => labelInputRef.current?.click()}
              className="w-full bg-gold-600 hover:bg-gold-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Öppna kamera
            </Button>
          </div>
        )}

        {/* Step 2: Capture Product Image */}
        {step === 'product' && (
          <div className="p-4 space-y-4">
            <p className="text-center text-zinc-300">
              Fotografera produkten (valfritt)
            </p>

            {/* Hidden file input */}
            <input
              ref={productInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleProductImageChange}
              className="hidden"
            />

            {/* Preview of label image */}
            {labelImage && (
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-600">
                  <img src={labelImage} alt="Etikett" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Camera button area */}
            <div
              onClick={() => productInputRef.current?.click()}
              className="relative aspect-[4/3] bg-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:bg-zinc-700 transition-colors flex flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-600"
            >
              <Camera className="w-16 h-16 text-zinc-400" />
              <p className="text-zinc-400 text-sm">Tryck för att ta foto av produkten</p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => productInputRef.current?.click()}
                className="flex-1 bg-gold-600 hover:bg-gold-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Ta bild
              </Button>
              <Button
                onClick={handleSkipProductImage}
                variant="outline"
                className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Hoppa över
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Save */}
        {step === 'review' && (
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold-500 mb-3" />
                <p className="text-zinc-400">Analyserar näringsetikett...</p>
              </div>
            ) : (
              <>
                {/* Product image preview */}
                <div className="flex gap-4">
                  {productImage && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0">
                      <img src={productImage} alt="Produkt" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Produktnamn *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ange produktnamn"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Märke</Label>
                      <Input
                        value={formData.brand}
                        onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="t.ex. ICA, Arla"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-zinc-400 text-xs">Kategori</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-white text-sm"
                  >
                    <option value="">Välj kategori...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Confidence indicator */}
                {confidence && (
                  <div className={`flex items-center gap-2 text-sm ${confidenceColors[confidence]}`}>
                    <Check className="w-4 h-4" />
                    {confidenceLabels[confidence]}
                    {notes && <span className="text-zinc-500">- {notes}</span>}
                  </div>
                )}

                {/* Nutrition values */}
                <div className="border-t border-zinc-700 pt-4">
                  <p className="text-sm font-medium text-zinc-300 mb-3">Näringsvärden per 100g</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-zinc-400 text-xs">Kalorier (kcal)</Label>
                      <Input
                        type="number"
                        value={formData.kcal}
                        onChange={(e) => setFormData(prev => ({ ...prev, kcal: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Protein (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.protein}
                        onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Kolhydrater (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.carbs}
                        onChange={(e) => setFormData(prev => ({ ...prev, carbs: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Fett (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.fat}
                        onChange={(e) => setFormData(prev => ({ ...prev, fat: e.target.value }))}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Fiber (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.fiber}
                        onChange={(e) => setFormData(prev => ({ ...prev, fiber: e.target.value }))}
                        placeholder="Valfritt"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400 text-xs">Socker (g)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.sugar}
                        onChange={(e) => setFormData(prev => ({ ...prev, sugar: e.target.value }))}
                        placeholder="Valfritt"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* EAN */}
                <div className="border-t border-zinc-700 pt-4">
                  <Label className="text-zinc-400 text-xs">EAN / Streckkod *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={formData.ean}
                      onChange={(e) => setFormData(prev => ({ ...prev, ean: e.target.value }))}
                      placeholder="Ange eller generera"
                      className="bg-zinc-800 border-zinc-700 text-white flex-1"
                    />
                    <Button
                      type="button"
                      onClick={generateAutoEAN}
                      variant="outline"
                      className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      Auto
                    </Button>
                  </div>
                </div>

                {/* Save button */}
                <Button
                  onClick={handleSaveProduct}
                  disabled={isSaving || !formData.name || !formData.ean}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Spara produkt
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
