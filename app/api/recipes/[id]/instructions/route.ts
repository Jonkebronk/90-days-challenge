import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipes/[id]/instructions - Fetch all instructions for a recipe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recipeId } = await params

    const instructions = await prisma.recipeInstruction.findMany({
      where: { recipeId },
      orderBy: { stepNumber: 'asc' },
    })

    return NextResponse.json({ instructions })
  } catch (error) {
    console.error('Error fetching instructions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructions' },
      { status: 500 }
    )
  }
}

// POST /api/recipes/[id]/instructions - Add a new instruction
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

    const { instruction, duration, imageUrl } = body

    if (!instruction) {
      return NextResponse.json(
        { error: 'instruction is required' },
        { status: 400 }
      )
    }

    // Get current max stepNumber
    const maxStep = await prisma.recipeInstruction.findFirst({
      where: { recipeId },
      orderBy: { stepNumber: 'desc' },
      select: { stepNumber: true },
    })

    const newInstruction = await prisma.recipeInstruction.create({
      data: {
        recipeId,
        instruction,
        duration,
        imageUrl,
        stepNumber: (maxStep?.stepNumber ?? 0) + 1,
      },
    })

    return NextResponse.json({ instruction: newInstruction }, { status: 201 })
  } catch (error) {
    console.error('Error creating instruction:', error)
    return NextResponse.json(
      { error: 'Failed to create instruction' },
      { status: 500 }
    )
  }
}
