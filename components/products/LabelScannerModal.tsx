'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Camera, Loader2, Check, SkipForward, AlertCircle, RefreshCw } from 'lucide-react'
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [step, setStep] = useState<Step>('label')
  const [labelImage, setLabelImage] = useState<string | null>(null)
  const [productImage, setProductImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
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

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsScanning(true)
    } catch (error: any) {
      console.error('Camera error:', error)
      setCameraError(error.name === 'NotAllowedError'
        ? 'Kameratillstånd nekades. Tillåt kameraåtkomst i webbläsaren.'
        : 'Kunde inte starta kameran. Kontrollera att enheten har en kamera.')
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  // Capture image from video
  const captureImage = useCallback((): string | null => {
    const video = videoRef.current
    if (!video) return null

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.9)
  }, [])

  // Handle label capture
  const handleCaptureLabelImage = async () => {
    const image = captureImage()
    if (!image) return

    setLabelImage(image)
    stopCamera()
    setStep('product')

    // Pre-start camera for next step
    setTimeout(() => startCamera(), 100)
  }

  // Handle product image capture
  const handleCaptureProductImage = () => {
    const image = captureImage()
    if (image) {
      setProductImage(image)
    }
    stopCamera()
    analyzeLabel()
  }

  // Skip product image
  const handleSkipProductImage = () => {
    stopCamera()
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
    stopCamera()
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
    setCameraError(null)
    onClose()
  }

  // Start camera when modal opens and we're on camera steps
  useEffect(() => {
    if (isOpen && (step === 'label' || step === 'product')) {
      startCamera()
    }
    return () => {
      if (!isOpen) stopCamera()
    }
  }, [isOpen, step, startCamera, stopCamera])

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

            {cameraError ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <AlertCircle className="w-12 h-12 mb-3 text-red-400" />
                <p className="text-center text-sm">{cameraError}</p>
                <Button onClick={startCamera} variant="outline" className="mt-4">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Försök igen
                </Button>
              </div>
            ) : (
              <>
                <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                  {/* Scanning overlay */}
                  <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg pointer-events-none" />
                </div>

                <Button
                  onClick={handleCaptureLabelImage}
                  disabled={!isScanning}
                  className="w-full bg-gold-600 hover:bg-gold-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Ta bild
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Capture Product Image */}
        {step === 'product' && (
          <div className="p-4 space-y-4">
            <p className="text-center text-zinc-300">
              Fotografera produkten (valfritt)
            </p>

            <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCaptureProductImage}
                disabled={!isScanning}
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
