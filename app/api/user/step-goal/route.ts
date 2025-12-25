import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/step-goal - Get user's step goal
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stepGoal: true },
    })

    return NextResponse.json({ stepGoal: user?.stepGoal || 10000 })
  } catch (error) {
    console.error('Error fetching step goal:', error)
    return NextResponse.json({ error: 'Failed to fetch step goal' }, { status: 500 })
  }
}

// PUT /api/user/step-goal - Update user's step goal
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id as string
    const { stepGoal } = await req.json()

    if (typeof stepGoal !== 'number' || stepGoal < 1000 || stepGoal > 100000) {
      return NextResponse.json(
        { error: 'Step goal must be between 1000 and 100000' },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: { stepGoal },
    })

    return NextResponse.json({ success: true, stepGoal })
  } catch (error) {
    console.error('Error updating step goal:', error)
    return NextResponse.json({ error: 'Failed to update step goal' }, { status: 500 })
  }
}
