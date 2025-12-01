import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch single branch with articles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const branch = await prisma.skillTreeBranch.findUnique({
      where: { id },
      include: {
        articles: {
          where: { skillTreeSubcategoryId: null }, // Only articles NOT in a subcategory
          orderBy: { orderInBranch: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            orderInBranch: true,
            published: true,
            estimatedReadingMinutes: true,
            skillTreeSubcategoryId: true,
            progress: session?.user?.id ? {
              where: { userId: session.user.id as string }
            } : false
          }
        },
        subcategories: {
          orderBy: { orderIndex: 'asc' },
          include: {
            articles: {
              orderBy: { orderInBranch: 'asc' },
              select: {
                id: true,
                title: true,
                slug: true,
                orderInBranch: true,
                published: true,
                estimatedReadingMinutes: true,
                skillTreeSubcategoryId: true,
                progress: session?.user?.id ? {
                  where: { userId: session.user.id as string }
                } : false
              }
            }
          }
        }
      }
    })

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    return NextResponse.json(branch)
  } catch (error) {
    console.error('Error fetching branch:', error)
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
      { status: 500 }
    )
  }
}

// PATCH - Update branch (coaches only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role?.toUpperCase() !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can update branches' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, icon, color, categorySlugs } = body

    const branch = await prisma.skillTreeBranch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(categorySlugs !== undefined && { categorySlugs })
      }
    })

    return NextResponse.json({ branch })
  } catch (error) {
    console.error('Error updating branch:', error)
    return NextResponse.json(
      { error: 'Failed to update branch' },
      { status: 500 }
    )
  }
}

// DELETE - Delete branch (coaches only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role?.toUpperCase() !== 'COACH') {
      return NextResponse.json({ error: 'Only coaches can delete branches' }, { status: 403 })
    }

    const { id } = await params

    await prisma.skillTreeBranch.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting branch:', error)
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    )
  }
}
