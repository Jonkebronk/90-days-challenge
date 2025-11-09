import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/meal-plan-templates/[id]/assign - Assign template to client(s)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user (coach)
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email! },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const body = await request.json()
    const { clientIds } = body // Array of client IDs

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json(
        { error: 'Client IDs are required' },
        { status: 400 }
      )
    }

    // Verify template exists
    const template = await prisma.mealPlanTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Create assignments for each client
    const assignments = await Promise.all(
      clientIds.map(async (clientId: string) => {
        // Check if assignment already exists
        const existing = await prisma.mealPlanTemplateAssignment.findUnique({
          where: {
            userId_templateId: {
              userId: clientId,
              templateId: id,
            },
          },
        })

        if (existing) {
          // Update existing assignment to active
          return prisma.mealPlanTemplateAssignment.update({
            where: { id: existing.id },
            data: { active: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        }

        // Create new assignment
        return prisma.mealPlanTemplateAssignment.create({
          data: {
            userId: clientId,
            templateId: id,
            coachId: coach.id,
            active: true,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })
      })
    )

    return NextResponse.json({ assignments })
  } catch (error: any) {
    console.error('Error assigning meal plan template:', error)
    return NextResponse.json(
      {
        error: 'Failed to assign meal plan template',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// DELETE /api/meal-plan-templates/[id]/assign - Unassign template from client
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

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    await prisma.mealPlanTemplateAssignment.deleteMany({
      where: {
        userId: clientId,
        templateId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error unassigning meal plan template:', error)
    return NextResponse.json(
      {
        error: 'Failed to unassign meal plan template',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
