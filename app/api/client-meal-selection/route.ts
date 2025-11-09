import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/client-meal-selection - Client selects a meal option
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { templateMealId, selectedOptionId } = body

    if (!templateMealId || !selectedOptionId) {
      return NextResponse.json(
        { error: 'Template meal ID and selected option ID are required' },
        { status: 400 }
      )
    }

    // Verify the option belongs to the meal
    const option = await prisma.templateMealOption.findUnique({
      where: { id: selectedOptionId },
    })

    if (!option || option.templateMealId !== templateMealId) {
      return NextResponse.json(
        { error: 'Invalid meal option' },
        { status: 400 }
      )
    }

    // Create or update selection
    const selection = await prisma.clientMealSelection.upsert({
      where: {
        userId_templateMealId: {
          userId: user.id,
          templateMealId,
        },
      },
      update: {
        selectedOptionId,
      },
      create: {
        userId: user.id,
        templateMealId,
        selectedOptionId,
      },
      include: {
        selectedOption: {
          include: {
            recipe: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                prepTimeMinutes: true,
                cookTimeMinutes: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ selection })
  } catch (error: any) {
    console.error('Error saving meal selection:', error)
    return NextResponse.json(
      {
        error: 'Failed to save meal selection',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET /api/client-meal-selection - Get client's meal selections
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const selections = await prisma.clientMealSelection.findMany({
      where: { userId: user.id },
      include: {
        templateMeal: true,
        selectedOption: {
          include: {
            recipe: true,
          },
        },
      },
    })

    return NextResponse.json({ selections })
  } catch (error) {
    console.error('Error fetching meal selections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal selections' },
      { status: 500 }
    )
  }
}
