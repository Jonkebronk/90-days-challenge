import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  if (!category) {
    return NextResponse.json({ error: 'Category required' }, { status: 400 })
  }

  try {
    // Hämta alla unika subkategorier för denna kategori med count
    const subcategories = await prisma.product.groupBy({
      by: ['subCategory'],
      where: {
        category: { equals: category, mode: 'insensitive' },
        subCategory: { not: null },
      },
      _count: { subCategory: true },
      orderBy: { _count: { subCategory: 'desc' } }
    })

    const total = await prisma.product.count({
      where: { category: { equals: category, mode: 'insensitive' } }
    })

    return NextResponse.json({
      category,
      total,
      subcategories: subcategories.reduce((acc, sub) => {
        if (sub.subCategory) {
          acc[sub.subCategory] = sub._count.subCategory
        }
        return acc
      }, {} as Record<string, number>)
    })
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
  }
}
