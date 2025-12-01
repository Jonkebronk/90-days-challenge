import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Add article to subcategory
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; subcategoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: branchId, subcategoryId } = await params
    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 })
    }

    // Get max orderInBranch for this subcategory
    const maxOrder = await prisma.article.aggregate({
      where: { skillTreeSubcategoryId: subcategoryId },
      _max: { orderInBranch: true }
    })

    // Update article to belong to this branch and subcategory
    await prisma.article.update({
      where: { id: articleId },
      data: {
        skillTreeBranchId: branchId,
        skillTreeSubcategoryId: subcategoryId,
        orderInBranch: (maxOrder._max.orderInBranch ?? -1) + 1
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding article to subcategory:', error)
    return NextResponse.json({ error: 'Failed to add article' }, { status: 500 })
  }
}

// DELETE - Remove article from subcategory
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; subcategoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json({ error: 'articleId is required' }, { status: 400 })
    }

    // Remove article from subcategory (but keep in branch)
    await prisma.article.update({
      where: { id: articleId },
      data: {
        skillTreeSubcategoryId: null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing article from subcategory:', error)
    return NextResponse.json({ error: 'Failed to remove article' }, { status: 500 })
  }
}

// PATCH - Reorder articles within subcategory
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subcategoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { articleIds } = body

    if (!articleIds || !Array.isArray(articleIds)) {
      return NextResponse.json({ error: 'articleIds array is required' }, { status: 400 })
    }

    // Update orderInBranch for each article
    await Promise.all(
      articleIds.map((id: string, index: number) =>
        prisma.article.update({
          where: { id },
          data: { orderInBranch: index }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering articles:', error)
    return NextResponse.json({ error: 'Failed to reorder articles' }, { status: 500 })
  }
}
