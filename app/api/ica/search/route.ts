import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ICA Product interface from API
interface ICAProduct {
  id: string
  name: string
  price: number
  comparePrice?: string
  ean?: string
  categoryPath?: string
  imageUrl?: string
  offer?: {
    type: string
    price: number
  }
}

// GET /api/ica/search?term=mjölk&storeId=123&limit=20
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const term = searchParams.get('term')
    const storeId = searchParams.get('storeId')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!term) {
      return NextResponse.json({ error: 'Search term required' }, { status: 400 })
    }

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Check cache first (products cached within last 24h)
    const cachedProducts = await prisma.iCAProductCache.findMany({
      where: {
        storeId,
        name: {
          contains: term,
          mode: 'insensitive',
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    // If we have enough cached results, return them
    if (cachedProducts.length >= Math.min(limit, 5)) {
      return NextResponse.json({
        products: cachedProducts.map(formatCachedProduct),
        fromCache: true,
        totalCount: cachedProducts.length,
      })
    }

    // Fetch from ICA API
    const icaUrl = `https://handlaprivatkund.ica.se/stores/${storeId}/api/v5/products/search?term=${encodeURIComponent(term)}&limit=${limit}&offset=0`

    const icaResponse = await fetch(icaUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MealPlanner/1.0)',
      },
    })

    if (!icaResponse.ok) {
      console.error('ICA API error:', icaResponse.status, await icaResponse.text())

      // Return cached results if available, even if expired
      if (cachedProducts.length > 0) {
        return NextResponse.json({
          products: cachedProducts.map(formatCachedProduct),
          fromCache: true,
          totalCount: cachedProducts.length,
          warning: 'ICA API unavailable, showing cached results',
        })
      }

      return NextResponse.json(
        { error: 'Failed to fetch from ICA API' },
        { status: 502 }
      )
    }

    const icaData = await icaResponse.json()
    const products: ICAProduct[] = icaData.products || []

    // Cache the results (24h TTL)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    for (const product of products) {
      await prisma.iCAProductCache.upsert({
        where: { icaProductId: product.id },
        update: {
          name: product.name,
          price: product.price,
          comparePrice: product.comparePrice,
          imageUrl: product.imageUrl,
          categoryPath: product.categoryPath,
          offer: product.offer ? JSON.parse(JSON.stringify(product.offer)) : null,
          ean: product.ean,
          storeId,
          cachedAt: new Date(),
          expiresAt,
        },
        create: {
          icaProductId: product.id,
          name: product.name,
          price: product.price,
          comparePrice: product.comparePrice,
          imageUrl: product.imageUrl,
          categoryPath: product.categoryPath,
          offer: product.offer ? JSON.parse(JSON.stringify(product.offer)) : null,
          ean: product.ean,
          storeId,
          expiresAt,
        },
      })
    }

    return NextResponse.json({
      products: products.map(formatICAProduct),
      fromCache: false,
      totalCount: icaData.totalCount || products.length,
    })
  } catch (error) {
    console.error('Error in ICA search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Format cached product for response
function formatCachedProduct(product: any) {
  return {
    id: product.icaProductId,
    name: product.name,
    price: Number(product.price),
    comparePrice: product.comparePrice,
    imageUrl: product.imageUrl,
    categoryPath: product.categoryPath,
    offer: product.offer,
    ean: product.ean,
  }
}

// Format ICA API product for response
function formatICAProduct(product: ICAProduct) {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    imageUrl: product.imageUrl,
    categoryPath: product.categoryPath,
    offer: product.offer,
    ean: product.ean,
  }
}
