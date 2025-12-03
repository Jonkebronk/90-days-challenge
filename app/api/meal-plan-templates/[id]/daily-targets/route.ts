import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch daily targets for a template
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: templateId } = await params

    const template = await prisma.mealPlanTemplate.findUnique({
      where: { id: templateId },
      include: {
        dailyTargets: {
          orderBy: { dayOfWeek: 'asc' }
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({
      useDifferentDailyTargets: template.useDifferentDailyTargets,
      dailyTargets: template.dailyTargets
    })
  } catch (error) {
    console.error('Error fetching template daily targets:', error)
    return NextResponse.json({ error: 'Failed to fetch daily targets' }, { status: 500 })
  }
}

// POST - Create or update daily targets for a template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isCoach = (session.user as any).role?.toUpperCase() === 'COACH'
    if (!isCoach) {
      return NextResponse.json({ error: 'Only coaches can edit templates' }, { status: 403 })
    }

    const { id: templateId } = await params
    const body = await request.json()
    const { useDifferentDailyTargets, targets } = body

    // Verify template exists
    const template = await prisma.mealPlanTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Update the template's useDifferentDailyTargets flag
    await prisma.mealPlanTemplate.update({
      where: { id: templateId },
      data: { useDifferentDailyTargets }
    })

    // If using different daily targets, upsert each target
    if (useDifferentDailyTargets && targets && Array.isArray(targets)) {
      const results = await Promise.all(
        targets.map(async (target: {
          dayOfWeek: number
          dayName?: string
          calories: number
          protein: number
          fat: number
          carbs: number
        }) => {
          return prisma.templateDailyTarget.upsert({
            where: {
              templateId_dayOfWeek: {
                templateId,
                dayOfWeek: target.dayOfWeek
              }
            },
            update: {
              dayName: target.dayName || null,
              calories: target.calories,
              protein: target.protein,
              fat: target.fat,
              carbs: target.carbs
            },
            create: {
              templateId,
              dayOfWeek: target.dayOfWeek,
              dayName: target.dayName || null,
              calories: target.calories,
              protein: target.protein,
              fat: target.fat,
              carbs: target.carbs
            }
          })
        })
      )

      return NextResponse.json({
        success: true,
        useDifferentDailyTargets,
        dailyTargets: results
      })
    }

    return NextResponse.json({
      success: true,
      useDifferentDailyTargets
    })
  } catch (error) {
    console.error('Error saving template daily targets:', error)
    return NextResponse.json({ error: 'Failed to save daily targets' }, { status: 500 })
  }
}
