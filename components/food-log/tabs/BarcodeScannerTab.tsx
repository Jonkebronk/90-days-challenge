'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Barcode, Camera, Loader2, Check, X, Plus, Search } from 'lucide-react'
import { useFoodLogStore, Product } from '@/lib/stores/food-log-store'

export function BarcodeScannerTab() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [manualEan, setManualEan] = useState('')
  const [foundProduct, setFoundProduct] = useState<Product | null>(null)
  const [portionG, setPortionG] = useState('100')
  const [notFound, setNotFound] = useState(false)
  const [showNewProductForm, setShowNewProductForm] = useState(false)

  const { isLoading, lookupProduct, createLog } = useFoodLogStore()

  // New product form state
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

        // Try to use BarcodeDetector if available
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

          // Start detection after video is ready
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

    // Reset
    setFoundProduct(null)
    setManualEan('')
    setPortionG('100')
  }

  const handleCreateAndLogProduct = async () => {
    // Create product via API
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

      // Now log it
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

      // Reset
      setShowNewProductForm(false)
      setNotFound(false)
      setManualEan('')
      setNewProduct({ name: '', brand: '', kcal: '', protein: '', carbs: '', fat: '' })
    } catch (error) {
      console.error('Failed to create product:', error)
    }
  }

  // Cleanup on unmount
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
          <h3 className="font-medium">Lägg till ny produkt</h3>
          <button
            onClick={() => setShowNewProductForm(false)}
            className="text-zinc-400 hover:text-zinc-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="text-sm text-zinc-400">EAN</div>
          <div className="font-mono">{manualEan}</div>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Produktnamn *"
            value={newProduct.name}
            onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))}
            className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
          />
          <input
            type="text"
            placeholder="Varumärke"
            value={newProduct.brand}
            onChange={(e) => setNewProduct(p => ({ ...p, brand: e.target.value }))}
            className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="kcal/100g *"
              value={newProduct.kcal}
              onChange={(e) => setNewProduct(p => ({ ...p, kcal: e.target.value }))}
              className="bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
            <input
              type="number"
              placeholder="Protein/100g *"
              value={newProduct.protein}
              onChange={(e) => setNewProduct(p => ({ ...p, protein: e.target.value }))}
              className="bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
            <input
              type="number"
              placeholder="Kolhydrater/100g"
              value={newProduct.carbs}
              onChange={(e) => setNewProduct(p => ({ ...p, carbs: e.target.value }))}
              className="bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
            <input
              type="number"
              placeholder="Fett/100g"
              value={newProduct.fat}
              onChange={(e) => setNewProduct(p => ({ ...p, fat: e.target.value }))}
              className="bg-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400">Portion (g)</label>
            <input
              type="number"
              value={portionG}
              onChange={(e) => setPortionG(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white mt-1"
            />
          </div>
        </div>

        <button
          onClick={handleCreateAndLogProduct}
          disabled={!newProduct.name || !newProduct.kcal}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          Skapa & logga
        </button>
      </div>
    )
  }

  // Show product details
  if (foundProduct) {
    const portion = parseFloat(portionG) || 100
    const ratio = portion / 100

    return (
      <div className="space-y-4">
        <div className="bg-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{foundProduct.name}</h3>
              {foundProduct.brand && (
                <p className="text-sm text-zinc-400">{foundProduct.brand}</p>
              )}
            </div>
            <button
              onClick={() => {
                setFoundProduct(null)
                setManualEan('')
              }}
              className="text-zinc-400 hover:text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 text-sm text-zinc-400">
            Per 100g: {foundProduct.kcal} kcal · P: {foundProduct.protein}g · K: {foundProduct.carbs}g · F: {foundProduct.fat}g
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-400">Portion (gram)</label>
          <input
            type="number"
            value={portionG}
            onChange={(e) => setPortionG(e.target.value)}
            className="w-full bg-zinc-800 rounded-lg px-4 py-3 text-white mt-1"
          />
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Beräknat intag</span>
            <span className="text-emerald-400 font-bold">
              {Math.round(foundProduct.kcal * ratio)} kcal
            </span>
          </div>
          <div className="text-sm text-zinc-400 text-right mt-1">
            P: {Math.round(foundProduct.protein * ratio * 10) / 10}g · K: {Math.round(foundProduct.carbs * ratio * 10) / 10}g · F: {Math.round(foundProduct.fat * ratio * 10) / 10}g
          </div>
        </div>

        <button
          onClick={handleLogProduct}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Logga produkt
        </button>
      </div>
    )
  }

  // Show not found message
  if (notFound) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
          <Barcode className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-amber-400 font-medium">Produkt hittades inte</p>
          <p className="text-sm text-zinc-400 mt-1">EAN: {manualEan}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setNotFound(false)
              setManualEan('')
            }}
            className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Sök igen
          </button>
          <button
            onClick={() => setShowNewProductForm(true)}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Lägg till
          </button>
        </div>
      </div>
    )
  }

  // Show scanner/search UI
  return (
    <div className="space-y-4">
      {/* Camera scanner */}
      {isScanning ? (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-24 border-2 border-emerald-400 rounded-lg" />
          </div>
          <button
            onClick={stopScanner}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-0 right-0 text-center text-sm text-zinc-300">
            Rikta kameran mot streckkoden
          </div>
        </div>
      ) : (
        <button
          onClick={startScanner}
          className="w-full py-8 rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors flex flex-col items-center justify-center gap-3"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
            <Camera className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="font-medium">Starta kamera</p>
            <p className="text-sm text-zinc-500">Scanna produktens streckkod</p>
          </div>
        </button>
      )}

      {/* Manual EAN input */}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Eller ange EAN manuellt..."
          value={manualEan}
          onChange={(e) => setManualEan(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          className="w-full bg-zinc-800 rounded-lg px-4 py-3 pr-12 text-white placeholder-zinc-500"
        />
        <button
          onClick={handleManualSearch}
          disabled={!manualEan.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-300 disabled:opacity-50"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
