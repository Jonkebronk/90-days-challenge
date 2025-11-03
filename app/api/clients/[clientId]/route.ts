import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user (coach)
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const { clientId } = await params

    // Find the client with their profile
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      include: {
        userProfile: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify the client belongs to this coach
    if (client.coachId !== coach.id) {
      return NextResponse.json(
        { error: 'You can only view your own clients' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        status: client.status,
      },
      profile: client.userProfile,
    })
  } catch (error) {
    console.error('Failed to fetch client:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user (coach)
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const { clientId } = await params

    // Find the client
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Verify the client belongs to this coach
    if (client.coachId !== coach.id) {
      return NextResponse.json(
        { error: 'You can only delete your own clients' },
        { status: 403 }
      )
    }

    // Only allow deletion of pending clients
    if (client.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending clients can be deleted' },
        { status: 400 }
      )
    }

    // Delete the client
    await prisma.user.delete({
      where: { id: clientId },
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
