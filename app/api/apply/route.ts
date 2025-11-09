import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/apply - Public endpoint for application submissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.fullName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Namn, e-post och telefon är obligatoriska' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Ogiltig e-postadress' },
        { status: 400 }
      )
    }

    // Check if lead with this email already exists
    const existingLead = await prisma.lead.findFirst({
      where: { email: body.email }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'En ansökan med denna e-post existerar redan' },
        { status: 400 }
      )
    }

    // Create the lead with all application data
    const lead = await prisma.lead.create({
      data: {
        // Basic Info
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        city: body.city,
        country: body.country,
        age: body.age ? parseInt(body.age) : null,
        gender: body.gender,
        height: body.height ? parseInt(body.height) : null,
        currentWeight: body.currentWeight ? parseFloat(body.currentWeight) : null,

        // Training
        currentTraining: body.currentTraining,
        trainingExperience: body.trainingExperience,
        trainingGoal: body.trainingGoal,
        injuries: body.injuries,
        availableTime: body.availableTime,
        preferredSchedule: body.preferredSchedule,

        // Nutrition
        dietHistory: body.dietHistory,
        macroExperience: body.macroExperience,
        digestionIssues: body.digestionIssues,
        allergies: body.allergies,
        favoriteFood: body.favoriteFood,
        dislikedFood: body.dislikedFood,
        supplements: body.supplements,
        previousCoaching: body.previousCoaching,

        // Lifestyle
        stressLevel: body.stressLevel,
        sleepHours: body.sleepHours,
        occupation: body.occupation,
        lifestyle: body.lifestyle,

        // Motivation
        whyJoin: body.whyJoin,
        canFollowPlan: body.canFollowPlan,
        expectations: body.expectations,
        biggestChallenges: body.biggestChallenges,

        // Photos
        frontPhoto: body.frontPhoto,
        sidePhoto: body.sidePhoto,
        backPhoto: body.backPhoto,

        // Status
        status: 'NEW',
        tags: ['web-ansokan'],
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Ansökan mottagen framgångsrikt',
      leadId: lead.id,
    })
  } catch (error: any) {
    console.error('Failed to create application:', error)
    return NextResponse.json(
      {
        error: 'Ett fel uppstod vid hantering av din ansökan',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
