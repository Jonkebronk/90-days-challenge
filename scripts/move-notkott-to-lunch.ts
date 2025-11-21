import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥩 Flyttar Nötkött-recept till Lunch & Middag...\n')

  try {
    const notkottCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'notkott' }
    })

    const lunchCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lunch' }
    })

    if (!notkottCategory || !lunchCategory) {
      throw new Error('Kategorierna hittades inte!')
    }

    // Hämta alla Nötkött-recept
    const notkottRecipes = await prisma.recipe.findMany({
      where: { categoryId: notkottCategory.id },
      select: { id: true, title: true }
    })

    console.log(`Flyttar ${notkottRecipes.length} recept från "Nötkött" till "Lunch & Middag":\n`)
    notkottRecipes.forEach(r => console.log(`   → ${r.title}`))

    // Flytta recepten
    await prisma.recipe.updateMany({
      where: { categoryId: notkottCategory.id },
      data: { categoryId: lunchCategory.id }
    })

    console.log('\n✓ Recept flyttade!')

    // Radera tom Nötkött-kategori
    const remainingCount = await prisma.recipe.count({
      where: { categoryId: notkottCategory.id }
    })

    if (remainingCount === 0) {
      await prisma.recipeCategory.delete({
        where: { id: notkottCategory.id }
      })
      console.log('✓ Raderade tomma "Nötkött"-kategorin\n')
    }

    // Visa slutresultat
    const lunchCount = await prisma.recipe.count({
      where: { categoryId: lunchCategory.id }
    })

    console.log(`📊 Lunch & Middag har nu ${lunchCount} recept`)

    console.log('\n🎉 Klart!')

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
