'use client'

import { useState, useEffect } from 'react'
import { Scale, Link2, Unlink, RefreshCw, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface WithingsConnectCardProps {
  className?: string
  showDetails?: boolean
  onConnectionChange?: (connected: boolean) => void
  onSync?: () => void
}

export function WithingsConnectCard({
  className,
  showDetails = false,
  onConnectionChange,
  onSync,
}: WithingsConnectCardProps) {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/withings/sync')
      if (response.ok) {
        const data = await response.json()
        setConnected(data.connected)
        onConnectionChange?.(data.connected)
      } else {
        setConnected(false)
        onConnectionChange?.(false)
      }
    } catch (error) {
      console.error('Error checking Withings connection:', error)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = () => {
    // Redirect to Withings OAuth
    window.location.href = '/api/withings/auth'
  }

  const handleDisconnect = async () => {
    if (!confirm('Är du säker på att du vill koppla bort Withings?')) {
      return
    }

    setDisconnecting(true)
    try {
      const response = await fetch('/api/withings/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        setConnected(false)
        onConnectionChange?.(false)
        toast.success('Withings bortkopplad')
      } else {
        toast.error('Kunde inte koppla bort Withings')
      }
    } catch (error) {
      console.error('Error disconnecting Withings:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/withings/sync', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setLastSync(new Date().toLocaleTimeString('sv-SE'))
        toast.success(`Synkade ${data.synced} viktmätningar`)
        // Trigger a refresh of weight data
        window.dispatchEvent(new CustomEvent('withings-sync-complete'))
        onSync?.()
      } else {
        toast.error('Synkronisering misslyckades')
      }
    } catch (error) {
      console.error('Error syncing Withings:', error)
      toast.error('Ett fel uppstod vid synkronisering')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Withings logo/icon */}
            <div
              className={cn(
                'h-12 w-12 rounded-full flex items-center justify-center',
                connected ? 'bg-purple-100' : 'bg-gray-100'
              )}
            >
              <Scale
                className={cn('h-6 w-6', connected ? 'text-purple-600' : 'text-gray-400')}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800">Withings</h4>
                {connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs">
                    <Check className="h-3 w-3" />
                    Kopplad
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {connected
                  ? 'Viktdata synkroniseras automatiskt'
                  : 'Koppla för att synka din våg'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={syncing}
                  className="gap-1"
                >
                  <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
                  {syncing ? 'Synkar...' : 'Synka'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button onClick={handleConnect} className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Link2 className="h-4 w-4" />
                Koppla Withings
              </Button>
            )}
          </div>
        </div>

        {/* Details section */}
        {showDetails && connected && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Senaste synk</p>
                <p className="font-medium text-gray-800">
                  {lastSync || 'Synkar automatiskt vid vägning'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Data som synkroniseras</p>
                <p className="font-medium text-gray-800">Vikt (kg)</p>
              </div>
            </div>
          </div>
        )}

        {/* Help text when not connected */}
        {showDetails && !connected && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Genom att koppla din Withings-våg synkroniseras din vikt automatiskt när du väger dig.
                Du kan fortfarande fylla i vikt manuellt genom att klicka på kalendern.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
