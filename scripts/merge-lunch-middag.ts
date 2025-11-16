import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Slår ihop Lunch och Middag kategorier...\n')

  // 1. Update Lunch category to "Lunch & Middag"
  const lunch = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (lunch) {
    await prisma.recipeCategory.update({
      where: { id: lunch.id },
      data: {
        name: 'Lunch & Middag',
        description: 'Huvudrätter för lunch och middag'
      }
    })
    console.log('✅ Uppdaterade Lunch till "Lunch & Middag"')
  }

  // 2. Delete Middag category (if it has no recipes)
  const middag = await prisma.recipeCategory.findFirst({
    where: { slug: 'middag' },
    include: { _count: { select: { recipes: true } } }
  })

  if (middag && middag._count.recipes === 0) {
    await prisma.recipeCategory.delete({
      where: { id: middag.id }
    })
    console.log('✅ Raderade Middag-kategorin')
  }

  // 3. Delete Kvällsmål category (if it has no recipes)
  const kvallsmal = await prisma.recipeCategory.findFirst({
    where: { slug: 'kvallsmal' },
    include: { _count: { select: { recipes: true } } }
  })

  if (kvallsmal && kvallsmal._count.recipes === 0) {
    await prisma.recipeCategory.delete({
      where: { id: kvallsmal.id }
    })
    console.log('✅ Raderade Kvällsmål-kategorin')
  }

  console.log('\n📊 Nya kategorier:')
  const categories = await prisma.recipeCategory.findMany({
    include: {
      _count: { select: { recipes: true } }
    },
    orderBy: { name: 'asc' }
  })

  categories.forEach(cat => {
    console.log(`- ${cat.name}: ${cat._count.recipes} recept`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
