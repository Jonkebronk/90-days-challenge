import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/recipes/[id]/instructions/[instructionId] - Update instruction
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; instructionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instructionId } = await params
    const body = await request.json()

    const { instruction, duration, imageUrl, stepNumber } = body

    const updated = await prisma.recipeInstruction.update({
      where: { id: instructionId },
      data: {
        ...(instruction !== undefined && { instruction }),
        ...(duration !== undefined && { duration }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(stepNumber !== undefined && { stepNumber }),
      },
    })

    return NextResponse.json({ instruction: updated })
  } catch (error) {
    console.error('Error updating instruction:', error)
    return NextResponse.json(
      { error: 'Failed to update instruction' },
      { status: 500 }
    )
  }
}

// DELETE /api/recipes/[id]/instructions/[instructionId] - Delete instruction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; instructionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: recipeId, instructionId } = await params

    // Delete the instruction
    await prisma.recipeInstruction.delete({
      where: { id: instructionId },
    })

    // Renumber remaining instructions
    const remaining = await prisma.recipeInstruction.findMany({
      where: { recipeId },
      orderBy: { stepNumber: 'asc' },
    })

    // Update step numbers sequentially
    await Promise.all(
      remaining.map((inst, index) =>
        prisma.recipeInstruction.update({
          where: { id: inst.id },
          data: { stepNumber: index + 1 },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting instruction:', error)
    return NextResponse.json(
      { error: 'Failed to delete instruction' },
      { status: 500 }
    )
  }
}
