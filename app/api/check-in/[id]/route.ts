import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/check-in/[id]
 * Get a single check-in by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = (session.user as any).id

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            coachId: true,
          },
        },
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    // Authorization: owner or coach of owner
    const isOwner = checkIn.userId === userId
    const isCoach = checkIn.user.coachId === userId

    if (!isOwner && !isCoach) {
      return NextResponse.json(
        { error: 'You do not have access to this check-in' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      checkIn,
    })
  } catch (error) {
    console.error('Failed to fetch check-in:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-in' },
      { status: 500 }
    )
  }
}

// Allowed fields for editing (only numeric fields)
const EDITABLE_WEIGHT_FIELDS = [
  'mondayWeight',
  'tuesdayWeight',
  'wednesdayWeight',
  'thursdayWeight',
  'fridayWeight',
  'saturdayWeight',
  'sundayWeight',
] as const

const EDITABLE_MEASUREMENT_FIELDS = [
  'chest',
  'waist',
  'hips',
  'butt',
  'arms',
  'thighs',
  'calves',
] as const

const EDITABLE_BIOFEEDBACK_FIELDS = [
  'energyLevel',
  'sleepQuality',
  'stressLevel',
  'hungerLevel',
  'recoveryLevel',
  'moodLevel',
] as const

type EditableFields = {
  mondayWeight?: number | null
  tuesdayWeight?: number | null
  wednesdayWeight?: number | null
  thursdayWeight?: number | null
  fridayWeight?: number | null
  saturdayWeight?: number | null
  sundayWeight?: number | null
  chest?: number | null
  waist?: number | null
  hips?: number | null
  butt?: number | null
  arms?: number | null
  thighs?: number | null
  calves?: number | null
  energyLevel?: number | null
  sleepQuality?: number | null
  stressLevel?: number | null
  hungerLevel?: number | null
  recoveryLevel?: number | null
  moodLevel?: number | null
}

/**
 * PATCH /api/check-in/[id]
 * Update a check-in (only numeric fields)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = (session.user as any).id
    const body = (await request.json()) as EditableFields

    // Fetch the check-in to verify access
    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            coachId: true,
          },
        },
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    // Authorization: owner or coach of owner
    const isOwner = checkIn.userId === userId
    const isCoach = checkIn.user.coachId === userId

    if (!isOwner && !isCoach) {
      return NextResponse.json(
        { error: 'You do not have access to edit this check-in' },
        { status: 403 }
      )
    }

    // Build update data - only allow editable fields
    const updateData: Record<string, number | null> = {}

    // Process weight fields
    for (const field of EDITABLE_WEIGHT_FIELDS) {
      if (field in body) {
        const value = body[field]
        updateData[field] = value !== null && value !== undefined ? Number(value) : null
      }
    }

    // Process measurement fields
    for (const field of EDITABLE_MEASUREMENT_FIELDS) {
      if (field in body) {
        const value = body[field]
        updateData[field] = value !== null && value !== undefined ? Number(value) : null
      }
    }

    // Process biofeedback fields (integers 1-10)
    for (const field of EDITABLE_BIOFEEDBACK_FIELDS) {
      if (field in body) {
        const value = body[field]
        if (value !== null && value !== undefined) {
          const intValue = Math.round(Number(value))
          // Clamp to 1-10 range
          updateData[field] = Math.max(1, Math.min(10, intValue))
        } else {
          updateData[field] = null
        }
      }
    }

    // Update the check-in
    const updatedCheckIn = await prisma.checkIn.update({
      where: { id },
      data: updateData,
    })

    // Also update the message content if this check-in has an associated message
    const message = await prisma.message.findFirst({
      where: { checkInId: id },
    })

    if (message) {
      // Rebuild the summary message with updated values
      const summaryLines = []

      if (checkIn.isStartCheckIn) {
        summaryLines.push(`🎯 START CHECK-IN från ${checkIn.user.name}`)
        summaryLines.push(`${checkIn.user.name} har nu påbörjat sin resa!`)
      } else {
        summaryLines.push(`📋 Veckorapport från ${checkIn.user.name}`)
      }
      summaryLines.push('')

      // Weekly weights summary
      const weights = []
      const weightFields = [
        { field: 'mondayWeight', day: 'Mån' },
        { field: 'tuesdayWeight', day: 'Tis' },
        { field: 'wednesdayWeight', day: 'Ons' },
        { field: 'thursdayWeight', day: 'Tor' },
        { field: 'fridayWeight', day: 'Fre' },
        { field: 'saturdayWeight', day: 'Lör' },
        { field: 'sundayWeight', day: 'Sön' },
      ]

      for (const { field, day } of weightFields) {
        const value = (updatedCheckIn as any)[field]
        if (value !== null && value !== undefined) {
          weights.push(`${day}: ${Number(value)} kg`)
        }
      }

      if (weights.length > 0) {
        if (checkIn.isStartCheckIn) {
          summaryLines.push(`⚖️ Startvikt: ${Number(updatedCheckIn.mondayWeight)} kg`)
        } else {
          summaryLines.push(`⚖️ Vikter för veckan:`)
          weights.forEach((w) => summaryLines.push(w))
        }
        summaryLines.push('')
      }

      // Body measurements summary
      const measurements = []
      const measurementFields = [
        { field: 'chest', label: 'Bröst' },
        { field: 'waist', label: 'Midja' },
        { field: 'hips', label: 'Höfter' },
        { field: 'butt', label: 'Rumpa' },
        { field: 'arms', label: 'Armar' },
        { field: 'thighs', label: 'Lår' },
        { field: 'calves', label: 'Vader' },
      ]

      for (const { field, label } of measurementFields) {
        const value = (updatedCheckIn as any)[field]
        if (value !== null && value !== undefined) {
          measurements.push(`${label}: ${Number(value)} cm`)
        }
      }

      if (measurements.length > 0) {
        summaryLines.push(`📏 Kroppsmått:`)
        measurements.forEach((m) => summaryLines.push(m))
        summaryLines.push('')
      }

      // Biofeedback summary (only for weekly check-ins)
      if (!checkIn.isStartCheckIn) {
        const biofeedback = []
        const biofeedbackFields = [
          { field: 'energyLevel', label: 'Energi' },
          { field: 'sleepQuality', label: 'Sömn' },
          { field: 'stressLevel', label: 'Stress' },
          { field: 'hungerLevel', label: 'Hunger' },
          { field: 'recoveryLevel', label: 'Återhämtning' },
          { field: 'moodLevel', label: 'Humör' },
        ]

        for (const { field, label } of biofeedbackFields) {
          const value = (updatedCheckIn as any)[field]
          if (value !== null && value !== undefined) {
            biofeedback.push(`${label}: ${value}/10`)
          }
        }

        if (biofeedback.length > 0) {
          summaryLines.push(`🧠 Biofeedback:`)
          biofeedback.forEach((b) => summaryLines.push(b))
          summaryLines.push('')
        }

        // Training and diet adherence
        if (checkIn.trainedAllSessions !== null) {
          summaryLines.push(
            `💪 Tränat alla pass: ${checkIn.trainedAllSessions ? 'Ja ✅' : 'Nej ❌'}`
          )
        }

        if (checkIn.trainingComments) {
          summaryLines.push(`Träning denna vecka:`)
          summaryLines.push(checkIn.trainingComments)
          summaryLines.push('')
        }

        if (checkIn.hadDietDeviations !== null) {
          summaryLines.push(
            `🥗 Avsteg i kosten: ${checkIn.hadDietDeviations ? 'Ja ⚠️' : 'Nej ✅'}`
          )
        }

        if (checkIn.dietComments) {
          summaryLines.push(`Kost denna vecka:`)
          summaryLines.push(checkIn.dietComments)
          summaryLines.push('')
        }
      }

      if (checkIn.otherComments) {
        summaryLines.push(`📝 Övriga kommentarer:`)
        summaryLines.push(checkIn.otherComments)
        summaryLines.push('')
      }

      // Add note about photos if any exist
      const photos = [checkIn.photoFront, checkIn.photoSide, checkIn.photoBack].filter(
        Boolean
      )
      if (photos.length > 0) {
        summaryLines.push(`📸 ${photos.length} framstegsbilder bifogade`)
      }

      // Update the message content
      await prisma.message.update({
        where: { id: message.id },
        data: {
          content: summaryLines.join('\n'),
          editedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      checkIn: updatedCheckIn,
      message: 'Check-in uppdaterad',
    })
  } catch (error) {
    console.error('Failed to update check-in:', error)
    return NextResponse.json(
      { error: 'Failed to update check-in' },
      { status: 500 }
    )
  }
}
