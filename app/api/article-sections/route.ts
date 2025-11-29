import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/article-sections - Get all sections
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const audience = searchParams.get('audience') || 'client'

    const sections = await prisma.articleSection.findMany({
      where: { audience },
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

// POST /api/article-sections - Create or update section
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, audience = 'client', orderIndex } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Get current max orderIndex if not provided
    let finalOrderIndex = orderIndex
    if (finalOrderIndex === undefined) {
      const existingSections = await prisma.articleSection.findMany({
        where: { audience },
        select: { orderIndex: true }
      })
      finalOrderIndex = existingSections.length > 0
        ? Math.max(...existingSections.map(s => s.orderIndex)) + 1
        : 0
    }

    const section = await prisma.articleSection.upsert({
      where: {
        name_audience: { name, audience }
      },
      update: {
        orderIndex: finalOrderIndex
      },
      create: {
        name,
        audience,
        orderIndex: finalOrderIndex
      }
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Error creating/updating section:', error)
    return NextResponse.json({ error: 'Failed to create/update section' }, { status: 500 })
  }
}

// PATCH /api/article-sections - Reorder sections
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sections } = body // Array of { id, orderIndex }

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'Sections array is required' }, { status: 400 })
    }

    // Update all sections in a transaction
    await prisma.$transaction(
      sections.map((s: { id: string; orderIndex: number }) =>
        prisma.articleSection.update({
          where: { id: s.id },
          data: { orderIndex: s.orderIndex }
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering sections:', error)
    return NextResponse.json({ error: 'Failed to reorder sections' }, { status: 500 })
  }
}

// DELETE /api/article-sections - Delete a section
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    await prisma.articleSection.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting section:', error)
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 })
  }
}
