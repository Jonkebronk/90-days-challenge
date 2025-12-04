import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNewPasswordEmail } from '@/lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Generate a random temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

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
        { error: 'Endast coaches kan återställa lösenord' },
        { status: 403 }
      )
    }

    const { clientId } = await params

    // Find the client and verify coach relationship
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        name: true,
        coachId: true,
        role: true,
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
        { error: 'Du har inte behörighet att återställa denna klients lösenord' },
        { status: 403 }
      )
    }

    // Verify it's actually a client
    if (client.role !== 'client') {
      return NextResponse.json(
        { error: 'Kan endast återställa lösenord för klienter' },
        { status: 400 }
      )
    }

    if (!client.email) {
      return NextResponse.json(
        { error: 'Klienten har ingen e-postadress' },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()

    // Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Update user password
    await prisma.user.update({
      where: { id: clientId },
      data: { password: hashedPassword },
    })

    // Send email with new password
    const emailSent = await sendNewPasswordEmail(
      client.email,
      tempPassword,
      client.name || undefined
    )

    if (!emailSent) {
      // Password is still updated, just warn about email
      return NextResponse.json({
        success: true,
        warning: 'Lösenordet har återställts men e-postutskicket misslyckades.',
        tempPassword, // Include so coach can share manually if email fails
      })
    }

    return NextResponse.json({
      success: true,
      message: `Lösenordet har återställts och skickats till ${client.email}`,
    })
  } catch (error) {
    console.error('Reset client password error:', error)
    return NextResponse.json(
      { error: 'Ett fel uppstod. Försök igen senare.' },
      { status: 500 }
    )
  }
}
