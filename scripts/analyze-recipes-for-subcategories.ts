import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📊 Analyserar recept för subkategorier...\n')

  try {
    // Frukost
    const frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' },
      include: {
        recipes: {
          select: { id: true, title: true },
          orderBy: { title: 'asc' }
        }
      }
    })

    if (frukostCategory) {
      console.log('=== FRUKOST (138 recept) ===\n')
      frukostCategory.recipes.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`)
      })
      console.log('\n')
    }

    // Lunch & Middag
    const lunchCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lunch' },
      include: {
        recipes: {
          select: { id: true, title: true },
          orderBy: { title: 'asc' }
        }
      }
    })

    if (lunchCategory) {
      console.log('=== LUNCH & MIDDAG (123 recept) ===\n')
      lunchCategory.recipes.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`)
      })
      console.log('\n')
    }

    // Mellanmål
    const mellanmalCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'mellanmal' },
      include: {
        recipes: {
          select: { id: true, title: true },
          orderBy: { title: 'asc' }
        }
      }
    })

    if (mellanmalCategory) {
      console.log('=== MELLANMÅL (16 recept) ===\n')
      mellanmalCategory.recipes.forEach((r, i) => {
        console.log(`${i + 1}. ${r.title}`)
      })
      console.log('\n')
    }

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
