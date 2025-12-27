'use client'

import { useState } from 'react'
import { Play, X } from 'lucide-react'
import { Button } from './button'

interface VideoPlayerProps {
  videoUrl: string | null
  thumbnailUrl?: string | null
  title?: string
  className?: string
  autoPlay?: boolean
  onClose?: () => void
}

export function VideoPlayer({ videoUrl, thumbnailUrl, title, className = '', autoPlay = false, onClose }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)

  if (!videoUrl) return null

  // Extract YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const videoId = getYouTubeId(videoUrl)

  if (!videoId) return null

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
  const defaultThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  if (!isPlaying) {
    return (
      <div className={`relative group cursor-pointer ${className}`}>
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={thumbnailUrl || defaultThumbnail}
            alt={title || 'Exercise video'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all flex items-center justify-center">
            <Button
              onClick={() => setIsPlaying(true)}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg w-16 h-11 p-0"
            >
              <Play className="w-7 h-7 ml-1 fill-white" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative pt-[56.25%] rounded-lg overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <Button
        onClick={() => {
          if (onClose) {
            onClose()
          } else {
            setIsPlaying(false)
          }
        }}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
