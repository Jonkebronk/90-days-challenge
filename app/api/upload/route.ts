import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadMessageImage, uploadProductImage } from '@/lib/cloudinary'

// POST /api/upload - Upload image to Cloudinary
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image, folder = 'messages' } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Validate that it's a base64 image
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    let url: string

    // Use appropriate upload function based on folder
    if (folder === 'products') {
      url = await uploadProductImage(image)
    } else {
      url = await uploadMessageImage(image)
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
