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

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { clientId } = await params

    // Check authorization:
    // - If CLIENT: can only view their own journal
    // - If COACH: can view their clients' journals
    if (currentUser.role === 'client') {
      if (currentUser.id !== clientId) {
        return NextResponse.json({ error: 'Unauthorized - can only view own journal' }, { status: 403 })
      }
    } else if (currentUser.role === 'coach') {
      // Coach can only view their own clients
      const isOwnClient = await prisma.user.findFirst({
        where: {
          id: clientId,
          coachId: currentUser.id,
        },
      })
      if (!isOwnClient) {
        return NextResponse.json({ error: 'Unauthorized - not your client' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized role' }, { status: 401 })
    }

    // Fetch complete client data
    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
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

    // Measurements timeline
    const measurementsTimeline = client.checkIns
      .filter((ci) => ci.chest || ci.waist || ci.hips || ci.butt || ci.arms || ci.thighs || ci.calves)
      .map((ci) => ({
        date: ci.createdAt,
        weekNumber: ci.weekNumber,
        chest: ci.chest,
        waist: ci.waist,
        hips: ci.hips,
        butt: ci.butt,
        arms: ci.arms,
        thighs: ci.thighs,
        calves: ci.calves,
      }))
      .reverse() // Oldest first

    // Biofeedback timeline for charts
    const biofeedbackTimeline = client.checkIns
      .filter((ci) =>
        ci.energyLevel || ci.sleepQuality || ci.stressLevel ||
        ci.hungerLevel || ci.recoveryLevel || ci.moodLevel
      )
      .map((ci) => ({
        date: ci.createdAt,
        weekNumber: ci.weekNumber,
        energyLevel: ci.energyLevel,
        sleepQuality: ci.sleepQuality,
        stressLevel: ci.stressLevel,
        hungerLevel: ci.hungerLevel,
        recoveryLevel: ci.recoveryLevel,
        moodLevel: ci.moodLevel,
      }))
      .reverse() // Oldest first for charts

    // Fetch workout sessions with ratings
    const workoutSessions = await prisma.workoutSessionLog.findMany({
      where: {
        userId: clientId,
        completed: true,
      },
      include: {
        workoutProgramDay: {
          select: { name: true, dayNumber: true },
        },
        sets: {
          include: {
            exercise: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 50, // Limit for performance
    })

    // Fetch personal records
    const personalRecordsRaw = await prisma.personalRecord.findMany({
      where: { userId: clientId },
      orderBy: { achievedAt: 'desc' },
    })

    // Fetch exercise names for PRs
    const prExerciseIds = [...new Set(personalRecordsRaw.map(pr => pr.exerciseId))]
    const prExercises = prExerciseIds.length > 0
      ? await prisma.exercise.findMany({
          where: { id: { in: prExerciseIds } },
          select: { id: true, name: true },
        })
      : []
    const exerciseMap = new Map(prExercises.map(e => [e.id, e.name]))

    // Map PRs with exercise names
    const personalRecords = personalRecordsRaw.map(pr => ({
      ...pr,
      exerciseName: exerciseMap.get(pr.exerciseId) || 'Okänd övning',
    }))

    // Calculate journey stats
    // Count weeks based on check-ins (excluding start check-in) or calculate from first check-in date
    const regularCheckIns = client.checkIns.filter(ci => !ci.isStartCheckIn)
    const startCheckIn = client.checkIns.find(ci => ci.isStartCheckIn)

    // Try weekNumber first, otherwise count regular check-ins as weeks
    const maxWeekNumber = Math.max(...client.checkIns.map(ci => ci.weekNumber || 0))
    const totalWeeks = maxWeekNumber > 0
      ? maxWeekNumber
      : regularCheckIns.length // Each regular check-in = 1 week
    const totalWorkouts = workoutSessions.length
    const totalPRs = personalRecords.length
    const ratingsWithValues = workoutSessions.filter(s => s.rating !== null)
    const averageSessionRating = ratingsWithValues.length > 0
      ? ratingsWithValues.reduce((sum, s) => sum + (s.rating || 0), 0) / ratingsWithValues.length
      : null

    // Fetch assigned workout program to get actual start date
    const assignedProgram = await prisma.assignedWorkoutProgram.findFirst({
      where: { userId: clientId },
      orderBy: { createdAt: 'desc' },
      select: { startDate: true },
    })

    // Calculate journey position based on actual start date
    let journeyStartDate: Date | null = null
    let daysSinceStart: number | null = null
    let currentWeek: number | null = null
    let currentPhase: number | null = null
    let phaseName: string | null = null

    // Priority: 1. AssignedWorkoutProgram.startDate, 2. Start check-in date, 3. membershipStartDate
    if (assignedProgram?.startDate) {
      journeyStartDate = new Date(assignedProgram.startDate)
    } else if (startCheckIn?.createdAt) {
      journeyStartDate = new Date(startCheckIn.createdAt)
    } else if (client.membershipStartDate) {
      journeyStartDate = new Date(client.membershipStartDate)
    }

    if (journeyStartDate) {
      const now = new Date()
      // Calculate days since start (day 1 = first day)
      const diffTime = now.getTime() - journeyStartDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      daysSinceStart = diffDays + 1 // Day 1 = first day

      // Calculate current week (week 1 = days 1-7)
      currentWeek = Math.ceil(daysSinceStart / 7)

      // Calculate phase (Fas 1: days 1-30, Fas 2: days 31-60, Fas 3: days 61-90)
      if (daysSinceStart <= 30) {
        currentPhase = 1
        phaseName = 'Fas 1: Grund'
      } else if (daysSinceStart <= 60) {
        currentPhase = 2
        phaseName = 'Fas 2: Uppbyggnad'
      } else if (daysSinceStart <= 90) {
        currentPhase = 3
        phaseName = 'Fas 3: Optimering'
      } else {
        currentPhase = 4
        phaseName = 'Fas 4: Underhåll'
      }
    }

    const journeyStats = {
      totalWeeks,
      totalWorkouts,
      totalPRs,
      averageSessionRating,
      // New journey position data
      journeyStartDate,
      daysSinceStart,
      currentWeek,
      currentPhase,
      phaseName,
    }

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
        currentWeight: (() => {
          // Get most recent check-in's average weight or fall back to profile weight
          const latestCheckIn = client.checkIns[0]
          if (latestCheckIn) {
            const weights = [
              latestCheckIn.mondayWeight,
              latestCheckIn.tuesdayWeight,
              latestCheckIn.wednesdayWeight,
              latestCheckIn.thursdayWeight,
              latestCheckIn.fridayWeight,
              latestCheckIn.saturdayWeight,
              latestCheckIn.sundayWeight,
            ].filter((w) => w !== null) as any[]

            if (weights.length > 0) {
              return weights.reduce((sum, w) => sum + Number(w), 0) / weights.length
            }
          }
          return client.userProfile?.currentWeightKg
        })(),
        startWeight: client.userProfile?.currentWeightKg,
      },
      progression: {
        weight: weightData,
        measurements: measurementsTimeline,
        photos: photoTimeline,
        biofeedback: biofeedbackTimeline,
      },
      plans: {
        nutrition: client.nutritionPlan,
        calories: client.caloriePlan,
        workout: client.workoutPlan,
      },
      // New data for Översikt dashboard
      workoutSessions: workoutSessions.map(s => ({
        id: s.id,
        completedAt: s.completedAt,
        durationMinutes: s.durationMinutes,
        rating: s.rating,
        ratingComment: s.ratingComment,
        notes: s.notes,
        templateName: s.templateName,
        workoutProgramDay: s.workoutProgramDay,
        sets: s.sets.map(set => ({
          exerciseId: set.exerciseId,
          exerciseName: set.exercise?.name || 'Okänd övning',
          setNumber: set.setNumber,
          reps: set.reps,
          weightKg: set.weightKg,
        })),
      })),
      personalRecords: personalRecords.map(pr => ({
        id: pr.id,
        exerciseId: pr.exerciseId,
        exerciseName: pr.exerciseName,
        recordType: pr.recordType,
        weightKg: pr.weightKg,
        reps: pr.reps,
        volume: pr.volume,
        oneRepMax: pr.oneRepMax,
        achievedAt: pr.achievedAt,
      })),
      journeyStats,
    })
  } catch (error) {
    console.error('Failed to fetch client journal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client journal' },
      { status: 500 }
    )
  }
}
