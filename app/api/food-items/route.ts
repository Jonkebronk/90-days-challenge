import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/food-items - List/search food items with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    const isCoach = user?.role === 'coach'

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId')
    const categorySlug = searchParams.get('categorySlug')
    const isRecommended = searchParams.get('isRecommended')
    const isApproved = searchParams.get('isApproved')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')
    const limit = limitParam ? parseInt(limitParam, 10) : 50
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    // Build where clause
    const where: any = {}

    // Search by name
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Filter by category ID
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by category slug
    if (categorySlug) {
      where.foodCategory = {
        slug: categorySlug,
      }
    }

    // Filter by recommended
    if (isRecommended === 'true') {
      where.isRecommended = true
    } else if (isRecommended === 'false') {
      where.isRecommended = false
    }

    // Filter by approved
    // Clients only see approved items, coaches see all
    if (!isCoach) {
      where.isApproved = true
    } else if (isApproved === 'true') {
      where.isApproved = true
    } else if (isApproved === 'false') {
      where.isApproved = false
    }

    const foodItems = await prisma.foodItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        categoryId: true,
        calories: true,
        proteinG: true,
        carbsG: true,
        fatG: true,
        commonServingSize: true,
        imageUrl: true,
        isRecommended: true,
        notes: true,
        isApproved: true,
        isVegetarian: true,
        isVegan: true,
        foodCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: {
        name: 'asc',
      },
    })

    // Get total count for pagination
    const total = await prisma.foodItem.count({ where })

    return NextResponse.json({
      items: foodItems,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching food items:', error)
    return NextResponse.json({ error: 'Failed to fetch food items' }, { status: 500 })
  }
}

// POST /api/food-items - Create new food item (coach only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is coach
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'coach') {
      return NextResponse.json({ error: 'Forbidden: Coach access required' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      categoryId,
      imageUrl,
      notes,
    } = body

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        categoryId,
        imageUrl: imageUrl || null,
        notes: notes || null,
        isApproved: true, // Auto-approve when coach creates
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
      include: {
        foodCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
      },
    })

    return NextResponse.json({ item: foodItem }, { status: 201 })
  } catch (error) {
    console.error('Error creating food item:', error)
    return NextResponse.json({ error: 'Failed to create food item' }, { status: 500 })
  }
}
