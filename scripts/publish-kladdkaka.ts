import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📢 Publishing Kladdkaka med kaseinfluff...\n')

  const recipe = await prisma.recipe.findFirst({
    where: {
      title: { contains: 'Kladdkaka', mode: 'insensitive' }
    }
  })

  if (!recipe) {
    console.log('❌ Recipe not found!')
    return
  }

  const updated = await prisma.recipe.update({
    where: { id: recipe.id },
    data: {
      published: true,
      publishedAt: new Date()
    }
  })

  console.log(`✅ Recipe published: ${updated.title}`)
  console.log(`   Published: ${updated.published}`)
  console.log(`   Published At: ${updated.publishedAt}`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
