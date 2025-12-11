'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Eye, EyeOff, Bell, BellOff, CheckCircle2, XCircle, RefreshCw, Scale, Rocket, Camera, User, Loader2, ZoomIn, ZoomOut, X, Check, Move } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { requestNotificationPermission, isPushSupported, getNotificationPermission } from '@/lib/firebase'

// Canvas-based crop preview component - uses same rendering as save function
function CropPreviewCanvas({
  src,
  cropPosition,
  cropZoom,
  canvasRef
}: {
  src: string
  cropPosition: { x: number; y: number }
  cropZoom: number
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const previewSize = 256

  useEffect(() => {
    const img = new Image()
    img.onload = () => setImage(img)
    img.src = src
  }, [src])

  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, previewSize, previewSize)

    // Calculate scale to fit image in preview (cover behavior)
    const imgAspect = image.width / image.height
    let drawWidth: number, drawHeight: number

    if (imgAspect > 1) {
      // Landscape: fit height, width extends
      drawHeight = previewSize
      drawWidth = previewSize * imgAspect
    } else {
      // Portrait: fit width, height extends
      drawWidth = previewSize
      drawHeight = previewSize / imgAspect
    }

    // Apply zoom
    drawWidth *= cropZoom
    drawHeight *= cropZoom

    // Calculate position (centered + user offset)
    const x = (previewSize - drawWidth) / 2 + cropPosition.x
    const y = (previewSize - drawHeight) / 2 + cropPosition.y

    // Draw the image
    ctx.drawImage(image, x, y, drawWidth, drawHeight)
  }, [image, cropPosition, cropZoom, canvasRef])

  return (
    <canvas
      ref={canvasRef}
      width={previewSize}
      height={previewSize}
      className="absolute inset-0 w-full h-full"
    />
  )
}

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

  // Get Started section visibility state
  const [hideGetStarted, setHideGetStarted] = useState(false)

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [userName, setUserName] = useState<string>('')

  // Image cropper state
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 })
  const [cropZoom, setCropZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  // Load Get Started visibility from localStorage
  useEffect(() => {
    const hidden = localStorage.getItem('hideGetStarted') === 'true'
    setHideGetStarted(hidden)
  }, [])

  // Load profile data on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const data = await res.json()
          setProfileImage(data.image)
          if (data.name) {
            setUserName(data.name)
            setFormData(prev => ({ ...prev, name: data.name }))
          }
          if (data.email) {
            setFormData(prev => ({ ...prev, email: data.email }))
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      }
    }
    fetchProfile()
  }, [])

  // Update formData when session loads
  useEffect(() => {
    if (session?.user?.name) {
      setUserName(session.user.name)
      setFormData(prev => ({ ...prev, name: session.user.name || '' }))
    }
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user.email || '' }))
    }
  }, [session])

  const handleToggleGetStarted = () => {
    const newValue = !hideGetStarted
    setHideGetStarted(newValue)
    localStorage.setItem('hideGetStarted', newValue.toString())
    toast.success(newValue ? '"Kom igång" är nu dold' : '"Kom igång" visas nu på dashboard')
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB for initial load)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bilden är för stor (max 5MB)')
      return
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Endast bilder är tillåtna')
      return
    }

    // Load image for cropping
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setCropperImage(base64)
      setCropPosition({ x: 0, y: 0 })
      setCropZoom(1)
    }
    reader.onerror = () => {
      toast.error('Kunde inte läsa bilden')
    }
    reader.readAsDataURL(file)
  }

  const handleCropSave = async () => {
    if (!cropperImage || !previewCanvasRef.current) return

    setIsUploadingImage(true)
    try {
      // Get the preview canvas
      const previewCanvas = previewCanvasRef.current

      // Create output canvas (larger for better quality)
      const outputSize = 300
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = outputSize
      outputCanvas.height = outputSize

      const ctx = outputCanvas.getContext('2d')
      if (!ctx) {
        toast.error('Kunde inte bearbeta bilden')
        setIsUploadingImage(false)
        return
      }

      // Enable smooth scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Scale up the preview canvas to output size
      ctx.drawImage(previewCanvas, 0, 0, outputSize, outputSize)

      // Convert to base64
      const croppedBase64 = outputCanvas.toDataURL('image/jpeg', 0.9)

      // Save to profile
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: croppedBase64 })
      })

      if (res.ok) {
        setProfileImage(croppedBase64)
        setCropperImage(null)
        await update() // Refresh session with new image
        toast.success('Profilbild uppdaterad!')
      } else {
        toast.error('Kunde inte spara bilden')
      }
    } catch (error) {
      console.error('Error saving image:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleCropMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y })
  }

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setCropPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleCropMouseUp = () => {
    setIsDragging(false)
  }

  const handleCropTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - cropPosition.x, y: touch.clientY - cropPosition.y })
  }

  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    setCropPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleCropTouchEnd = () => {
    setIsDragging(false)
  }

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

  // Lock body scroll when cropper modal is open
  useEffect(() => {
    if (cropperImage) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [cropperImage])

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
        {/* Profile Image Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <label
                className="block cursor-pointer"
                title="Dubbelklicka för att ändra profilbild"
              >
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-gold-primary shadow-lg hover:border-amber-400 transition-colors">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profilbild"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {userName || formData.name || session?.user?.name || 'Laddar...'}
              </h2>
              <p className="text-gray-500 mt-1">{formData.email || session?.user?.email}</p>
              <p className="text-sm text-amber-600 font-medium mt-2">
                {(session?.user as any)?.role?.toUpperCase() === 'COACH' ? 'Coach' : 'Klient'}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Tryck på bilden för att ändra
              </p>
            </div>
          </div>
        </div>

        {/* Image Cropper Modal */}
        {cropperImage && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Justera profilbild</h3>
                <button
                  onClick={() => setCropperImage(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                {/* Crop area - 256x256px */}
                <div
                  className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-gold-primary bg-gray-100 cursor-move"
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                  onTouchStart={handleCropTouchStart}
                  onTouchMove={handleCropTouchMove}
                  onTouchEnd={handleCropTouchEnd}
                >
                  <CropPreviewCanvas
                    src={cropperImage}
                    cropPosition={cropPosition}
                    cropZoom={cropZoom}
                    canvasRef={previewCanvasRef}
                  />
                </div>

                <p className="text-center text-sm text-gray-500 mt-3 flex items-center justify-center gap-2">
                  <Move className="w-4 h-4" />
                  Dra för att flytta bilden
                </p>

                {/* Zoom slider */}
                <div className="mt-4 flex items-center gap-3">
                  <ZoomOut className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gold-primary"
                  />
                  <ZoomIn className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="p-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCropperImage(null)}
                  className="flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleCropSave}
                  disabled={isUploadingImage}
                  className="flex-1 bg-gold-primary hover:bg-gold-primary/90 text-black"
                >
                  {isUploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Spara
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  {(session?.user as any)?.role?.toUpperCase() === 'COACH' ? 'Coach' : 'Klient'}
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

        {/* Dashboard Settings Card */}
        <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg">
          <div className="p-6 border-b-2 border-gray-200 bg-gray-50 rounded-t-xl">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              Dashboard-inställningar
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Rocket className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Visa &quot;Kom igång&quot;-sektionen</p>
                  <p className="text-sm text-gray-500">Guiden för nya användare på dashboard</p>
                </div>
              </div>
              <Switch
                checked={!hideGetStarted}
                onCheckedChange={handleToggleGetStarted}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
