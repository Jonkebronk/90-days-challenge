import { prisma } from './lib/prisma'

async function checkMealData() {
  // Find the "FAS 1" template
  const template = await prisma.mealPlanTemplate.findFirst({
    where: {
      name: { contains: 'FAS 1' }
    },
    include: {
      meals: {
        select: {
          id: true,
          name: true,
          carbSource: true,
          proteinSource: true,
          fatSource: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!template) {
    console.log('❌ FAS 1 template not found')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Found template: ${template.name}`)
  console.log(`\nMeals in ${template.name}:`)
  console.log('='.repeat(60))

  template.meals.forEach((meal, index) => {
    console.log(`\n${index + 1}. ${meal.name}`)
    console.log(`   carbSource: ${meal.carbSource || 'NULL'}`)
    console.log(`   proteinSource: ${meal.proteinSource || 'NULL'}`)
    console.log(`   fatSource: ${meal.fatSource || 'NULL'}`)
  })

  await prisma.$disconnect()
}

checkMealData()
