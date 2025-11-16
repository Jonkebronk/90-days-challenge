import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const total = await prisma.recipe.count()
  const published = await prisma.recipe.count({ where: { published: true } })

  console.log(`Total recipes: ${total}`)
  console.log(`Published recipes: ${published}`)
  console.log(`\nAll recipes:`)

  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      title: true,
      published: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' }
  })

  recipes.forEach((r, i) => {
    console.log(`${i + 1}. ${r.published ? '✓' : '✗'} ${r.title}`)
  })
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
