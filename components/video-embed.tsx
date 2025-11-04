'use client'

type VideoEmbedProps = {
  url: string
  title?: string
}

export function VideoEmbed({ url, title }: VideoEmbedProps) {
  const getEmbedUrl = (videoUrl: string): string | null => {
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
      /youtube\.com\/embed\/([^&\s]+)/,
    ]

    for (const pattern of youtubePatterns) {
      const match = videoUrl.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }

    // Vimeo patterns
    const vimeoPatterns = [
      /vimeo\.com\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ]

    for (const pattern of vimeoPatterns) {
      const match = videoUrl.match(pattern)
      if (match && match[1]) {
        return `https://player.vimeo.com/video/${match[1]}`
      }
    }

    // If already an embed URL, return as is
    if (videoUrl.includes('youtube.com/embed/') || videoUrl.includes('player.vimeo.com/video/')) {
      return videoUrl
    }

    return null
  }

  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
        <p className="text-muted-foreground text-sm">
          Ogiltig video URL. Stödda format: YouTube och Vimeo
        </p>
        <p className="text-xs text-muted-foreground mt-2">URL: {url}</p>
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        title={title || 'Video'}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
