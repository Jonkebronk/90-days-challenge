import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadProductImage } from '@/lib/cloudinary'

// Helper to check if the param is an EAN (numeric string) or ID (cuid)
function isEan(value: string): boolean {
  return /^\d+$/.test(value) || value.startsWith('IMPORT-')
}

// GET /api/products/[id] - Get product by ID or EAN
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const product = await prisma.product.findFirst({
      where: isEan(id) ? { ean: id } : { id }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

// PATCH /api/products/[id] - Partial update product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, brand, category, image, kcal, protein, carbs, fat, fiber, source } = body

    const product = await prisma.product.update({
      where: isEan(id) ? { ean: id } : { id },
      data: {
        ...(name !== undefined && { name }),
        ...(brand !== undefined && { brand }),
        ...(category !== undefined && { category }),
        ...(image !== undefined && { image }),
        ...(kcal !== undefined && { kcal }),
        ...(protein !== undefined && { protein }),
        ...(carbs !== undefined && { carbs }),
        ...(fat !== undefined && { fat }),
        ...(fiber !== undefined && { fiber }),
        ...(source !== undefined && { source })
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// PUT /api/products/[id] - Full update product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, brand, category, image, kcal, protein, carbs, fat, fiber, sugar, salt, source } = body

    // Get existing product to preserve image if not updating
    const existing = await prisma.product.findFirst({
      where: isEan(id) ? { ean: id } : { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Handle image upload to Cloudinary if it's a base64 data URI
    let imageUrl = existing.image
    if (image && image.startsWith('data:image')) {
      try {
        imageUrl = await uploadProductImage(image)
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError)
        // Keep existing image if upload fails
      }
    } else if (image) {
      // It's already a URL, use it
      imageUrl = image
    }

    const product = await prisma.product.update({
      where: { id: existing.id },
      data: {
        name,
        brand: brand || null,
        category: category || null,
        image: imageUrl,
        kcal: kcal || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        fiber: fiber || null,
        sugar: sugar || null,
        salt: salt || null,
        source: source || existing.source || 'manual'
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.product.delete({
      where: isEan(id) ? { ean: id } : { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
