import { prisma } from './lib/prisma'

async function listTemplates() {
  const templates = await prisma.mealPlanTemplate.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: { meals: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  console.log('📋 Meal Plan Templates:')
  console.log('='.repeat(60))
  templates.forEach((t, i) => {
    console.log(`${i + 1}. "${t.name}" (${t._count.meals} meals) - ID: ${t.id}`)
  })

  await prisma.$disconnect()
}

listTemplates()
