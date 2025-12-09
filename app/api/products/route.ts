import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/products - List/search products
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')
    const ean = searchParams.get('ean')
    const category = searchParams.get('category')
    const source = searchParams.get('source')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}

    // Filter by source (database)
    if (source && source !== 'all') {
      where.source = source
    }

    if (ean) {
      where.ean = ean
    } else if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { ean: { contains: q } }
      ]
    }

    // Filter by category
    if (category) {
      if (category === 'uncategorized') {
        where.category = null
      } else {
        where.category = category
      }
    }

    const [products, total, categories, sources] = await Promise.all([
      prisma.product.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where }),
      // Get category counts (respects source filter)
      prisma.product.groupBy({
        by: ['category'],
        where: source && source !== 'all' ? { source } : undefined,
        _count: { category: true }
      }),
      // Get source counts (always show all sources)
      prisma.product.groupBy({
        by: ['source'],
        _count: { source: true }
      })
    ])

    // Transform category counts
    const categoryCounts = categories.reduce((acc: Record<string, number>, cat) => {
      const key = cat.category || 'uncategorized'
      acc[key] = cat._count.category
      return acc
    }, {})

    // Transform source counts
    const sourceCounts = sources.reduce((acc: Record<string, number>, src) => {
      acc[src.source] = src._count.source
      return acc
    }, {})

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
      categoryCounts,
      sourceCounts
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

// POST /api/products - Create new product
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ean, name, brand, category, image, kcal, protein, carbs, fat, fiber, source } = body

    if (!ean || !name) {
      return NextResponse.json({ error: 'EAN and name are required' }, { status: 400 })
    }

    // Check if product already exists
    const existing = await prisma.product.findUnique({ where: { ean } })
    if (existing) {
      return NextResponse.json({ error: 'Product with this EAN already exists', product: existing }, { status: 409 })
    }

    const product = await prisma.product.create({
      data: {
        ean,
        name,
        brand: brand || null,
        category: category || null,
        image: image || null,
        kcal: kcal || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        fiber: fiber || null,
        source: source || 'manual'
      }
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
