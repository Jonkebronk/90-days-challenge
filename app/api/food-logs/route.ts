import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-logs - List food logs for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateStr = searchParams.get('date') // YYYY-MM-DD
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      userId: session.user.id
    }

    if (dateStr) {
      // Filter by specific date
      const date = new Date(dateStr)
      where.date = date
    }

    const [logs, total] = await Promise.all([
      prisma.foodLog.findMany({
        where,
        include: {
          items: {
            orderBy: { orderIndex: 'asc' },
            include: {
              product: true
            }
          }
        },
        orderBy: { time: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.foodLog.count({ where })
    ])

    return NextResponse.json({
      logs,
      total,
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching food logs:', error)
    return NextResponse.json({ error: 'Failed to fetch food logs' }, { status: 500 })
  }
}

// POST /api/food-logs - Create new food log entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { type, date, items, image, notes } = body

    if (!type || !items || items.length === 0) {
      return NextResponse.json({ error: 'Type and items are required' }, { status: 400 })
    }

    // Calculate totals
    const totals = items.reduce(
      (acc: any, item: any) => ({
        kcal: acc.kcal + (item.kcal || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0)
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    )

    const logDate = date ? new Date(date) : new Date()
    // Normalize to date only (strip time)
    logDate.setHours(0, 0, 0, 0)

    const foodLog = await prisma.foodLog.create({
      data: {
        userId: session.user.id,
        type,
        date: logDate,
        image: image || null,
        notes: notes || null,
        totalKcal: totals.kcal,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        items: {
          create: items.map((item: any, index: number) => ({
            productId: item.productId || null,
            name: item.name,
            portionG: item.portionG || item.portion_g || 0,
            kcal: item.kcal || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
            orderIndex: index
          }))
        }
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json({ foodLog }, { status: 201 })
  } catch (error) {
    console.error('Error creating food log:', error)
    return NextResponse.json({ error: 'Failed to create food log' }, { status: 500 })
  }
}
