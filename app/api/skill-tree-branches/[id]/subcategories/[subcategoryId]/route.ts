import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/skill-tree-branches/[id]/subcategories/[subcategoryId] - Update subcategory
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subcategoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subcategoryId } = await params
    const body = await request.json()
    const { name, articleIds } = body

    // If articleIds provided, reorder/assign articles
    if (articleIds && Array.isArray(articleIds)) {
      await Promise.all(
        articleIds.map((id: string, index: number) =>
          prisma.article.update({
            where: { id },
            data: {
              skillTreeSubcategoryId: subcategoryId,
              orderInBranch: index
            }
          })
        )
      )
      return NextResponse.json({ success: true })
    }

    // Update name
    if (name) {
      const subcategory = await prisma.skillTreeSubcategory.update({
        where: { id: subcategoryId },
        data: { name }
      })
      return NextResponse.json({ subcategory })
    }

    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  } catch (error) {
    console.error('Error updating subcategory:', error)
    return NextResponse.json({ error: 'Failed to update subcategory' }, { status: 500 })
  }
}

// DELETE /api/skill-tree-branches/[id]/subcategories/[subcategoryId] - Delete subcategory
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; subcategoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subcategoryId } = await params

    // Remove subcategory reference from articles (keep them in the branch)
    await prisma.article.updateMany({
      where: { skillTreeSubcategoryId: subcategoryId },
      data: { skillTreeSubcategoryId: null }
    })

    // Delete subcategory
    await prisma.skillTreeSubcategory.delete({
      where: { id: subcategoryId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    return NextResponse.json({ error: 'Failed to delete subcategory' }, { status: 500 })
  }
}
