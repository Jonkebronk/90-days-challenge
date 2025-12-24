import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/favorites - Hämta användarens favoritprodukter
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const favorites = await prisma.favoriteProduct.findMany({
      where: { userId: session.user.id },
      include: {
        foodItem: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ favorites })
  } catch (error) {
    console.error('Error fetching favorites:', error)
    return NextResponse.json(
      { error: 'Failed to fetch favorites' },
      { status: 500 }
    )
  }
}

// POST /api/favorites - Lägg till en favorit
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { icaProductId, foodItemId, productId, name, imageUrl, category, icaProductData } = body

    if (!name && !icaProductId && !foodItemId && !productId) {
      return NextResponse.json(
        { error: 'Name, icaProductId, foodItemId, or productId is required' },
        { status: 400 }
      )
    }

    // Kolla om favorit redan finns (check for each type of ID)
    const existingQuery = productId
      ? { userId: session.user.id, productId }
      : foodItemId
        ? { userId: session.user.id, foodItemId }
        : icaProductId
          ? { userId: session.user.id, icaProductId }
          : null

    if (existingQuery) {
      const existing = await prisma.favoriteProduct.findFirst({
        where: existingQuery,
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Product is already a favorite', favorite: existing },
          { status: 409 }
        )
      }
    }

    const favorite = await prisma.favoriteProduct.create({
      data: {
        userId: session.user.id,
        icaProductId: icaProductId || null,
        foodItemId: foodItemId || null,
        productId: productId || null,
        name: name || 'Unnamed product',
        imageUrl: imageUrl || null,
        category: category || 'Övrigt',
        icaProductData: icaProductData || null,
      },
      include: {
        foodItem: true,
        product: true,
      },
    })

    return NextResponse.json({ favorite }, { status: 201 })
  } catch (error) {
    console.error('Error creating favorite:', error)
    return NextResponse.json(
      { error: 'Failed to create favorite' },
      { status: 500 }
    )
  }
}

// DELETE /api/favorites - Ta bort en favorit
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const icaProductId = searchParams.get('icaProductId')
    const foodItemId = searchParams.get('foodItemId')
    const productId = searchParams.get('productId')

    if (!id && !icaProductId && !foodItemId && !productId) {
      return NextResponse.json(
        { error: 'id, icaProductId, foodItemId, or productId is required' },
        { status: 400 }
      )
    }

    // Hitta och verifiera ägare
    const favorite = await prisma.favoriteProduct.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          id ? { id } : {},
          icaProductId ? { icaProductId } : {},
          foodItemId ? { foodItemId } : {},
          productId ? { productId } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    })

    if (!favorite) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      )
    }

    await prisma.favoriteProduct.delete({
      where: { id: favorite.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting favorite:', error)
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    )
  }
}
