'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ArticlesPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/articles/skill-tree')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-gray-400">Laddar...</p>
    </div>
  )
}
