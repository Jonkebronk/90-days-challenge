import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/skill-tree-branches/[id]/subcategories - Get all subcategories for a branch
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: branchId } = await params

    const subcategories = await prisma.skillTreeSubcategory.findMany({
      where: { branchId },
      orderBy: { orderIndex: 'asc' },
      include: {
        articles: {
          orderBy: { orderInBranch: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            published: true,
            estimatedReadingMinutes: true,
            orderInBranch: true
          }
        }
      }
    })

    return NextResponse.json({ subcategories })
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return NextResponse.json({ error: 'Failed to fetch subcategories' }, { status: 500 })
  }
}

// POST /api/skill-tree-branches/[id]/subcategories - Create a new subcategory
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: branchId } = await params
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get the max orderIndex for this branch
    const maxOrder = await prisma.skillTreeSubcategory.aggregate({
      where: { branchId },
      _max: { orderIndex: true }
    })

    const subcategory = await prisma.skillTreeSubcategory.create({
      data: {
        name,
        branchId,
        orderIndex: (maxOrder._max.orderIndex ?? -1) + 1
      }
    })

    return NextResponse.json({ subcategory })
  } catch (error) {
    console.error('Error creating subcategory:', error)
    return NextResponse.json({ error: 'Failed to create subcategory' }, { status: 500 })
  }
}

// PATCH /api/skill-tree-branches/[id]/subcategories - Reorder subcategories
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subcategoryIds } = body

    if (!subcategoryIds || !Array.isArray(subcategoryIds)) {
      return NextResponse.json({ error: 'subcategoryIds array is required' }, { status: 400 })
    }

    // Update orderIndex for each subcategory
    await Promise.all(
      subcategoryIds.map((id: string, index: number) =>
        prisma.skillTreeSubcategory.update({
          where: { id },
          data: { orderIndex: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering subcategories:', error)
    return NextResponse.json({ error: 'Failed to reorder subcategories' }, { status: 500 })
  }
}
