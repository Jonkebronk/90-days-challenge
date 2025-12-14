import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/recipe-requests - Get all requests (coach) or user's requests (client)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isCoach = (session.user as any).role === 'coach'

    const requests = await prisma.recipeRequest.findMany({
      where: isCoach ? {} : { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error fetching recipe requests:', error)
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}

// POST /api/recipe-requests - Create new recipe request (client)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, categoryId, image } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Titel krävs' }, { status: 400 })
    }

    const recipeRequest = await prisma.recipeRequest.create({
      data: {
        userId: session.user.id as string,
        title: title.trim(),
        description: description?.trim() || null,
        categoryId: categoryId || null,
        image: image || null,
        status: 'pending'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({ request: recipeRequest })
  } catch (error) {
    console.error('Error creating recipe request:', error)
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
  }
}
