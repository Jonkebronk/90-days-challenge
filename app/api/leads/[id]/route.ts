import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, status, notes, tags } = body

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
      },
    })

    return NextResponse.json({
      success: true,
      lead,
    })
  } catch (error) {
    console.error('Failed to update lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.lead.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Failed to delete lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
