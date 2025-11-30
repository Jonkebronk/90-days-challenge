import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Add article to branch
export async function POST(
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
      return NextResponse.json({ error: 'Only coaches can modify branches' }, { status: 403 })
    }

    const { id: branchId } = await params
    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 })
    }

    // Get the highest orderInBranch for this branch
    const lastArticle = await prisma.article.findFirst({
      where: { skillTreeBranchId: branchId },
      orderBy: { orderInBranch: 'desc' }
    })

    // Update the article to assign it to this branch
    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        skillTreeBranchId: branchId,
        orderInBranch: (lastArticle?.orderInBranch ?? -1) + 1
      }
    })

    return NextResponse.json({ article })
  } catch (error) {
    console.error('Error adding article to branch:', error)
    return NextResponse.json(
      { error: 'Failed to add article to branch' },
      { status: 500 }
    )
  }
}

// DELETE - Remove article from branch
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
      return NextResponse.json({ error: 'Only coaches can modify branches' }, { status: 403 })
    }

    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 })
    }

    // Remove article from branch
    await prisma.article.update({
      where: { id: articleId },
      data: {
        skillTreeBranchId: null,
        orderInBranch: 0
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing article from branch:', error)
    return NextResponse.json(
      { error: 'Failed to remove article from branch' },
      { status: 500 }
    )
  }
}

// PATCH - Reorder articles within branch
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
      return NextResponse.json({ error: 'Only coaches can modify branches' }, { status: 403 })
    }

    const { id: branchId } = await params
    const body = await request.json()
    const { articleIds } = body // Array of article IDs in new order

    if (!Array.isArray(articleIds)) {
      return NextResponse.json({ error: 'articleIds array is required' }, { status: 400 })
    }

    // Update each article's orderInBranch
    await Promise.all(
      articleIds.map((articleId, index) =>
        prisma.article.update({
          where: { id: articleId },
          data: { orderInBranch: index }
        })
      )
    )

    // Fetch updated branch with articles
    const branch = await prisma.skillTreeBranch.findUnique({
      where: { id: branchId },
      include: {
        articles: {
          orderBy: { orderInBranch: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            orderInBranch: true,
            published: true,
            estimatedReadingMinutes: true
          }
        }
      }
    })

    return NextResponse.json({ branch })
  } catch (error) {
    console.error('Error reordering articles:', error)
    return NextResponse.json(
      { error: 'Failed to reorder articles' },
      { status: 500 }
    )
  }
}
