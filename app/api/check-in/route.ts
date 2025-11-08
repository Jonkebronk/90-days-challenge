import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      statusUpdate,
      weightKg,
      energyLevel,
      mood,
      dietPlanAdherence,
      workoutPlanAdherence,
      sleepNotes,
      dailySteps,
      photoFront,
      photoSide,
      photoBack,
    } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Create check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        userId,
        statusUpdate,
        weightKg: weightKg ? parseFloat(weightKg) : null,
        energyLevel,
        mood,
        dietPlanAdherence,
        workoutPlanAdherence,
        sleepNotes,
        dailySteps,
        photoFront,
        photoSide,
        photoBack,
      },
    })

    console.log('Check-in created for user:', userId)

    // Get user's coach to send check-in summary message
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coachId: true, name: true }
    })

    if (user?.coachId) {
      // Create check-in summary message
      const summaryLines = []
      summaryLines.push(`Veckorapport från ${user.name}`)
      summaryLines.push('')

      if (statusUpdate) {
        summaryLines.push(`Status: ${statusUpdate}`)
        summaryLines.push('')
      }

      if (weightKg) {
        summaryLines.push(`Vikt: ${weightKg} kg`)
      }

      if (energyLevel) {
        summaryLines.push(`Energinivå: ${'⭐'.repeat(energyLevel)} (${energyLevel}/5)`)
      }

      if (mood) {
        const moodEmojis = ['😢', '😟', '😐', '🙂', '😊']
        summaryLines.push(`Humör: ${moodEmojis[mood - 1]} (${mood}/5)`)
      }

      if (dietPlanAdherence) {
        summaryLines.push(`Kostschema följsamhet: ${'⭐'.repeat(dietPlanAdherence)} (${dietPlanAdherence}/5)`)
      }

      if (workoutPlanAdherence) {
        summaryLines.push(`Träningsschema följsamhet: ${'⭐'.repeat(workoutPlanAdherence)} (${workoutPlanAdherence}/5)`)
      }

      if (sleepNotes) {
        summaryLines.push(``)
        summaryLines.push(`Sömn: ${sleepNotes}`)
      }

      if (dailySteps) {
        summaryLines.push(`Dagliga steg: ${dailySteps}`)
      }

      // Collect progress photos for message
      const progressPhotos: string[] = []
      if (photoFront) progressPhotos.push(photoFront)
      if (photoSide) progressPhotos.push(photoSide)
      if (photoBack) progressPhotos.push(photoBack)

      if (progressPhotos.length > 0) {
        summaryLines.push('')
        summaryLines.push(`📸 ${progressPhotos.length} framstegsbilder bifogade`)
      }

      await prisma.message.create({
        data: {
          content: summaryLines.join('\n'),
          senderId: userId,
          receiverId: user.coachId,
          isCheckInSummary: true,
          checkInId: checkIn.id,
          images: progressPhotos
        }
      })

      console.log('Check-in summary message sent to coach')
    }

    return NextResponse.json({
      success: true,
      checkIn,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json(
      { error: 'Failed to save check-in' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get all check-ins for user
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      checkIns,
    })
  } catch (error) {
    console.error('Failed to fetch check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
