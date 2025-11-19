import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCategories() {
  try {
    // Create 90-Day Challenge category
    const category90Days = await prisma.workoutProgramCategory.upsert({
      where: { slug: '90-dagars-challenge' },
      update: {},
      create: {
        name: '90-Dagars Challenge',
        description: 'Träningsprogram för 90-dagars utmaningen',
        slug: '90-dagars-challenge',
        icon: 'Trophy',
        color: '#FFD700',
        orderIndex: 0
      }
    })

    console.log('✅ Created category:', category90Days.name)

    // Find all programs with "fasen" in the name and assign them to this category
    const programsToUpdate = await prisma.workoutProgram.findMany({
      where: {
        OR: [
          { name: { contains: 'fasen', mode: 'insensitive' } },
          { name: { contains: 'Tredje', mode: 'insensitive' } },
          { name: { contains: 'Andra', mode: 'insensitive' } },
          { name: { contains: 'Första', mode: 'insensitive' } }
        ],
        categoryId: null
      }
    })

    console.log(`Found ${programsToUpdate.length} programs to categorize`)

    for (const program of programsToUpdate) {
      await prisma.workoutProgram.update({
        where: { id: program.id },
        data: { categoryId: category90Days.id }
      })
      console.log(`  ✅ Assigned "${program.name}" to ${category90Days.name}`)
    }

    console.log('\n✅ Done!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCategories()
