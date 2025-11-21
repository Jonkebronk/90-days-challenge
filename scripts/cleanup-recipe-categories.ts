import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Städar upp receptkategorier...\n')

  try {
    // 1. Hitta alla såskategorier
    const kvargSaserCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'kvarg-saser' } })
    const saserCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'saser' } })
    const sasCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'sas' } })

    // 2. Slå ihop alla såser till "Såser"
    if (saserCategory) {
      console.log('🥫 Slår ihop alla såskategorier till "Såser"...\n')

      // Flytta recept från "Kvarg såser" till "Såser"
      if (kvargSaserCategory) {
        const kvargRecipes = await prisma.recipe.findMany({
          where: { categoryId: kvargSaserCategory.id },
          select: { id: true, title: true }
        })

        if (kvargRecipes.length > 0) {
          console.log(`   Flyttar ${kvargRecipes.length} recept från "Kvarg såser" till "Såser":`)
          await prisma.recipe.updateMany({
            where: { categoryId: kvargSaserCategory.id },
            data: { categoryId: saserCategory.id }
          })
          kvargRecipes.forEach(r => console.log(`      → ${r.title}`))
          console.log()
        }
      }

      // Flytta recept från "Sås" till "Såser"
      if (sasCategory) {
        const sasRecipes = await prisma.recipe.findMany({
          where: { categoryId: sasCategory.id },
          select: { id: true, title: true }
        })

        if (sasRecipes.length > 0) {
          console.log(`   Flyttar ${sasRecipes.length} recept från "Sås" till "Såser":`)
          await prisma.recipe.updateMany({
            where: { categoryId: sasCategory.id },
            data: { categoryId: saserCategory.id }
          })
          sasRecipes.forEach(r => console.log(`      → ${r.title}`))
          console.log()
        }
      }
    }

    // 3. Radera tomma kategorier
    const categoriesToDelete = [
      { slug: 'lax', name: 'Lax' },
      { slug: 'kalkon', name: 'Kalkon' },
      { slug: 'rakor', name: 'Räkor' },
      { slug: 'myhapp-kott', name: 'Myhapp Kött' },
      { slug: 'kyckling', name: 'Kyckling' },
      { slug: 'kvarg-saser', name: 'Kvarg såser' },
      { slug: 'sas', name: 'Sås' },
    ]

    console.log('🗑️  Raderar tomma kategorier:\n')

    for (const catInfo of categoriesToDelete) {
      const category = await prisma.recipeCategory.findFirst({
        where: { slug: catInfo.slug },
        include: {
          _count: {
            select: { recipes: true }
          }
        }
      })

      if (category) {
        if (category._count.recipes === 0) {
          await prisma.recipeCategory.delete({
            where: { id: category.id }
          })
          console.log(`   ✓ Raderade "${catInfo.name}" (0 recept)`)
        } else {
          console.log(`   ⚠️  Hoppade över "${catInfo.name}" (har ${category._count.recipes} recept)`)
        }
      }
    }

    // 4. Visa slutresultat
    console.log('\n📊 Kvarvarande kategorier efter städning:')
    const categories = await prisma.recipeCategory.findMany({
      include: {
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    categories.forEach(cat => {
      console.log(`   ${cat.name}: ${cat._count.recipes} recept`)
    })

    const totalRecipes = categories.reduce((sum, cat) => sum + cat._count.recipes, 0)
    console.log(`\n   Total: ${totalRecipes} recept`)

    console.log('\n🎉 Städning klar!')

  } catch (error) {
    console.error('❌ Fel vid städning:', error)
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
