import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/faq-categories/[id] - Get single category with questions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const category = await prisma.faqCategory.findUnique({
      where: { id },
      include: {
        questions: {
          where: { published: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching FAQ category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FAQ category' },
      { status: 500 }
    )
  }
}

// PATCH /api/faq-categories/[id] - Update category (coach only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const category = await prisma.faqCategory.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        orderIndex: body.orderIndex,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating FAQ category:', error)
    return NextResponse.json(
      { error: 'Failed to update FAQ category' },
      { status: 500 }
    )
  }
}

// DELETE /api/faq-categories/[id] - Delete category (coach only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.faqCategory.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting FAQ category:', error)
    return NextResponse.json(
      { error: 'Failed to delete FAQ category' },
      { status: 500 }
    )
  }
}
