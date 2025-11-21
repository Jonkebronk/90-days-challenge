import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const categories = await prisma.recipeCategory.findMany()

  console.log('Recipe Categories:')
  categories.forEach(c => {
    console.log(`- ${c.name} (slug: ${c.slug})`)
  })
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
