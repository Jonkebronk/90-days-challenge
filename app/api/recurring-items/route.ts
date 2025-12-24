import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recurring-items - Hämta användarens återkommande varor
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const recurringItems = await prisma.recurringItem.findMany({
      where: {
        userId: session.user.id,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        foodItem: true,
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ items: recurringItems })
  } catch (error) {
    console.error('Error fetching recurring items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring items' },
      { status: 500 }
    )
  }
}

// POST /api/recurring-items - Lägg till en återkommande vara
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      icaProductId,
      foodItemId,
      customName,
      quantity = 1,
      unit = 'st',
      category = 'Övrigt',
      frequency = 'weekly',
      icaProductData,
    } = body

    if (!customName && !icaProductId && !foodItemId) {
      return NextResponse.json(
        { error: 'customName, icaProductId, or foodItemId is required' },
        { status: 400 }
      )
    }

    // Kolla om varan redan finns som återkommande
    const existing = await prisma.recurringItem.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          icaProductId ? { icaProductId } : {},
          foodItemId ? { foodItemId } : {},
          customName ? { customName } : {},
        ].filter((o) => Object.keys(o).length > 0),
      },
    })

    if (existing) {
      // Uppdatera befintlig istället
      const updated = await prisma.recurringItem.update({
        where: { id: existing.id },
        data: {
          quantity,
          unit,
          category,
          frequency,
          isActive: true,
          icaProductData: icaProductData || existing.icaProductData,
        },
        include: {
          foodItem: true,
        },
      })

      return NextResponse.json({ item: updated, updated: true })
    }

    const item = await prisma.recurringItem.create({
      data: {
        userId: session.user.id,
        icaProductId,
        foodItemId,
        customName,
        quantity,
        unit,
        category,
        frequency,
        icaProductData: icaProductData || null,
      },
      include: {
        foodItem: true,
      },
    })

    return NextResponse.json({ item }, { status: 201 })
  } catch (error) {
    console.error('Error creating recurring item:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring item' },
      { status: 500 }
    )
  }
}

// PATCH /api/recurring-items - Uppdatera en återkommande vara
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, quantity, unit, category, frequency, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // Verifiera ägare
    const existing = await prisma.recurringItem.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring item not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.recurringItem.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(category !== undefined && { category }),
        ...(frequency !== undefined && { frequency }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        foodItem: true,
      },
    })

    return NextResponse.json({ item: updated })
  } catch (error) {
    console.error('Error updating recurring item:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring item' },
      { status: 500 }
    )
  }
}

// DELETE /api/recurring-items - Ta bort en återkommande vara
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      )
    }

    // Verifiera ägare
    const existing = await prisma.recurringItem.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Recurring item not found' },
        { status: 404 }
      )
    }

    await prisma.recurringItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting recurring item:', error)
    return NextResponse.json(
      { error: 'Failed to delete recurring item' },
      { status: 500 }
    )
  }
}
