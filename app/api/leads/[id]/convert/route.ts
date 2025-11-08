import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/leads/[id]/convert - Convert lead to client
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: leadId } = await params
    const coachId = (session.user as any).id

    // Get the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Check if email already exists as a user
    if (lead.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: lead.email }
      })

      if (existingUser) {
        return NextResponse.json({
          error: 'En användare med denna e-post existerar redan'
        }, { status: 400 })
      }
    }

    // Generate a unique invite code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed similar looking chars
      const segments = 3
      const segmentLength = 4

      let code = 'GOLD'
      for (let i = 0; i < segments; i++) {
        code += '-'
        for (let j = 0; j < segmentLength; j++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
      }
      return code
    }

    let inviteCode = generateInviteCode()

    // Ensure invite code is unique
    let existingCode = await prisma.user.findUnique({
      where: { inviteCode }
    })

    while (existingCode) {
      inviteCode = generateInviteCode()
      existingCode = await prisma.user.findUnique({
        where: { inviteCode }
      })
    }

    // Create expiration date (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Create the client user
    const client = await prisma.user.create({
      data: {
        name: lead.fullName,
        email: lead.email || `lead-${leadId}@temporary.com`, // Temporary email if none provided
        phone: lead.phone,
        role: 'client',
        status: 'pending',
        coachId: coachId,
        inviteCode: inviteCode,
        inviteCodeExpiresAt: expiresAt,
        tags: lead.tags,
        membershipStatus: 'pending',
      }
    })

    // Update lead status to "won"
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'won',
        notes: lead.notes
          ? `${lead.notes}\n\nKonverterad till klient: ${new Date().toISOString()}`
          : `Konverterad till klient: ${new Date().toISOString()}`
      }
    })

    return NextResponse.json({
      client,
      inviteCode,
      message: 'Lead konverterad till klient framgångsrikt'
    })
  } catch (error: any) {
    console.error('Error converting lead to client:', error)

    return NextResponse.json({
      error: 'Failed to convert lead to client',
      details: error.message
    }, { status: 500 })
  }
}
