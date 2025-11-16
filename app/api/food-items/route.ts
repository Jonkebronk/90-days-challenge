import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    const foodItems = await prisma.foodItem.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        commonServingSize: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ items: foodItems })
  } catch (error) {
    console.error('Error fetching food items:', error)
    return NextResponse.json({ error: 'Failed to fetch food items' }, { status: 500 })
  }
}
