import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📋 Rangerar om kategorier...\n')

  try {
    // Önskad ordning
    const categoryOrder = [
      { slug: 'frukost', orderIndex: 1 },
      { slug: 'lunch', orderIndex: 2 },
      { slug: 'mellanmal', orderIndex: 3 },
      { slug: 'tips-pa-tillagning', orderIndex: 4 },
      { slug: 'saser', orderIndex: 5 },
    ]

    console.log('Ny ordning:')

    for (const { slug, orderIndex } of categoryOrder) {
      const category = await prisma.recipeCategory.findFirst({
        where: { slug }
      })

      if (category) {
        await prisma.recipeCategory.update({
          where: { id: category.id },
          data: { orderIndex }
        })
        console.log(`   ${orderIndex}. ${category.name}`)
      } else {
        console.log(`   ⚠️  Kategori med slug "${slug}" hittades inte`)
      }
    }

    console.log('\n📊 Verifierar ordning:')

    const categories = await prisma.recipeCategory.findMany({
      include: {
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (${cat._count.recipes} recept) - orderIndex: ${cat.orderIndex}`)
    })

    console.log('\n🎉 Omrangering klar!')

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
