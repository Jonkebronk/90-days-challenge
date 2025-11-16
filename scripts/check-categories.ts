import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.recipeCategory.findMany({
    include: {
      _count: {
        select: { recipes: true }
      }
    },
    orderBy: { name: 'asc' }
  })

  console.log('📊 Receptkategorier:\n')
  categories.forEach(cat => {
    console.log(`- ${cat.name} (slug: ${cat.slug}): ${cat._count.recipes} recept`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
