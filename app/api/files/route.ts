import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const files = await prisma.file.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      files,
    })
  } catch (error) {
    console.error('Failed to fetch files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, fileUrl, fileType, fileSize } = body

    if (!name || !fileUrl) {
      return NextResponse.json(
        { error: 'Name and file URL are required' },
        { status: 400 }
      )
    }

    const file = await prisma.file.create({
      data: {
        name,
        description,
        fileUrl,
        fileType,
        fileSize,
        uploadedBy: session.user.name || session.user.email || 'Coach',
      },
    })

    return NextResponse.json({
      success: true,
      file,
    })
  } catch (error) {
    console.error('Failed to create file:', error)
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}
