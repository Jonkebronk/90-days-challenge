import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const tipsCategory = await prisma.recipeCategory.findFirst({
    where: { slug: 'tips' }
  })

  if (tipsCategory) {
    const count = await prisma.recipe.count({
      where: { categoryId: tipsCategory.id }
    })

    if (count === 0) {
      await prisma.recipeCategory.delete({
        where: { id: tipsCategory.id }
      })
      console.log('✓ Raderade tomma "Tips"-kategorin')
    } else {
      console.log(`⚠️  "Tips" har ${count} recept, kan inte radera`)
    }
  } else {
    console.log('ℹ️  "Tips"-kategorin finns inte')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
