import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || (session.user as any).role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Get the client
    const client = await prisma.user.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json({ error: 'Klient hittades inte' }, { status: 404 })
    }

    // Verify the client belongs to this coach
    if (client.coachId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique GOLD code
    const generateInviteCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      return `GOLD-${part1}-${part2}`
    }

    let inviteCode = generateInviteCode()

    // Ensure code is unique
    let existingCode = await prisma.user.findUnique({ where: { inviteCode } })
    while (existingCode) {
      inviteCode = generateInviteCode()
      existingCode = await prisma.user.findUnique({ where: { inviteCode } })
    }

    // Code expires in 30 days
    const inviteCodeExpiresAt = new Date()
    inviteCodeExpiresAt.setDate(inviteCodeExpiresAt.getDate() + 30)

    // Update client with new invite code
    const updatedClient = await prisma.user.update({
      where: { id: clientId },
      data: {
        inviteCode,
        inviteCodeExpiresAt,
        status: 'pending', // Set back to pending if they need a new code
      }
    })

    return NextResponse.json({
      success: true,
      inviteCode: updatedClient.inviteCode,
      inviteCodeExpiresAt: updatedClient.inviteCodeExpiresAt,
      client: {
        id: updatedClient.id,
        name: updatedClient.name,
        email: updatedClient.email,
      }
    })
  } catch (error) {
    console.error('Failed to generate invite code:', error)
    return NextResponse.json(
      { error: 'Kunde inte generera inbjudningskod' },
      { status: 500 }
    )
  }
}
