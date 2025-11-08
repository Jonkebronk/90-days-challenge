'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  })

  const handleSave = async () => {
    try {
      // TODO: Add API endpoint to update profile
      toast.success('Profil uppdaterad!')
      setIsEditing(false)
      // Update session
      await update()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Kunde inte uppdatera profil')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
          Min Profil
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
          Hantera dina uppgifter och inställningar
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* User Info Card */}
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
          <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">Personlig Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-[rgba(255,215,0,0.8)]">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700] disabled:opacity-60"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-[rgba(255,215,0,0.8)]">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[#FFD700] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-semibold"
                >
                  Redigera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#22c55e] hover:to-[#22c55e] text-white font-semibold"
                  >
                    Spara
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        name: session?.user?.name || '',
                        email: session?.user?.email || '',
                      })
                    }}
                    className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,215,0,0.3)] hover:bg-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.9)]"
                  >
                    Avbryt
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
          <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">Kontoinformation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-[rgba(255,215,0,0.8)] text-sm">Roll</Label>
                <p className="text-lg font-medium text-[rgba(255,255,255,0.9)] capitalize mt-1">
                  {(session?.user as any)?.role || 'Client'}
                </p>
              </div>
              <div>
                <Label className="text-[rgba(255,215,0,0.8)] text-sm">Status</Label>
                <p className="text-lg font-medium mt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-semibold">
                    Aktiv
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)] transition-all">
          <div className="p-6 border-b border-[rgba(255,215,0,0.1)]">
            <h2 className="text-xl font-bold text-[rgba(255,255,255,0.9)]">Säkerhet</h2>
          </div>
          <div className="p-6">
            <Button
              className="bg-[rgba(255,255,255,0.1)] border border-[rgba(255,215,0,0.3)] hover:bg-[rgba(255,215,0,0.1)] hover:border-[rgba(255,215,0,0.5)] text-[rgba(255,255,255,0.9)]"
            >
              Ändra Lösenord
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
