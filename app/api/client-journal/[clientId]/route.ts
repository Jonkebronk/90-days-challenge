import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current coach
    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!coach || coach.role !== 'coach') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Fetch complete client data
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
        coachId: coach.id, // Ensure this is the coach's client
      },
      include: {
        userProfile: true,
        checkIns: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        nutritionPlan: true,
        caloriePlan: true,
        workoutPlan: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Try to find related lead (by email match)
    const lead = await prisma.lead.findFirst({
      where: {
        email: client.email,
      },
    })

    // Calculate some stats
    const checkInStats = {
      total: client.checkIns.length,
      thisMonth: client.checkIns.filter(
        (ci) =>
          new Date(ci.createdAt).getMonth() === new Date().getMonth() &&
          new Date(ci.createdAt).getFullYear() === new Date().getFullYear()
      ).length,
    }

    // Weight progression - calculate average from weekly weights
    const weightData = client.checkIns
      .map((ci) => {
        // Collect all weekly weights
        const weights = [
          ci.mondayWeight,
          ci.tuesdayWeight,
          ci.wednesdayWeight,
          ci.thursdayWeight,
          ci.fridayWeight,
          ci.saturdayWeight,
          ci.sundayWeight,
        ].filter((w) => w !== null) as any[]

        // Calculate average if any weights exist
        if (weights.length > 0) {
          const avgWeight = weights.reduce((sum, w) => sum + Number(w), 0) / weights.length
          return {
            date: ci.createdAt,
            weight: avgWeight,
            weekNumber: ci.weekNumber,
          }
        }
        return null
      })
      .filter((data) => data !== null)
      .reverse() // Oldest first

    // Photos timeline
    const photoTimeline = client.checkIns
      .filter((ci) => ci.photoFront || ci.photoSide || ci.photoBack)
      .map((ci) => ({
        date: ci.createdAt,
        weekNumber: ci.weekNumber,
        photoFront: ci.photoFront,
        photoSide: ci.photoSide,
        photoBack: ci.photoBack,
      }))
      .reverse() // Oldest first

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        status: client.status,
        createdAt: client.createdAt,
        membershipStartDate: client.membershipStartDate,
        // Personal info
        firstName: client.firstName,
        lastName: client.lastName,
        birthdate: client.birthdate,
        gender: client.gender,
        phone: client.phone,
        country: client.country,
        tags: client.tags,
        checkInFrequency: client.checkInFrequency,
        checkInPeriod: client.checkInPeriod,
        checkInDay: client.checkInDay,
      },
      profile: client.userProfile,
      lead: lead,
      checkIns: client.checkIns,
      stats: {
        checkIns: checkInStats,
        currentWeight: client.checkIns[0]?.weightKg || client.userProfile?.currentWeightKg,
        startWeight: client.userProfile?.currentWeightKg,
      },
      progression: {
        weight: weightData,
        photos: photoTimeline,
      },
      plans: {
        nutrition: client.nutritionPlan,
        calories: client.caloriePlan,
        workout: client.workoutPlan,
      },
    })
  } catch (error) {
    console.error('Failed to fetch client journal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client journal' },
      { status: 500 }
    )
  }
}
