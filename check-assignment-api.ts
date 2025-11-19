import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAssignment() {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: 'jonkebronk@gmail.com' },
      select: { id: true, email: true }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', user.email, '(', user.id, ')')

    // Get their workout assignment
    const assignment = await prisma.assignedWorkoutProgram.findFirst({
      where: {
        userId: user.id
      },
      include: {
        workoutProgram: {
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                exercises: {
                  include: {
                    exercise: true
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        }
      }
    })

    if (!assignment) {
      console.log('❌ No assignment found')
      return
    }

    console.log('\n✅ Assignment found:', assignment.id)
    console.log('Program:', assignment.workoutProgram.name)
    console.log('Days:', assignment.workoutProgram.days.length)
    console.log('\nDay IDs:')
    assignment.workoutProgram.days.forEach(day => {
      console.log(`  - Day ${day.dayNumber}: ${day.id} (${day.isRestDay ? 'Rest Day' : day.exercises.length + ' exercises'})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAssignment()
