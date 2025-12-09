'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Barcode, Camera, Loader2, Check, X, Plus, Search, AlertCircle, Database, Globe, ScanLine } from 'lucide-react'
import { useFoodLogStore, Product } from '@/lib/stores/food-log-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Type for native BarcodeDetector API
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string; format: string }>>
    }
  }
}

interface OpenFoodFactsProduct {
  code: string
  product_name: string
  brands?: string
  nutriments: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
  image_url?: string
}

export function BarcodeScannerTab() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationRef = useRef<number | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualEan, setManualEan] = useState('')
  const [foundProduct, setFoundProduct] = useState<Product | null>(null)
  const [offProduct, setOffProduct] = useState<OpenFoodFactsProduct | null>(null)
  const [portionG, setPortionG] = useState('100')
  const [notFound, setNotFound] = useState(false)
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [hasNativeSupport, setHasNativeSupport] = useState(false)

  const { isLoading, lookupProduct, createLog, cacheProduct } = useFoodLogStore()

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  // Check for native BarcodeDetector support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      setHasNativeSupport(true)
    }
  }, [])

  // Stop scanner
  const stopScanner = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopScanner()
  }, [stopScanner])

  // Search Open Food Facts
  const searchOpenFoodFacts = async (ean: string): Promise<OpenFoodFactsProduct | null> => {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${ean}.json`)
      if (!res.ok) return null

      const data = await res.json()
      if (data.status !== 1 || !data.product) return null

      return {
        code: data.code,
        product_name: data.product.product_name || data.product.product_name_sv || 'Okänd produkt',
        brands: data.product.brands,
        nutriments: data.product.nutriments || {},
        image_url: data.product.image_url
      }
    } catch (error) {
      console.error('Open Food Facts lookup failed:', error)
      return null
    }
  }

  const handleEanLookup = async (ean: string) => {
    setNotFound(false)
    setFoundProduct(null)
    setOffProduct(null)
    setManualEan(ean)
    setIsLookingUp(true)

    try {
      // First check local database
      const localProduct = await lookupProduct(ean)
      if (localProduct) {
        setFoundProduct(localProduct)
        setIsLookingUp(false)
        return
      }

      // Then check Open Food Facts
      const offResult = await searchOpenFoodFacts(ean)
      if (offResult && offResult.product_name) {
        setOffProduct(offResult)
        setIsLookingUp(false)
        return
      }

      // Not found anywhere
      setNotFound(true)
    } catch (error) {
      console.error('Lookup failed:', error)
      setNotFound(true)
    } finally {
      setIsLookingUp(false)
    }
  }

  // Start native barcode scanning
  const startScanner = async () => {
    setScannerError(null)

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }

      setIsScanning(true)

      // Create BarcodeDetector
      if (!window.BarcodeDetector) {
        throw new Error('BarcodeDetector not supported')
      }

      const detector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
      })

      // Scan loop
      const scanFrame = async () => {
        if (!videoRef.current || !streamRef.current) return

        try {
          const barcodes = await detector.detect(videoRef.current)
          if (barcodes.length > 0) {
            const barcode = barcodes[0]
            stopScanner()
            handleEanLookup(barcode.rawValue)
            return
          }
        } catch (err) {
          // Ignore detection errors, continue scanning
        }

        animationRef.current = requestAnimationFrame(scanFrame)
      }

      animationRef.current = requestAnimationFrame(scanFrame)
    } catch (error: any) {
      console.error('Scanner error:', error)
      setIsScanning(false)

      if (error.name === 'NotAllowedError') {
        setScannerError('Kameraåtkomst nekad. Tillåt kameraåtkomst i inställningar.')
      } else if (error.name === 'NotFoundError') {
        setScannerError('Ingen kamera hittades.')
      } else if (error.message?.includes('BarcodeDetector')) {
        setScannerError('Din webbläsare stödjer inte streckkodsskanning. Ange EAN manuellt.')
      } else {
        setScannerError('Kunde inte starta kameran. Ange EAN manuellt.')
      }
    }
  }

  const handleManualSearch = () => {
    if (manualEan.trim()) {
      handleEanLookup(manualEan.trim())
    }
  }

  const handleLogProduct = async () => {
    if (!foundProduct) return

    const portion = parseFloat(portionG) || 100
    const ratio = portion / 100

    const item = {
      name: foundProduct.name,
      productId: foundProduct.id,
      portionG: portion,
      kcal: Math.round(foundProduct.kcal * ratio),
      protein: Math.round(foundProduct.protein * ratio * 10) / 10,
      carbs: Math.round(foundProduct.carbs * ratio * 10) / 10,
      fat: Math.round(foundProduct.fat * ratio * 10) / 10
    }

    await createLog({
      type: 'barcode',
      items: [item]
    })

    setFoundProduct(null)
    setManualEan('')
    setPortionG('100')
  }

  // Log product from Open Food Facts and save to local DB
  const handleLogOffProduct = async () => {
    if (!offProduct) return

    const portion = parseFloat(portionG) || 100
    const ratio = portion / 100

    const kcal = offProduct.nutriments['energy-kcal_100g'] || 0
    const protein = offProduct.nutriments.proteins_100g || 0
    const carbs = offProduct.nutriments.carbohydrates_100g || 0
    const fat = offProduct.nutriments.fat_100g || 0

    // Save to local database first
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ean: offProduct.code,
          name: offProduct.product_name,
          brand: offProduct.brands || null,
          image: offProduct.image_url || null,
          kcal,
          protein,
          carbs,
          fat,
          source: 'openfoodfacts'
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.product) {
          cacheProduct(data.product)
        }
      }
    } catch (error) {
      console.error('Failed to save product:', error)
    }

    // Log the food
    await createLog({
      type: 'barcode',
      items: [{
        name: offProduct.product_name,
        portionG: portion,
        kcal: Math.round(kcal * ratio),
        protein: Math.round(protein * ratio * 10) / 10,
        carbs: Math.round(carbs * ratio * 10) / 10,
        fat: Math.round(fat * ratio * 10) / 10
      }]
    })

    setOffProduct(null)
    setManualEan('')
    setPortionG('100')
  }

  const handleCreateAndLogProduct = async () => {
    try {
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ean: manualEan,
          name: newProduct.name,
          brand: newProduct.brand || null,
          kcal: parseFloat(newProduct.kcal) || 0,
          protein: parseFloat(newProduct.protein) || 0,
          carbs: parseFloat(newProduct.carbs) || 0,
          fat: parseFloat(newProduct.fat) || 0,
          source: 'manual'
        })
      })

      if (!res.ok) throw new Error('Failed to create product')

      const portion = parseFloat(portionG) || 100
      const ratio = portion / 100

      await createLog({
        type: 'barcode',
        items: [{
          name: newProduct.name,
          portionG: portion,
          kcal: Math.round((parseFloat(newProduct.kcal) || 0) * ratio),
          protein: Math.round((parseFloat(newProduct.protein) || 0) * ratio * 10) / 10,
          carbs: Math.round((parseFloat(newProduct.carbs) || 0) * ratio * 10) / 10,
          fat: Math.round((parseFloat(newProduct.fat) || 0) * ratio * 10) / 10
        }]
      })

      setShowNewProductForm(false)
      setNotFound(false)
      setManualEan('')
      setNewProduct({ name: '', brand: '', kcal: '', protein: '', carbs: '', fat: '' })
    } catch (error) {
      console.error('Failed to create product:', error)
    }
  }

  // Show loading state
  if (isLookingUp) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold-primary mb-3" />
        <p className="text-gray-600">Söker efter produkt...</p>
        <p className="text-sm text-gray-400 mt-1">EAN: {manualEan}</p>
      </div>
    )
  }

  // Show new product form
  if (showNewProductForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Lägg till ny produkt</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowNewProductForm(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-sm text-gray-500">EAN</div>
          <div className="font-mono text-gray-900">{manualEan}</div>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Produktnamn *</Label>
            <Input
              placeholder="Produktnamn"
              value={newProduct.name}
              onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Varumärke</Label>
            <Input
              placeholder="Varumärke"
              value={newProduct.brand}
              onChange={(e) => setNewProduct(p => ({ ...p, brand: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>kcal/100g *</Label>
              <Input
                type="number"
                placeholder="0"
                value={newProduct.kcal}
                onChange={(e) => setNewProduct(p => ({ ...p, kcal: e.target.value }))}
              />
            </div>
            <div>
              <Label>Protein/100g *</Label>
              <Input
                type="number"
                placeholder="0"
                value={newProduct.protein}
                onChange={(e) => setNewProduct(p => ({ ...p, protein: e.target.value }))}
              />
            </div>
            <div>
              <Label>Kolhydrater/100g</Label>
              <Input
                type="number"
                placeholder="0"
                value={newProduct.carbs}
                onChange={(e) => setNewProduct(p => ({ ...p, carbs: e.target.value }))}
              />
            </div>
            <div>
              <Label>Fett/100g</Label>
              <Input
                type="number"
                placeholder="0"
                value={newProduct.fat}
                onChange={(e) => setNewProduct(p => ({ ...p, fat: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Portion (g)</Label>
            <Input
              type="number"
              value={portionG}
              onChange={(e) => setPortionG(e.target.value)}
            />
          </div>
        </div>

        <Button
          onClick={handleCreateAndLogProduct}
          disabled={!newProduct.name || !newProduct.kcal}
          className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
        >
          <Check className="w-4 h-4 mr-2" />
          Skapa & logga
        </Button>
      </div>
    )
  }

  // Show local product details
  if (foundProduct) {
    const portion = parseFloat(portionG) || 100
    const ratio = portion / 100

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Lokal databas</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFoundProduct(null); setManualEan('') }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="mt-2">
            <h3 className="font-semibold text-gray-900">{foundProduct.name}</h3>
            {foundProduct.brand && (
              <p className="text-sm text-gray-500">{foundProduct.brand}</p>
            )}
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Per 100g: {foundProduct.kcal} kcal · P: {foundProduct.protein}g · K: {foundProduct.carbs}g · F: {foundProduct.fat}g
          </div>
        </div>

        <div>
          <Label>Portion (gram)</Label>
          <Input
            type="number"
            value={portionG}
            onChange={(e) => setPortionG(e.target.value)}
          />
        </div>

        <div className="bg-gradient-to-r from-gold-primary/10 to-orange-100 border border-gold-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Beräknat intag</span>
            <span className="font-bold text-lg bg-gradient-to-r from-gold-primary to-orange-500 bg-clip-text text-transparent">
              {Math.round(foundProduct.kcal * ratio)} kcal
            </span>
          </div>
          <div className="text-sm text-gray-600 text-right mt-1">
            P: {Math.round(foundProduct.protein * ratio * 10) / 10}g · K: {Math.round(foundProduct.carbs * ratio * 10) / 10}g · F: {Math.round(foundProduct.fat * ratio * 10) / 10}g
          </div>
        </div>

        <Button
          onClick={handleLogProduct}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Logga produkt
        </Button>
      </div>
    )
  }

  // Show Open Food Facts product
  if (offProduct) {
    const portion = parseFloat(portionG) || 100
    const ratio = portion / 100
    const kcal = offProduct.nutriments['energy-kcal_100g'] || 0
    const protein = offProduct.nutriments.proteins_100g || 0
    const carbs = offProduct.nutriments.carbohydrates_100g || 0
    const fat = offProduct.nutriments.fat_100g || 0

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Open Food Facts</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setOffProduct(null); setManualEan('') }}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mt-2 flex gap-3">
            {offProduct.image_url && (
              <img
                src={offProduct.image_url}
                alt={offProduct.product_name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{offProduct.product_name}</h3>
              {offProduct.brands && (
                <p className="text-sm text-gray-500">{offProduct.brands}</p>
              )}
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Per 100g: {Math.round(kcal)} kcal · P: {Math.round(protein)}g · K: {Math.round(carbs)}g · F: {Math.round(fat)}g
          </div>
        </div>

        <div>
          <Label>Portion (gram)</Label>
          <Input
            type="number"
            value={portionG}
            onChange={(e) => setPortionG(e.target.value)}
          />
        </div>

        <div className="bg-gradient-to-r from-gold-primary/10 to-orange-100 border border-gold-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Beräknat intag</span>
            <span className="font-bold text-lg bg-gradient-to-r from-gold-primary to-orange-500 bg-clip-text text-transparent">
              {Math.round(kcal * ratio)} kcal
            </span>
          </div>
          <div className="text-sm text-gray-600 text-right mt-1">
            P: {Math.round(protein * ratio * 10) / 10}g · K: {Math.round(carbs * ratio * 10) / 10}g · F: {Math.round(fat * ratio * 10) / 10}g
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Produkten sparas automatiskt till din lokala databas
        </div>

        <Button
          onClick={handleLogOffProduct}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Spara & logga produkt
        </Button>
      </div>
    )
  }

  // Show not found message
  if (notFound) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <Barcode className="w-6 h-6 text-amber-600" />
          </div>
          <p className="font-semibold text-amber-800">Produkt hittades inte</p>
          <p className="text-sm text-amber-600 mt-1">EAN: {manualEan}</p>
          <p className="text-xs text-amber-500 mt-2">Varken i lokal databas eller Open Food Facts</p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => { setNotFound(false); setManualEan('') }}
            className="flex-1 border-gray-300"
          >
            Sök igen
          </Button>
          <Button
            onClick={() => setShowNewProductForm(true)}
            className="flex-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a] hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Lägg till manuellt
          </Button>
        </div>
      </div>
    )
  }

  // Show scanner/search UI
  return (
    <div className="space-y-4">
      {/* Scanner error message */}
      {scannerError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{scannerError}</div>
        </div>
      )}

      {/* Native barcode scanner */}
      {isScanning ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            className="w-full h-64 object-cover"
            playsInline
            muted
            autoPlay
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={stopScanner}
            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 z-10"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-32 border-2 border-gold-primary rounded-lg relative">
              <div className="absolute inset-0 bg-gold-primary/10" />
              <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-gold-primary animate-pulse" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 text-center text-sm text-white bg-black/50 py-2">
            Rikta kameran mot streckkoden
          </div>
        </div>
      ) : (
        <button
          onClick={startScanner}
          disabled={!hasNativeSupport}
          className="w-full py-10 rounded-xl border-2 border-dashed border-gray-300 hover:border-gold-primary hover:bg-gold-primary/5 transition-all flex flex-col items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary/20 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-gold-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              {hasNativeSupport ? 'Starta scanner' : 'Scanner ej tillgänglig'}
            </p>
            <p className="text-sm text-gray-500">
              {hasNativeSupport ? 'Live-skanning av streckkod' : 'Ange EAN manuellt nedan'}
            </p>
          </div>
        </button>
      )}

      {/* Manual EAN input */}
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Ange EAN manuellt..."
          value={manualEan}
          onChange={(e) => setManualEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          className="pr-12"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualSearch}
          disabled={!manualEan.trim()}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Info text */}
      <div className="text-xs text-gray-500 text-center">
        Söker först i din databas, sedan i Open Food Facts
      </div>
    </div>
  )
}
