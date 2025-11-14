import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// POST /api/upload/recipe-image - Validate image URL
// Simple URL-based approach - no actual upload needed
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 })
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Return the validated URL
    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error validating image URL:', error)
    return NextResponse.json(
      { error: 'Failed to validate URL' },
      { status: 500 }
    )
  }
}
