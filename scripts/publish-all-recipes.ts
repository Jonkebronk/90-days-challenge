import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📢 Publicerar alla opublicerade recept...')

  try {
    // Hitta alla opublicerade recept
    const unpublishedRecipes = await prisma.recipe.findMany({
      where: { published: false },
      select: {
        id: true,
        title: true,
      }
    })

    console.log(`\nHittade ${unpublishedRecipes.length} opublicerade recept`)

    if (unpublishedRecipes.length === 0) {
      console.log('✓ Alla recept är redan publicerade!')
      return
    }

    // Publicera alla
    const result = await prisma.recipe.updateMany({
      where: { published: false },
      data: {
        published: true,
        publishedAt: new Date()
      }
    })

    console.log(`\n✓ Publicerade ${result.count} recept!`)

    // Verifiera
    const totalPublished = await prisma.recipe.count({ where: { published: true } })
    const totalRecipes = await prisma.recipe.count()

    console.log(`\n📊 Statistik:`)
    console.log(`   Total recept: ${totalRecipes}`)
    console.log(`   Publicerade: ${totalPublished}`)
    console.log(`   Opublicerade: ${totalRecipes - totalPublished}`)

  } catch (error) {
    console.error('❌ Fel vid publicering av recept:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
