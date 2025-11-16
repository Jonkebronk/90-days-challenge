'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

type CSVImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function CSVImportDialog({ open, onOpenChange, onImportComplete }: CSVImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Vänligen välj en CSV-fil')
        return
      }
      setFile(selectedFile)
      setResults(null)
    }
  }

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const items = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const item: any = {}

      headers.forEach((header, index) => {
        item[header] = values[index] || ''
      })

      items.push(item)
    }

    return items
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Vänligen välj en fil')
      return
    }

    try {
      setIsUploading(true)

      // Read file
      const text = await file.text()
      const items = parseCSV(text)

      if (items.length === 0) {
        toast.error('CSV-filen innehåller ingen data')
        return
      }

      // Upload to API
      const response = await fetch('/api/food-items/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.results)

        if (data.results.failed === 0) {
          toast.success(`${data.results.success} livsmedel importerade`)
          setTimeout(() => {
            handleClose()
            onImportComplete()
          }, 2000)
        } else {
          toast.warning(`${data.results.success} lyckades, ${data.results.failed} misslyckades`)
        }
      } else {
        const data = await response.json()
        toast.error(data.error || 'Import misslyckades')
      }
    } catch (error) {
      console.error('Error uploading CSV:', error)
      toast.error('Ett fel uppstod vid import')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setResults(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onOpenChange(false)
  }

  const downloadTemplate = () => {
    const template = `name,categorySlug,calories,proteinG,carbsG,fatG,commonServingSize,isVegetarian,isVegan,isRecommended,notes
Kycklingfilé,proteinkalla,165,31,0,3.6,100g,false,false,true,Mager proteinkälla som är lätt att tillaga
Havregryn,kolhydratkalla,389,16.9,66.3,6.9,100g,true,true,true,Långsamma kolhydrater med mycket fiber
Broccoli,gronsaker,34,2.8,7,0.4,100g,true,true,true,Rik på vitaminer och mineraler`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'food-items-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            Importera livsmedel från CSV
          </DialogTitle>
          <DialogDescription className="text-[rgba(255,255,255,0.6)]">
            Ladda upp en CSV-fil med livsmedel för att importera flera samtidigt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert className="bg-[rgba(255,215,0,0.1)] border-[rgba(255,215,0,0.3)]">
            <AlertCircle className="h-4 w-4 text-[#FFD700]" />
            <AlertDescription className="text-[rgba(255,255,255,0.8)]">
              <div className="flex items-center justify-between">
                <span>Ladda ner mall för att se rätt format</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadTemplate}
                  className="text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ladda ner mall
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Input */}
          <div>
            <Label htmlFor="csv-file" className="text-[rgba(255,255,255,0.8)]">Välj CSV-fil</Label>
            <Input
              id="csv-file"
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[rgba(255,215,0,0.2)] file:text-[#FFD700] hover:file:bg-[rgba(255,215,0,0.3)] cursor-pointer"
            />
            {file && (
              <p className="text-sm text-[rgba(255,255,255,0.6)] mt-2">
                Vald fil: {file.name}
              </p>
            )}
          </div>

          {/* CSV Format Info */}
          <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-[#FFD700] mb-2">CSV-format:</h4>
            <div className="text-xs text-[rgba(255,255,255,0.6)] space-y-1">
              <p><strong>Obligatoriska kolumner:</strong> name, categorySlug, calories, proteinG, carbsG, fatG</p>
              <p><strong>Valfria kolumner:</strong> commonServingSize, isVegetarian, isVegan, isRecommended, notes</p>
              <p><strong>Kategori slugs:</strong> proteinkalla, kolhydratkalla, fettkalla, gronsaker</p>
              <p><strong>Booleska värden:</strong> true/false</p>
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-[rgba(255,255,255,0.8)]">
                <span>Importerar...</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{results.success} lyckades</span>
                </div>
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">{results.failed} misslyckades</span>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.3)] rounded-lg p-4 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Fel:</h4>
                  <ul className="text-xs text-[rgba(255,255,255,0.8)] space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-400">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)]"
          >
            {results ? 'Stäng' : 'Avbryt'}
          </Button>
          {!results && (
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Importerar...' : 'Importera'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
