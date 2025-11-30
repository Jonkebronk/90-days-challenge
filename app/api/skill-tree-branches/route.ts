import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all branches with optional articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeArticles = searchParams.get('includeArticles') === 'true'
    const userId = searchParams.get('userId')

    const branches = await prisma.skillTreeBranch.findMany({
      orderBy: { orderIndex: 'asc' },
      include: includeArticles ? {
        articles: {
          where: { published: true },
          orderBy: { orderInBranch: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            orderInBranch: true,
            estimatedReadingMinutes: true,
            progress: userId ? {
              where: { userId },
              select: { completed: true }
            } : false
          }
        }
      } : undefined
    })

    return NextResponse.json({ branches })
  } catch (error) {
    console.error('Error fetching skill tree branches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}

// POST - Create a new branch (coaches only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role?.toUpperCase() !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can create branches' }, { status: 403 })
    }

    const body = await request.json()
    const { name, icon, color, categorySlugs } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get the highest orderIndex
    const lastBranch = await prisma.skillTreeBranch.findFirst({
      orderBy: { orderIndex: 'desc' }
    })

    const branch = await prisma.skillTreeBranch.create({
      data: {
        name,
        icon: icon || 'BookOpen',
        color: color || '#FFD700',
        categorySlugs: categorySlugs || [],
        orderIndex: (lastBranch?.orderIndex ?? -1) + 1
      }
    })

    return NextResponse.json({ branch }, { status: 201 })
  } catch (error) {
    console.error('Error creating skill tree branch:', error)
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    )
  }
}

// PATCH - Reorder branches (coaches only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role?.toUpperCase() !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can reorder branches' }, { status: 403 })
    }

    const body = await request.json()
    const { branchIds } = body // Array of branch IDs in new order

    if (!Array.isArray(branchIds)) {
      return NextResponse.json({ error: 'branchIds array is required' }, { status: 400 })
    }

    // Update each branch's orderIndex
    await Promise.all(
      branchIds.map((id, index) =>
        prisma.skillTreeBranch.update({
          where: { id },
          data: { orderIndex: index }
        })
      )
    )

    const branches = await prisma.skillTreeBranch.findMany({
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json({ branches })
  } catch (error) {
    console.error('Error reordering branches:', error)
    return NextResponse.json(
      { error: 'Failed to reorder branches' },
      { status: 500 }
    )
  }
}
