import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/messenger-faqs - Get FAQs for the current user's role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role?.toLowerCase() || 'client'
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    // Build where clause
    const where: any = {
      isActive: true,
      OR: [
        { forRole: 'both' },
        { forRole: userRole }
      ]
    }

    if (category) {
      where.category = category
    }

    const faqs = await prisma.messengerFAQ.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // Group by category
    const grouped = faqs.reduce((acc, faq) => {
      if (!acc[faq.category]) {
        acc[faq.category] = []
      }
      acc[faq.category].push(faq)
      return acc
    }, {} as Record<string, typeof faqs>)

    return NextResponse.json({ faqs, grouped })
  } catch (error) {
    console.error('Error fetching FAQs:', error)
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 })
  }
}

// POST /api/messenger-faqs - Create a new FAQ (coach only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = (session.user as any).role?.toUpperCase()
    if (userRole !== 'COACH' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { question, answer, category, forRole, sortOrder } = body

    if (!question || !answer || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const faq = await prisma.messengerFAQ.create({
      data: {
        question,
        answer,
        category,
        forRole: forRole || 'both',
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json({ faq })
  } catch (error) {
    console.error('Error creating FAQ:', error)
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 })
  }
}
