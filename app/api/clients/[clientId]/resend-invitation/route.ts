import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = (session.user as any).role?.toLowerCase()
    if (userRole !== 'coach') {
      return NextResponse.json(
        { error: 'Endast coaches kan skicka inbjudningar' },
        { status: 403 }
      )
    }

    const { clientId } = await params

    // Get the coach info
    const coach = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true },
    })

    // Find the client and verify coach relationship
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        coachId: true,
        role: true,
        status: true,
        invitationToken: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Klienten hittades inte' },
        { status: 404 }
      )
    }

    // Verify the coach owns this client
    if (client.coachId !== session.user.id) {
      return NextResponse.json(
        { error: 'Du har inte behörighet att skicka inbjudan till denna klient' },
        { status: 403 }
      )
    }

    // Verify it's actually a client
    if (client.role !== 'client') {
      return NextResponse.json(
        { error: 'Kan endast skicka inbjudan till klienter' },
        { status: 400 }
      )
    }

    if (!client.email) {
      return NextResponse.json(
        { error: 'Klienten har ingen e-postadress' },
        { status: 400 }
      )
    }

    // Check if client already has an active account
    if (client.status === 'active') {
      return NextResponse.json(
        { error: 'Klienten har redan ett aktivt konto. Använd "Återställ lösenord" istället.' },
        { status: 400 }
      )
    }

    // Use existing invitation token or generate new one if missing
    let invitationToken = client.invitationToken
    if (!invitationToken) {
      const crypto = await import('crypto')
      invitationToken = crypto.randomBytes(32).toString('hex')

      await prisma.user.update({
        where: { id: clientId },
        data: {
          invitationToken,
          invitationSentAt: new Date(),
        },
      })
    } else {
      // Update invitation sent timestamp
      await prisma.user.update({
        where: { id: clientId },
        data: { invitationSentAt: new Date() },
      })
    }

    // Send invitation email
    const invitationUrl = `${process.env.NEXTAUTH_URL}/setup-account?token=${invitationToken}`
    const clientName = client.name || `${client.firstName} ${client.lastName}`
    const emailSent = await sendInvitationEmail(
      client.email,
      invitationUrl,
      clientName,
      coach?.name || undefined
    )

    if (!emailSent) {
      return NextResponse.json({
        success: false,
        error: 'E-postutskicket misslyckades. Kontrollera att RESEND_API_KEY är konfigurerad.',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Inbjudan har skickats till ${client.email}`,
    })
  } catch (error) {
    console.error('Resend invitation error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod. Försök igen senare.' },
      { status: 500 }
    )
  }
}
