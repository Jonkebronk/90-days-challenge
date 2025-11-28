'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, EyeOff, Bell, BellOff, CheckCircle2, XCircle, RefreshCw, Scale } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { requestNotificationPermission, isPushSupported, getNotificationPermission } from '@/lib/firebase'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  })

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Push notification state
  const [pushSupported, setPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [subscriptionCount, setSubscriptionCount] = useState(0)
  const [isLoadingPush, setIsLoadingPush] = useState(true)
  const [isEnablingPush, setIsEnablingPush] = useState(false)

  // Weight reminder state
  const [weightReminderEnabled, setWeightReminderEnabled] = useState(false)
  const [isTogglingWeightReminder, setIsTogglingWeightReminder] = useState(false)

  // Check push notification status on mount
  useEffect(() => {
    async function checkPushStatus() {
      setIsLoadingPush(true)
      try {
        const supported = await isPushSupported()
        setPushSupported(supported)

        if (supported) {
          setPushPermission(getNotificationPermission())
        }

        // Check server subscription
        const response = await fetch('/api/push-subscription')
        if (response.ok) {
          const data = await response.json()
          setHasSubscription(data.hasSubscriptions)
          setSubscriptionCount(data.count || 0)
        }

        // Check weight reminder setting
        const settingsRes = await fetch('/api/user/settings')
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setWeightReminderEnabled(settingsData.weightReminderEnabled || false)
        }
      } catch (error) {
        console.error('Error checking push status:', error)
      } finally {
        setIsLoadingPush(false)
      }
    }

    checkPushStatus()
  }, [])

  const handleToggleWeightReminder = async () => {
    setIsTogglingWeightReminder(true)
    try {
      const newValue = !weightReminderEnabled
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weightReminderEnabled: newValue })
      })

      if (response.ok) {
        setWeightReminderEnabled(newValue)
        toast.success(newValue ? 'Viktpåminnelse aktiverad!' : 'Viktpåminnelse avaktiverad')
      } else {
        toast.error('Kunde inte uppdatera inställningen')
      }
    } catch (error) {
      console.error('Error toggling weight reminder:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsTogglingWeightReminder(false)
    }
  }

  const handleEnablePush = async () => {
    setIsEnablingPush(true)
    try {
      const token = await requestNotificationPermission()

      if (token) {
        // Save token to server
        const response = await fetch('/api/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            device: detectDevice(),
          }),
        })

        if (response.ok) {
          setPushPermission('granted')
          setHasSubscription(true)
          setSubscriptionCount(prev => prev + 1)
          toast.success('Push-notiser aktiverade!')
        } else {
          const data = await response.json()
          toast.error(data.error || 'Kunde inte spara prenumerationen')
        }
      } else {
        setPushPermission(getNotificationPermission())
        if (getNotificationPermission() === 'denied') {
          toast.error('Du har blockerat notifikationer. Ändra i webbläsarens inställningar.')
        }
      }
    } catch (error) {
      console.error('Error enabling push:', error)
      toast.error('Något gick fel')
    } finally {
      setIsEnablingPush(false)
    }
  }

  const handleRemoveSubscriptions = async () => {
    try {
      const response = await fetch('/api/push-subscription', {
        method: 'DELETE',
      })

      if (response.ok) {
        setHasSubscription(false)
        setSubscriptionCount(0)
        toast.success('Alla prenumerationer borttagna')
      } else {
        toast.error('Kunde inte ta bort prenumerationer')
      }
    } catch (error) {
      console.error('Error removing subscriptions:', error)
      toast.error('Något gick fel')
    }
  }

  function detectDevice(): string {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios'
    if (/android/.test(userAgent)) return 'android'
    return 'web'
  }

  const handleSave = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Profil uppdaterad!')
        setIsEditing(false)
        await update()
      } else {
        toast.error('Kunde inte uppdatera profil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Kunde inte uppdatera profil')
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Lösenorden matchar inte')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Lösenordet måste vara minst 6 tecken')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Lösenordet har ändrats!')
        setShowPasswordDialog(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ändra lösenord')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Profil
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Hantera dina uppgifter och inställningar
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* User Info Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Personlig Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-700 font-medium">Namn</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-gold-primary disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
                >
                  Redigera
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-semibold"
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
                    className="bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 text-gray-700"
                  >
                    Avbryt
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Kontoinformation</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-gray-600 text-sm">Roll</Label>
                <p className="text-lg font-semibold text-gray-900 capitalize mt-1">
                  {(session?.user as any)?.role === 'COACH' ? 'Coach' : 'Klient'}
                </p>
              </div>
              <div>
                <Label className="text-gray-600 text-sm">Status</Label>
                <p className="text-lg font-medium mt-1">
                  <span className="inline-block px-3 py-1 rounded-full text-sm bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold">
                    Aktiv
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900">Säkerhet</h2>
          </div>
          <div className="p-6">
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-700 font-medium"
                >
                  Ändra Lösenord
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-2 border-gray-300">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Ändra Lösenord</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-gray-700 font-medium">Nuvarande lösenord</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="bg-white border-2 border-gray-300 text-gray-900 pr-10 focus:border-gold-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="text-gray-700 font-medium">Nytt lösenord</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="bg-white border-2 border-gray-300 text-gray-900 pr-10 focus:border-gold-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Bekräfta nytt lösenord</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-white border-2 border-gray-300 text-gray-900 focus:border-gold-primary"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
                    >
                      {isChangingPassword ? 'Sparar...' : 'Spara nytt lösenord'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordDialog(false)
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        })
                      }}
                      className="bg-gray-100 border-2 border-gray-300 hover:bg-gray-200 text-gray-700"
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Push Notifications Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Push-notiser
            </h2>
          </div>
          <div className="p-6">
            {isLoadingPush ? (
              <div className="flex items-center gap-2 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Laddar status...
              </div>
            ) : !pushSupported ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <BellOff className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Push-notiser stöds inte</p>
                  <p className="text-sm text-amber-600">Din webbläsare eller enhet stöder inte push-notiser.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status */}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasSubscription ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {hasSubscription ? 'Notiser aktiverade' : 'Notiser ej aktiverade'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {hasSubscription
                            ? `${subscriptionCount} enhet${subscriptionCount !== 1 ? 'er' : ''} registrerad${subscriptionCount !== 1 ? 'e' : ''}`
                            : 'Du får inga push-notiser just nu'
                          }
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pushPermission === 'granted'
                        ? 'bg-green-100 text-green-700'
                        : pushPermission === 'denied'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {pushPermission === 'granted' ? 'Tillåtet' : pushPermission === 'denied' ? 'Blockerat' : 'Ej frågat'}
                    </div>
                  </div>
                  {/* What notifications are for */}
                  <div className="text-sm text-gray-600 pl-9">
                    <p className="font-medium text-gray-700 mb-1">Du får notiser för:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                      <li>Nya meddelanden från din coach</li>
                      <li>Påminnelse om vecko-check-in (söndagar)</li>
                      <li>När du tilldelas nytt träningsprogram eller kostschema</li>
                    </ul>
                  </div>
                </div>

                {/* Weight Reminder Toggle */}
                {hasSubscription && (
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <Scale className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Daglig viktpåminnelse</p>
                        <p className="text-sm text-gray-500">Få en påminnelse att väga dig varje morgon</p>
                      </div>
                    </div>
                    <Switch
                      checked={weightReminderEnabled}
                      onCheckedChange={handleToggleWeightReminder}
                      disabled={isTogglingWeightReminder}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleEnablePush}
                    disabled={isEnablingPush || pushPermission === 'denied'}
                    className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
                  >
                    {isEnablingPush ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Aktiverar...
                      </>
                    ) : hasSubscription ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Registrera denna enhet igen
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 mr-2" />
                        Aktivera notiser
                      </>
                    )}
                  </Button>

                  {hasSubscription && (
                    <Button
                      onClick={handleRemoveSubscriptions}
                      variant="outline"
                      className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <BellOff className="w-4 h-4 mr-2" />
                      Ta bort alla prenumerationer
                    </Button>
                  )}
                </div>

                {/* Info text */}
                {pushPermission === 'denied' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                      Du har blockerat notifikationer. För att aktivera dem måste du ändra i webbläsarens inställningar.
                    </p>
                  </div>
                )}

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Tips:</strong> För att få notiser på mobilen, lägg till appen på hemskärmen och aktivera notiser där också.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
