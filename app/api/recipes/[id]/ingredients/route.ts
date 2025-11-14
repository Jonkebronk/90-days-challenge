import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipes/[id]/ingredients - Fetch all ingredients for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params

    const ingredients = await prisma.recipeIngredient.findMany({
      where: { recipeId },
      include: {
        foodItem: true,
      },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({ ingredients })
  } catch (error) {
    console.error('Error fetching ingredients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ingredients' },
      { status: 500 }
    )
  }
}

// POST /api/recipes/[id]/ingredients - Add a new ingredient
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: recipeId } = await params
    const body = await request.json()

    const {
      foodItemId,
      amount,
      displayUnit,
      displayAmount,
      optional = false,
      notes,
    } = body

    if (!foodItemId || amount === undefined) {
      return NextResponse.json(
        { error: 'foodItemId and amount are required' },
        { status: 400 }
      )
    }

    // Get current max orderIndex
    const maxOrder = await prisma.recipeIngredient.findFirst({
      where: { recipeId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const ingredient = await prisma.recipeIngredient.create({
      data: {
        recipeId,
        foodItemId,
        amount,
        displayUnit,
        displayAmount,
        optional,
        notes,
        orderIndex: (maxOrder?.orderIndex ?? -1) + 1,
      },
      include: {
        foodItem: true,
      },
    })

    return NextResponse.json({ ingredient }, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to create ingredient' },
      { status: 500 }
    )
  }
}
