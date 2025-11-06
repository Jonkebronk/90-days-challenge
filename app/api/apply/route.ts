import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/apply - Public endpoint for application submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, status, notes, tags } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Namn, e-post och telefon är obligatoriska' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ogiltig e-postadress' },
        { status: 400 }
      )
    }

    // Check if lead with this email already exists
    const existingLead = await prisma.lead.findFirst({
      where: { email }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'En ansökan med denna e-post existerar redan' },
        { status: 400 }
      )
    }

    // Create the lead
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        status: status || 'new',
        notes: notes || '',
        tags: tags || ['web-ansokan'],
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Ansökan mottagen framgångsrikt',
      leadId: lead.id,
    })
  } catch (error: any) {
    console.error('Failed to create application:', error)
    return NextResponse.json(
      {
        error: 'Ett fel uppstod vid hantering av din ansökan',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
