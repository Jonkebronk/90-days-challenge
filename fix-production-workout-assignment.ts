import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixProductionAssignment() {
  try {
    console.log('🔍 Söker efter användare...')

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'jonkebronk@gmail.com' },
      select: { id: true, email: true, coachId: true }
    })

    if (!user) {
      console.log('❌ Användare hittades inte')
      return
    }

    console.log('✅ Användare hittad:', user.email, '(', user.id, ')')

    // Find the correct program
    const program = await prisma.workoutProgram.findFirst({
      where: {
        name: {
          contains: 'Första fasen - fokus underkropp'
        }
      },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' }
        }
      }
    })

    if (!program) {
      console.log('❌ Program hittades inte')
      return
    }

    console.log('✅ Program hittat:', program.name, '(', program.id, ')')
    console.log('   Antal dagar:', program.days.length)

    // Delete all old assignments for this user
    const deleted = await prisma.assignedWorkoutProgram.deleteMany({
      where: {
        userId: user.id
      }
    })

    console.log('🗑️  Raderade', deleted.count, 'gamla tilldelningar')

    // Create new assignment
    const assignment = await prisma.assignedWorkoutProgram.create({
      data: {
        userId: user.id,
        workoutProgramId: program.id,
        coachId: user.coachId!,
        startDate: new Date(),
        active: true
      }
    })

    console.log('✅ Ny tilldelning skapad:', assignment.id)
    console.log('\n🎉 Klart! Användaren kan nu starta sitt workout.')
    console.log('\nDe nya dag-ID:na är:')
    program.days.forEach(day => {
      console.log(`  - Dag ${day.dayNumber}: ${day.id}`)
    })

  } catch (error) {
    console.error('❌ Fel:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixProductionAssignment()
