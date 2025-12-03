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
        phone: client.phone,
        city: client.city,
        country: client.country,
        age: client.age,
        gender: client.gender,
        height: client.height,
        currentWeight: client.currentWeight ? Number(client.currentWeight) : null,
        // Training
        currentTraining: client.currentTraining,
        trainingExperience: client.trainingExperience,
        trainingGoal: client.trainingGoal,
        injuries: client.injuries,
        availableTime: client.availableTime,
        preferredSchedule: client.preferredSchedule,
        // Nutrition
        dietHistory: client.dietHistory,
        macroExperience: client.macroExperience,
        digestionIssues: client.digestionIssues,
        allergies: client.allergies,
        favoriteFood: client.favoriteFood,
        dislikedFood: client.dislikedFood,
        supplements: client.supplements,
        previousCoaching: client.previousCoaching,
        // Lifestyle
        stressLevel: client.stressLevel,
        sleepHours: client.sleepHours,
        occupation: client.occupation,
        lifestyle: client.lifestyle,
        // Motivation
        whyJoin: client.whyJoin,
        canFollowPlan: client.canFollowPlan,
        expectations: client.expectations,
        biggestChallenges: client.biggestChallenges,
        // Photos
        frontPhoto: client.frontPhoto,
        sidePhoto: client.sidePhoto,
        backPhoto: client.backPhoto,
        // Meta
        createdAt: client.createdAt,
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

// PATCH /api/clients/[clientId] - Update client data
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coach = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!coach) {
      return NextResponse.json({ error: 'Coach not found' }, { status: 404 })
    }

    const { clientId } = await params

    const client = await prisma.user.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (client.coachId !== coach.id) {
      return NextResponse.json(
        { error: 'You can only update your own clients' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update client with provided fields
    const updatedClient = await prisma.user.update({
      where: { id: clientId },
      data: {
        phone: body.phone !== undefined ? body.phone : undefined,
        city: body.city !== undefined ? body.city : undefined,
        country: body.country !== undefined ? body.country : undefined,
        age: body.age !== undefined ? (body.age ? parseInt(body.age) : null) : undefined,
        gender: body.gender !== undefined ? body.gender : undefined,
        height: body.height !== undefined ? (body.height ? parseInt(body.height) : null) : undefined,
        currentWeight: body.currentWeight !== undefined ? (body.currentWeight ? parseFloat(body.currentWeight) : null) : undefined,
        occupation: body.occupation !== undefined ? body.occupation : undefined,
        // Training
        currentTraining: body.currentTraining !== undefined ? body.currentTraining : undefined,
        trainingExperience: body.trainingExperience !== undefined ? body.trainingExperience : undefined,
        trainingGoal: body.trainingGoal !== undefined ? body.trainingGoal : undefined,
        injuries: body.injuries !== undefined ? body.injuries : undefined,
        availableTime: body.availableTime !== undefined ? body.availableTime : undefined,
        preferredSchedule: body.preferredSchedule !== undefined ? body.preferredSchedule : undefined,
        // Nutrition
        dietHistory: body.dietHistory !== undefined ? body.dietHistory : undefined,
        macroExperience: body.macroExperience !== undefined ? body.macroExperience : undefined,
        digestionIssues: body.digestionIssues !== undefined ? body.digestionIssues : undefined,
        allergies: body.allergies !== undefined ? body.allergies : undefined,
        favoriteFood: body.favoriteFood !== undefined ? body.favoriteFood : undefined,
        dislikedFood: body.dislikedFood !== undefined ? body.dislikedFood : undefined,
        supplements: body.supplements !== undefined ? body.supplements : undefined,
        previousCoaching: body.previousCoaching !== undefined ? body.previousCoaching : undefined,
        // Lifestyle
        stressLevel: body.stressLevel !== undefined ? body.stressLevel : undefined,
        sleepHours: body.sleepHours !== undefined ? body.sleepHours : undefined,
        lifestyle: body.lifestyle !== undefined ? body.lifestyle : undefined,
        // Motivation
        whyJoin: body.whyJoin !== undefined ? body.whyJoin : undefined,
        canFollowPlan: body.canFollowPlan !== undefined ? body.canFollowPlan : undefined,
        expectations: body.expectations !== undefined ? body.expectations : undefined,
        biggestChallenges: body.biggestChallenges !== undefined ? body.biggestChallenges : undefined,
      },
    })

    return NextResponse.json({ success: true, client: updatedClient })
  } catch (error) {
    console.error('Failed to update client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
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
