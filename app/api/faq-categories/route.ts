import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/faq-categories - Get all FAQ categories
export async function GET(request: Request) {
  try {
    const categories = await prisma.faqCategory.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching FAQ categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQ categories' },
      { status: 500 }
    )
  }
}

// POST /api/faq-categories - Create new FAQ category (coach only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Kategorinamn är obligatoriskt' },
        { status: 400 }
      )
    }

    // Auto-generate slug from name
    const slug = body.slug || body.name.toLowerCase()
      .replace(/å/g, 'a')
      .replace(/ä/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug already exists
    const existing = await prisma.faqCategory.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: `En kategori med namnet "${body.name}" finns redan` },
        { status: 409 }
      )
    }

    const category = await prisma.faqCategory.create({
      data: {
        name: body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        orderIndex: body.orderIndex || 0,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating FAQ category:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod när kategorin skulle skapas' },
      { status: 500 }
    )
  }
}
