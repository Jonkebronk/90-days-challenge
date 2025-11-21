import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📦 Reorganiserar receptkategorier...\n')

  try {
    // 1. Hitta alla kategorier
    const tipsCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'tips' } })
    const tipsPaTillagningCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'tips-pa-tillagning' } })
    const laxCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'lax' } })
    const rakorCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'rakor' } })
    const kalkonCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'kalkon' } })
    const myhappKottCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'myhapp-kott' } })
    const notkottCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'notkott' } })
    const kycklingCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'kyckling' } })
    const lunchCategory = await prisma.recipeCategory.findFirst({ where: { slug: 'lunch' } })

    if (!lunchCategory) {
      throw new Error('Lunch & Middag kategori hittades inte!')
    }

    console.log('✓ Hittade alla kategorier\n')

    // 2. Flytta "Tips" recept till "Tips på tillagning"
    if (tipsCategory && tipsPaTillagningCategory) {
      const tipsRecipes = await prisma.recipe.findMany({
        where: { categoryId: tipsCategory.id },
        select: { id: true, title: true }
      })

      console.log(`📝 Flyttar ${tipsRecipes.length} recept från "Tips" till "Tips på tillagning"...`)

      await prisma.recipe.updateMany({
        where: { categoryId: tipsCategory.id },
        data: { categoryId: tipsPaTillagningCategory.id }
      })

      tipsRecipes.forEach(r => console.log(`   → ${r.title}`))
      console.log()
    }

    // 3. Flytta "Lax" recept till "Lunch & Middag"
    if (laxCategory) {
      const laxRecipes = await prisma.recipe.findMany({
        where: { categoryId: laxCategory.id },
        select: { id: true, title: true }
      })

      console.log(`🐟 Flyttar ${laxRecipes.length} recept från "Lax" till "Lunch & Middag"...`)

      await prisma.recipe.updateMany({
        where: { categoryId: laxCategory.id },
        data: { categoryId: lunchCategory.id }
      })

      laxRecipes.forEach(r => console.log(`   → ${r.title}`))
      console.log()
    }

    // 4. Flytta "Räkor" recept till "Lunch & Middag"
    if (rakorCategory) {
      const rakorRecipes = await prisma.recipe.findMany({
        where: { categoryId: rakorCategory.id },
        select: { id: true, title: true }
      })

      console.log(`🦐 Flyttar ${rakorRecipes.length} recept från "Räkor" till "Lunch & Middag"...`)

      await prisma.recipe.updateMany({
        where: { categoryId: rakorCategory.id },
        data: { categoryId: lunchCategory.id }
      })

      rakorRecipes.forEach(r => console.log(`   → ${r.title}`))
      console.log()
    }

    // 5. Flytta "Kalkon" recept till "Lunch & Middag"
    if (kalkonCategory) {
      const kalkonRecipes = await prisma.recipe.findMany({
        where: { categoryId: kalkonCategory.id },
        select: { id: true, title: true }
      })

      console.log(`🦃 Flyttar ${kalkonRecipes.length} recept från "Kalkon" till "Lunch & Middag"...`)

      await prisma.recipe.updateMany({
        where: { categoryId: kalkonCategory.id },
        data: { categoryId: lunchCategory.id }
      })

      kalkonRecipes.forEach(r => console.log(`   → ${r.title}`))
      console.log()
    }

    // 6. Flytta "Myhapp Kött" recept till "Nötkött"
    if (myhappKottCategory && notkottCategory) {
      const myhappRecipes = await prisma.recipe.findMany({
        where: { categoryId: myhappKottCategory.id },
        select: { id: true, title: true }
      })

      console.log(`🥩 Flyttar ${myhappRecipes.length} recept från "Myhapp Kött" till "Nötkött"...`)

      await prisma.recipe.updateMany({
        where: { categoryId: myhappKottCategory.id },
        data: { categoryId: notkottCategory.id }
      })

      myhappRecipes.forEach(r => console.log(`   → ${r.title}`))
      console.log()
    }

    // 7. Flytta "Kyckling" recept till "Lunch & Middag"
    if (kycklingCategory) {
      const kycklingRecipes = await prisma.recipe.findMany({
        where: { categoryId: kycklingCategory.id },
        select: { id: true, title: true }
      })

      console.log(`🍗 Flyttar ${kycklingRecipes.length} recept från "Kyckling" till "Lunch & Middag"...`)

      await prisma.recipe.updateMany({
        where: { categoryId: kycklingCategory.id },
        data: { categoryId: lunchCategory.id }
      })

      kycklingRecipes.forEach(r => console.log(`   → ${r.title}`))
      console.log()
    }

    // 8. Visa slutresultat
    console.log('\n📊 Slutresultat efter omorganisering:')
    const categories = await prisma.recipeCategory.findMany({
      include: {
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    categories.forEach(cat => {
      if (cat._count.recipes > 0) {
        console.log(`   ${cat.name}: ${cat._count.recipes} recept`)
      }
    })

    console.log('\n🎉 Omorganisering klar!')

  } catch (error) {
    console.error('❌ Fel vid omorganisering:', error)
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
