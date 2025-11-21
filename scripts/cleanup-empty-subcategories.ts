import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Tar bort tomma subkategorier och uppdaterar namn...\n')

  try {
    // 1. Hitta och radera tomma subkategorier
    const allSubcategories = await prisma.recipeSubcategory.findMany({
      include: {
        _count: {
          select: { recipes: true }
        }
      }
    })

    console.log('📊 Tomma subkategorier:')
    const emptySubcategories = allSubcategories.filter(s => s._count.recipes === 0)

    for (const subcat of emptySubcategories) {
      console.log(`   → ${subcat.name} (${subcat._count.recipes} recept)`)
      await prisma.recipeSubcategory.delete({
        where: { id: subcat.id }
      })
    }

    console.log(`\n✓ Raderade ${emptySubcategories.length} tomma subkategorier\n`)

    // 2. Byt namn på "Keso & Kvarg" till "Keso & Kvarg & Grekisk yoghurt"
    const kesoKvargSubcat = await prisma.recipeSubcategory.findFirst({
      where: { slug: 'keso-kvarg' }
    })

    if (kesoKvargSubcat) {
      await prisma.recipeSubcategory.update({
        where: { id: kesoKvargSubcat.id },
        data: {
          name: 'Keso & Kvarg & Grekisk yoghurt'
        }
      })
      console.log('✓ Bytte namn: "Keso & Kvarg" → "Keso & Kvarg & Grekisk yoghurt"\n')
    }

    // 3. Visa uppdaterad lista
    console.log('📊 Kvarvarande subkategorier:')
    const remainingSubcategories = await prisma.recipeSubcategory.findMany({
      include: {
        category: true,
        _count: {
          select: { recipes: true }
        }
      },
      orderBy: [
        { categoryId: 'asc' },
        { orderIndex: 'asc' }
      ]
    })

    let currentCategory = ''
    remainingSubcategories.forEach(subcat => {
      if (subcat.category.name !== currentCategory) {
        console.log(`\n${subcat.category.name}:`)
        currentCategory = subcat.category.name
      }
      console.log(`   ${subcat.name}: ${subcat._count.recipes} recept`)
    })

    console.log('\n🎉 Städning klar!')

  } catch (error) {
    console.error('❌ Fel:', error)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
