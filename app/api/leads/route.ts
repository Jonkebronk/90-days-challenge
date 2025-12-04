import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const includeConverted = searchParams.get('includeConverted') === 'true'

    // By default, exclude leads with status 'won' (converted to clients)
    // unless specifically requested or filtering by that status
    let where: any = {}

    if (status) {
      where.status = status
    } else if (!includeConverted) {
      // Exclude converted leads by default
      where.status = { not: 'won' }
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      leads,
    })
  } catch (error) {
    console.error('Failed to fetch leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, fullName, email, phone, status, notes, tags } = body

    // Use fullName if provided, otherwise use name for backwards compatibility
    const leadName = fullName || name

    if (!leadName) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.create({
      data: {
        fullName: leadName,
        email,
        phone,
        status: status || 'NEW',
        notes,
        tags: tags || [],
      },
    })

    return NextResponse.json({
      success: true,
      lead,
    })
  } catch (error) {
    console.error('Failed to create lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
