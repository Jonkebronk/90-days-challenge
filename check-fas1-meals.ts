import { prisma } from './lib/prisma'

async function checkFas1() {
  const template = await prisma.mealPlanTemplate.findUnique({
    where: {
      id: 'cmhrn98r00000q80qevhh8vl9'
    },
    include: {
      meals: {
        select: {
          id: true,
          name: true,
          mealType: true,
          carbSource: true,
          proteinSource: true,
          fatSource: true,
        },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!template) {
    console.log('❌ Template not found')
    await prisma.$disconnect()
    return
  }

  console.log(`✅ Template: ${template.name}`)
  console.log(`\nMeals:`)
  console.log('='.repeat(70))

  template.meals.forEach((meal, index) => {
    console.log(`\n${index + 1}. ${meal.name} (${meal.mealType})`)
    console.log(`   carbSource:    ${meal.carbSource ? `"${meal.carbSource.substring(0, 50)}..."` : 'NULL'}`)
    console.log(`   proteinSource: ${meal.proteinSource ? `"${meal.proteinSource.substring(0, 50)}..."` : 'NULL'}`)
    console.log(`   fatSource:     ${meal.fatSource ? `"${meal.fatSource.substring(0, 50)}..."` : 'NULL'}`)
  })

  await prisma.$disconnect()
}

checkFas1()
