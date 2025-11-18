import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      statusUpdate,
      mondayWeight,
      tuesdayWeight,
      wednesdayWeight,
      thursdayWeight,
      fridayWeight,
      saturdayWeight,
      sundayWeight,
      chest,
      waist,
      hips,
      butt,
      arms,
      thighs,
      calves,
      trainedAllSessions,
      trainingComments,
      hadDietDeviations,
      dietComments,
      otherComments,
      photoFront,
      photoSide,
      photoBack,
      isStartCheckIn,
      weekNumber,
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
        weekNumber: weekNumber !== undefined ? weekNumber : null,
        isStartCheckIn: isStartCheckIn || false,
        // Daily weights
        mondayWeight: mondayWeight ? parseFloat(mondayWeight) : null,
        tuesdayWeight: tuesdayWeight ? parseFloat(tuesdayWeight) : null,
        wednesdayWeight: wednesdayWeight ? parseFloat(wednesdayWeight) : null,
        thursdayWeight: thursdayWeight ? parseFloat(thursdayWeight) : null,
        fridayWeight: fridayWeight ? parseFloat(fridayWeight) : null,
        saturdayWeight: saturdayWeight ? parseFloat(saturdayWeight) : null,
        sundayWeight: sundayWeight ? parseFloat(sundayWeight) : null,
        // Body measurements
        chest: chest ? parseFloat(chest) : null,
        waist: waist ? parseFloat(waist) : null,
        hips: hips ? parseFloat(hips) : null,
        butt: butt ? parseFloat(butt) : null,
        arms: arms ? parseFloat(arms) : null,
        thighs: thighs ? parseFloat(thighs) : null,
        calves: calves ? parseFloat(calves) : null,
        // Training and diet adherence
        trainedAllSessions,
        trainingComments,
        hadDietDeviations,
        dietComments,
        otherComments,
        // Photos
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
      if (isStartCheckIn) {
        summaryLines.push(`🎯 START CHECK-IN från ${user.name}`)
        summaryLines.push(`${user.name} har nu påbörjat sin 90-dagars resa!`)
      } else {
        summaryLines.push(`📋 Veckorapport från ${user.name}`)
      }
      summaryLines.push('')

      if (statusUpdate) {
        if (isStartCheckIn) {
          summaryLines.push(`💬 Berättelse om utgångspunkten:`)
        } else {
          summaryLines.push(`💬 Status:`)
        }
        summaryLines.push(statusUpdate)
        summaryLines.push('')
      }

      // Weekly weights summary (or starting weight for start check-in)
      const weights = []
      if (mondayWeight) weights.push(`Mån: ${mondayWeight} kg`)
      if (tuesdayWeight) weights.push(`Tis: ${tuesdayWeight} kg`)
      if (wednesdayWeight) weights.push(`Ons: ${wednesdayWeight} kg`)
      if (thursdayWeight) weights.push(`Tor: ${thursdayWeight} kg`)
      if (fridayWeight) weights.push(`Fre: ${fridayWeight} kg`)
      if (saturdayWeight) weights.push(`Lör: ${saturdayWeight} kg`)
      if (sundayWeight) weights.push(`Sön: ${sundayWeight} kg`)

      if (weights.length > 0) {
        if (isStartCheckIn) {
          summaryLines.push(`⚖️ Startvikt: ${mondayWeight} kg`)
        } else {
          summaryLines.push(`⚖️ Vikter för veckan:`)
          weights.forEach(w => summaryLines.push(w))
        }
        summaryLines.push('')
      }

      // Body measurements summary
      const measurements = []
      if (chest) measurements.push(`Bröst: ${chest} cm`)
      if (waist) measurements.push(`Midja: ${waist} cm`)
      if (hips) measurements.push(`Höfter: ${hips} cm`)
      if (butt) measurements.push(`Rumpa: ${butt} cm`)
      if (arms) measurements.push(`Armar: ${arms} cm`)
      if (thighs) measurements.push(`Lår: ${thighs} cm`)
      if (calves) measurements.push(`Vader: ${calves} cm`)

      if (measurements.length > 0) {
        summaryLines.push(`📏 Kroppsmått:`)
        measurements.forEach(m => summaryLines.push(m))
        summaryLines.push('')
      }

      // Training and diet adherence (only show for weekly check-ins, not start check-in)
      if (!isStartCheckIn) {
        if (trainedAllSessions !== null) {
          summaryLines.push(`💪 Tränat alla pass: ${trainedAllSessions ? 'Ja ✅' : 'Nej ❌'}`)
        }

        if (trainingComments) {
          summaryLines.push(`Träning denna vecka:`)
          summaryLines.push(trainingComments)
          summaryLines.push('')
        }

        if (hadDietDeviations !== null) {
          summaryLines.push(`🥗 Avsteg i kosten: ${hadDietDeviations ? 'Ja ⚠️' : 'Nej ✅'}`)
        }

        if (dietComments) {
          summaryLines.push(`Kost denna vecka:`)
          summaryLines.push(dietComments)
          summaryLines.push('')
        }
      }

      if (otherComments) {
        summaryLines.push(`📝 Övriga kommentarer:`)
        summaryLines.push(otherComments)
        summaryLines.push('')
      }

      // Collect progress photos for message
      const progressPhotos: string[] = []
      if (photoFront) progressPhotos.push(photoFront)
      if (photoSide) progressPhotos.push(photoSide)
      if (photoBack) progressPhotos.push(photoBack)

      if (progressPhotos.length > 0) {
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
