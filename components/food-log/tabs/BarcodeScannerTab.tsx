'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Barcode, Camera, Loader2, Check, X, Plus, Search } from 'lucide-react'
import { useFoodLogStore, Product } from '@/lib/stores/food-log-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BarcodeScannerTab() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualEan, setManualEan] = useState('')
  const [foundProduct, setFoundProduct] = useState<Product | null>(null)
  const [portionG, setPortionG] = useState('100')
  const [notFound, setNotFound] = useState(false)
  const [showNewProductForm, setShowNewProductForm] = useState(false)

  const { isLoading, lookupProduct, createLog } = useFoodLogStore()

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    kcal: '',
    protein: '',
    carbs: '',
    fat: ''
  })

  const stopScanner = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }, [])

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)

        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
          })

          const detectBarcode = async () => {
            if (!videoRef.current || !isScanning) return

            try {
              const barcodes = await barcodeDetector.detect(videoRef.current)
              if (barcodes.length > 0) {
                const ean = barcodes[0].rawValue
                stopScanner()
                handleEanLookup(ean)
                return
              }
            } catch (e) {
              // Detection failed, continue
            }

            if (isScanning) {
              requestAnimationFrame(detectBarcode)
            }
          }

          videoRef.current.onloadedmetadata = () => {
            detectBarcode()
          }
        }
      }
    } catch (error) {
      console.error('Camera access denied:', error)
    }
  }

  const handleEanLookup = async (ean: string) => {
    setNotFound(false)
    setFoundProduct(null)
    setManualEan(ean)

    const product = await lookupProduct(ean)
    if (product) {
      setFoundProduct(product)
    } else {
      setNotFound(true)
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

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

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

  // Show product details
  if (foundProduct) {
    const portion = parseFloat(portionG) || 100
    const ratio = portion / 100

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{foundProduct.name}</h3>
              {foundProduct.brand && (
                <p className="text-sm text-gray-500">{foundProduct.brand}</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFoundProduct(null); setManualEan('') }}>
              <X className="w-4 h-4" />
            </Button>
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
            Lägg till
          </Button>
        </div>
      </div>
    )
  }

  // Show scanner/search UI
  return (
    <div className="space-y-4">
      {/* Camera scanner */}
      {isScanning ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-24 border-2 border-gold-primary rounded-lg shadow-lg" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopScanner}
            className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-2 left-0 right-0 text-center text-sm text-white bg-black/50 py-1">
            Rikta kameran mot streckkoden
          </div>
        </div>
      ) : (
        <button
          onClick={startScanner}
          className="w-full py-10 rounded-xl border-2 border-dashed border-gray-300 hover:border-gold-primary hover:bg-gold-primary/5 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary/20 to-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Camera className="w-6 h-6 text-gold-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">Starta kamera</p>
            <p className="text-sm text-gray-500">Scanna produktens streckkod</p>
          </div>
        </button>
      )}

      {/* Manual EAN input */}
      <div className="relative">
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Eller ange EAN manuellt..."
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
    </div>
  )
}
