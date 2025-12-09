import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/products/[ean] - Get product by EAN
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ean: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ean } = await params

    const product = await prisma.product.findUnique({
      where: { ean }
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

// PUT /api/products/[ean] - Update product
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ ean: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ean } = await params
    const body = await req.json()
    const { name, brand, kcal, protein, carbs, fat, fiber, source } = body

    const product = await prisma.product.update({
      where: { ean },
      data: {
        ...(name && { name }),
        ...(brand !== undefined && { brand }),
        ...(kcal !== undefined && { kcal }),
        ...(protein !== undefined && { protein }),
        ...(carbs !== undefined && { carbs }),
        ...(fat !== undefined && { fat }),
        ...(fiber !== undefined && { fiber }),
        ...(source && { source })
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

// DELETE /api/products/[ean] - Delete product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ ean: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ean } = await params

    await prisma.product.delete({
      where: { ean }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
